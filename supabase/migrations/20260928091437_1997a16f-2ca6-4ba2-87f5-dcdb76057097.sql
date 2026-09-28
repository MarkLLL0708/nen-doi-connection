
-- roles
alter table public.daily_questions drop constraint daily_questions_pack_check;
alter table public.daily_questions add constraint daily_questions_pack_check check (pack in ('memory','family','tet','food','fun','money','distance','conflict','deep'));
do $$ begin create type public.app_role as enum ('admin','moderator','user'); exception when duplicate_object then null; end $$;
create table if not exists public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role public.app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- admin editing of content
grant insert, update, delete on public.daily_questions, public.game_content, public.photo_prompts, public.date_ideas to authenticated;
create policy "admin manage" on public.daily_questions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage" on public.game_content for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage" on public.photo_prompts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin manage" on public.date_ideas for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- occasion catalogue
create table public.occasion_catalog (id uuid primary key default gen_random_uuid(), kind text not null unique, title_vi text not null, ideas_vi jsonb not null default '[]'::jsonb, sort_order int not null default 0, created_at timestamptz not null default now());
grant select, insert, update, delete on public.occasion_catalog to authenticated;
grant all on public.occasion_catalog to service_role;
alter table public.occasion_catalog enable row level security;
create policy "signed in read" on public.occasion_catalog for select to authenticated using (true);
create policy "admin manage" on public.occasion_catalog for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- sensitive pack consent
create table public.pack_consents (couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null default auth.uid(), agreed boolean not null, decided_at timestamptz not null default now(), primary key (couple_id, user_id));
grant select, insert, update on public.pack_consents to authenticated;
grant all on public.pack_consents to service_role;
alter table public.pack_consents enable row level security;
create policy "couple reads consents" on public.pack_consents for select to authenticated using (couple_id = public.my_couple_id());
create policy "insert own consent" on public.pack_consents for insert to authenticated with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "update own consent" on public.pack_consents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- daily assignment
create table public.couple_questions (couple_id uuid not null references public.couples(id) on delete cascade, day date not null, question_id uuid not null references public.daily_questions(id) on delete cascade, created_at timestamptz not null default now(), primary key (couple_id, day));
grant select on public.couple_questions to authenticated;
grant all on public.couple_questions to service_role;
alter table public.couple_questions enable row level security;
create policy "couple reads assignments" on public.couple_questions for select to authenticated using (couple_id = public.my_couple_id());

create unique index if not exists question_answers_one_per_day on public.question_answers (user_id, question_id, answer_date);

-- reactions & replies
create table public.answer_reactions (id uuid primary key default gen_random_uuid(), answer_id uuid not null references public.question_answers(id) on delete cascade, couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null default auth.uid(), kind text not null check (kind in ('heart','laugh','fire','hug')), created_at timestamptz not null default now(), unique (answer_id, user_id, kind));
grant select, insert, delete on public.answer_reactions to authenticated;
grant all on public.answer_reactions to service_role;
alter table public.answer_reactions enable row level security;
create policy "read reactions on visible answers" on public.answer_reactions for select to authenticated using (couple_id = public.my_couple_id() and exists (select 1 from public.question_answers a where a.id = answer_id));
create policy "react to visible answers" on public.answer_reactions for insert to authenticated with check (user_id = auth.uid() and couple_id = public.my_couple_id() and exists (select 1 from public.question_answers a where a.id = answer_id and a.couple_id = public.my_couple_id()));
create policy "remove own reaction" on public.answer_reactions for delete to authenticated using (user_id = auth.uid());

create table public.answer_replies (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, question_id uuid not null references public.daily_questions(id) on delete cascade, answer_date date not null, user_id uuid not null default auth.uid(), body text not null check (length(body) between 1 and 1000), created_at timestamptz not null default now());
grant select, insert, delete on public.answer_replies to authenticated;
grant all on public.answer_replies to service_role;
alter table public.answer_replies enable row level security;
create policy "read replies after answering" on public.answer_replies for select to authenticated using (couple_id = public.my_couple_id() and public.has_answered(question_id, answer_date));
create policy "reply after answering" on public.answer_replies for insert to authenticated with check (user_id = auth.uid() and couple_id = public.my_couple_id() and public.has_answered(question_id, answer_date));
create policy "delete own reply" on public.answer_replies for delete to authenticated using (user_id = auth.uid());

-- today's question for my couple
create or replace function public.today_question() returns jsonb language plpgsql security definer set search_path = public as $$
declare cid uuid := public.my_couple_id(); tz text; d date; qid uuid; sens boolean; q public.daily_questions%rowtype; mine boolean; theirs boolean;
begin
  if cid is null then return null; end if;
  select timezone into tz from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  sens := (select count(*) from public.pack_consents where couple_id = cid and agreed) >= 2;
  select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  if qid is null then
    select dq.id into qid from public.daily_questions dq
      where sens or dq.pack not in ('family','money')
      order by (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id), random() limit 1;
    if qid is null then return null; end if;
    insert into public.couple_questions (couple_id, day, question_id) values (cid, d, qid) on conflict do nothing;
    select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  end if;
  select * into q from public.daily_questions where id = qid;
  select agreed into mine from public.pack_consents where couple_id = cid and user_id = auth.uid();
  select agreed into theirs from public.pack_consents where couple_id = cid and user_id <> auth.uid();
  return jsonb_build_object('date', d, 'id', q.id, 'pack', q.pack, 'text_vi', q.text_vi, 'text_vi_north', q.text_vi_north, 'text_vi_south', q.text_vi_south,
    'sensitive_on', sens, 'consent_mine', mine, 'consent_partner', theirs,
    'partner_answered', exists (select 1 from public.question_answers a where a.couple_id = cid and a.question_id = q.id and a.answer_date = d and a.user_id <> auth.uid()));
end $$;
revoke execute on function public.today_question() from anon, public;
grant execute on function public.today_question() to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- ===== SEED (idempotent) =====
insert into public.daily_questions (pack, sensitivity, text_vi, sort_order)
select v.pack, v.sens, v.txt, v.ord from (values
('memory','normal','Điều nhỏ nhặt nào {partner} làm gần đây khiến bạn thấy được yêu thương?',1),
('memory','normal','Lần đầu gặp {partner}, bạn đã nghĩ gì trong đầu?',2),
('memory','normal','Bài hát nào khiến bạn nhớ đến {partner}?',3),
('memory','normal','Khoảnh khắc nào của hai đứa mình bạn muốn quay lại một lần nữa?',4),
('memory','normal','Quán cà phê hay quán ăn nào là "quán của tụi mình", và vì sao?',5),
('family','high','Bạn nhớ gì về lần đầu gặp bố mẹ {partner} (hoặc {partner} gặp bố mẹ bạn)? Lúc đó bạn hồi hộp nhất ở điểm nào?',1),
('family','high','Món nào trong bữa cơm gia đình {partner} khiến bạn nhớ nhất?',2),
('family','high','Bạn thấy gia đình hai bên giống và khác nhau ở điểm nào?',3),
('family','high','Khi người lớn hỏi "bao giờ cưới?", bạn muốn hai đứa mình trả lời thế nào?',4),
('family','high','Truyền thống nào của gia đình bạn mà bạn muốn giữ lại cho gia đình nhỏ của mình?',5),
('family','high','Điều gì ở cách bố mẹ yêu nhau khiến bạn muốn học theo, hoặc không muốn lặp lại?',6),
('family','high','Nếu hai bên gia đình có ý kiến khác nhau về chuyện của tụi mình, bạn muốn hai đứa xử lý ra sao?',7),
('family','high','Sau này, bạn thấy sống riêng hay sống cùng bố mẹ thoải mái hơn?',8),
('tet','normal','Món Tết nào bạn không thể thiếu (bánh chưng, bánh tét, mứt, dưa hành, thịt đông...)?',1),
('tet','normal','Bạn nhớ nhất phong bao lì xì năm nào, và vì sao?',2),
('tet','normal','Năm nay bạn muốn đón giao thừa ở đâu cùng {partner}?',3),
('tet','normal','Mùng 1, mùng 2, mùng 3 Tết: bạn muốn hai đứa mình chia thời gian thế nào giữa hai gia đình và giữa hai đứa?',4),
('tet','normal','Món quà 8/3 hoặc 20/10 nào {partner} tặng bạn khiến bạn nhớ mãi?',5),
('tet','normal','Nếu chỉ được chọn một ngày lễ để ăn mừng thật to cùng {partner}, bạn chọn ngày nào?',6),
('food','normal','Nếu chỉ được ăn một món suốt tuần cùng {partner}: phở, bún chả, cơm tấm hay bánh mì?',1),
('food','normal','Món mẹ nấu nào bạn muốn {partner} thử một lần?',2),
('food','normal','Món nào {partner} nấu (hoặc gọi) mà bạn mê nhất?',3),
('food','normal','Bữa ăn nào của hai đứa mình bạn nhớ nhất?',4),
('food','normal','Bạn thích ăn cay đến mức nào, và {partner} có theo kịp không?',5),
('fun','normal','Biệt danh đáng yêu (hoặc kỳ cục) nhất tụi mình từng gọi nhau là gì?',1),
('fun','normal','Nếu hai đứa lên TikTok, trend nào tụi mình sẽ đu cùng nhau?',2),
('fun','normal','Lần {partner} dỗi bạn buồn cười nhất là khi nào?',3),
('fun','normal','Emoji nào {partner} dùng nhiều nhất?',4),
('fun','normal','Nếu cuộc sống của hai đứa mình là một bộ phim, tên phim sẽ là gì?',5),
('fun','normal','Một lần bạn "seen" tin nhắn của {partner} mà bạn vẫn thấy tội lỗi?',6),
('money','high','Bạn muốn hai đứa chia tiền hẹn hò như thế nào: ai trả, chia đôi hay luân phiên?',1),
('money','high','Mục tiêu lớn nhất bạn muốn đạt trong 3 năm tới là gì (nhà, xe, du lịch, kinh doanh...)?',2),
('money','high','Bạn thấy hai đứa có nên có một quỹ chung không? Nếu có, dùng cho việc gì?',3),
('money','high','Bạn lo lắng điều gì nhất về chuyện tiền bạc khi sống cùng nhau?',4),
('money','high','Năm năm nữa, bạn muốn cuộc sống của hai đứa mình trông như thế nào?',5),
('distance','normal','Điều gì {partner} làm từ xa khiến bạn thấy gần nhất?',1),
('distance','normal','Lần gặp lại tới, bạn muốn hai đứa làm điều gì đầu tiên?',2),
('distance','normal','Khoảnh khắc nào trong ngày bạn nhớ {partner} nhất?',3),
('distance','normal','Chúng mình có thể làm gì mỗi tuần để đỡ nhớ nhau hơn?',4),
('conflict','normal','Khi giận, bạn cần {partner} làm gì trước tiên: nói chuyện ngay, hay cho bạn thời gian yên tĩnh?',1),
('conflict','normal','Lần nào tụi mình cãi nhau mà bạn thấy hai đứa hiểu nhau hơn sau đó?',2),
('conflict','normal','Câu nói nào của {partner} luôn làm bạn nguôi giận?',3),
('conflict','normal','Điều gì khiến bạn dỗi nhưng khó nói ra?',4),
('deep','normal','Có điều gì bạn muốn {partner} hiểu về bạn hơn không?',1),
('deep','normal','Bạn sợ điều gì nhất trong mối quan hệ này, và bạn cần {partner} làm gì để bớt sợ?',2),
('deep','normal','Theo bạn, chúng mình mạnh nhất ở điểm nào khi gặp khó khăn?',3)
) as v(pack, sens, txt, ord)
where not exists (select 1 from public.daily_questions d where d.text_vi = v.txt);

insert into public.game_content (type, content, sort_order)
select 'who_more_likely', jsonb_build_object('text_vi', v.txt), v.ord from (values
('Ai dễ quên chìa khóa hoặc ví hơn?',1),('Ai dễ khóc khi xem phim hơn?',2),('Ai dễ đặt đồ ăn về thay vì nấu hơn?',3),('Ai dễ dỗi trước hơn?',4),
('Ai dễ làm lành trước hơn?',5),('Ai dễ đến trễ hơn?',6),('Ai dễ "chốt đơn" trong ngày sale 11/11 hơn?',7),('Ai dễ "chốt đơn" trên livestream lúc nửa đêm hơn?',8),
('Ai dễ ngủ quên giữa lúc xem phim hơn?',9),('Ai dễ làm quen với người lạ ở quán cà phê hơn?',10),('Ai dễ đi lạc dù đã bật Google Maps hơn?',11),('Ai dễ "seen" mà không trả lời hơn?',12),
('Ai dễ nhớ ngày kỷ niệm hơn?',13),('Ai ăn cay giỏi hơn?',14),('Ai dễ được bố mẹ hai bên cưng hơn?',15),('Ai dễ mở karaoke rồi hát "hết mình" hơn?',16),
('Ai dễ gọi trà sữa full topping hơn?',17),('Ai dễ quên sạc điện thoại hơn?',18),('Ai dễ khóc trong đám cưới hơn?',19),('Ai dễ nói giọng địa phương hơn mỗi khi về quê?',20)
) as v(txt, ord)
where not exists (select 1 from public.game_content g where g.type = 'who_more_likely' and g.content->>'text_vi' = v.txt);

insert into public.game_content (type, content, sort_order)
select 'this_or_that', jsonb_build_object('a', v.a, 'b', v.b), v.ord from (values
('Về quê ăn Tết','Đi du lịch Tết',1),('Bánh chưng','Bánh tét',2),('Mứt','Hạt dưa',3),('Trà sữa','Cà phê',4),('Cà phê muối','Bạc xỉu',5),
('Phở Hà Nội','Hủ tiếu Sài Gòn',6),('Bún đậu mắm tôm','Lẩu',7),('Xe máy dạo phố','Đi bộ',8),('Chợ truyền thống','Siêu thị',9),('Zalo','Messenger',10),
('Nhắn tin','Gọi điện',11),('Nhậu với bạn','Ở nhà với người yêu',12),('Cưới truyền thống','Cưới đơn giản',13),('Đà Lạt','Đà Nẵng',14),('Rạp chiếu phim','Nằm nhà xem Netflix',15),
('Ở nhà nấu ăn','Đi ăn hàng',16),('Bất ngờ','Lên kế hoạch trước',17),('Biển mùa hè','Núi mùa đông',18),('Karaoke','Board game',19),('Ngủ nướng cuối tuần','Dậy sớm đi chơi',20)
) as v(a, b, ord)
where not exists (select 1 from public.game_content g where g.type = 'this_or_that' and g.content->>'a' = v.a and g.content->>'b' = v.b);

insert into public.photo_prompts (text_vi, sort_order)
select v.txt, v.ord from (values
('Chụp món bạn đang ăn',1),('Chụp bầu trời hôm nay',2),('Chụp góc làm việc của bạn',3),('Chụp đôi giày bạn đang mang',4),('Chụp thứ khiến bạn mỉm cười hôm nay',5),
('Chụp ly cà phê hoặc trà sữa của bạn',6),('Selfie mặt mộc',7),('Chụp khung cảnh ngoài cửa sổ',8),('Chụp bàn tay bạn',9),('Chụp thứ bạn định tặng {partner}',10),
('Chụp con đường bạn đi làm hoặc đi học mỗi ngày',11),('Chụp bữa cơm hôm nay',12),('Chụp món đồ ăn vặt yêu thích',13),('Chụp thứ khiến bạn nhớ đến {partner}',14)
) as v(txt, ord)
where not exists (select 1 from public.photo_prompts p where p.text_vi = v.txt);

insert into public.date_ideas (title_vi, city, budget, mood)
select v.t, v.c, case v.b when 'Miễn phí' then 'free' when 'Dưới 200k' then 'low' else 'mid' end, v.m from (values
('Dạo Hồ Tây lúc hoàng hôn rồi ăn bánh tôm','Hà Nội','Dưới 200k','Lãng mạn'),
('Cà phê trứng trong phố cổ rồi đi bộ quanh Hồ Gươm vào cuối tuần','Hà Nội','Dưới 200k','Lãng mạn'),
('Tour ăn vặt phố cổ: chọn 5 món, mỗi người chấm điểm','Hà Nội','Dưới 200k','Ăn uống'),
('Đạp xe quanh Hồ Tây buổi sáng sớm','Hà Nội','Miễn phí','Ngoài trời'),
('Mùa thu Hà Nội: nhặt lá và ăn cốm, hồng','Hà Nội','Dưới 200k','Lãng mạn'),
('Xem phim ở rạp nhỏ rồi ăn bún chả','Hà Nội','200k–500k','Yên tĩnh'),
('Cà phê ở các tiệm trong chung cư cũ rồi dạo phố đi bộ Nguyễn Huệ','TP.HCM','Dưới 200k','Yên tĩnh'),
('Ăn hải sản và ăn vặt ở phố ẩm thực Quận 4','TP.HCM','200k–500k','Ăn uống'),
('Đi Thảo Cầm Viên hoặc công viên Tao Đàn buổi sáng cuối tuần','TP.HCM','Miễn phí','Ngoài trời'),
('Đi chợ Bến Thành mua đồ ăn, rồi về nấu chung','TP.HCM','Dưới 200k','Vui nhộn'),
('Dạo phố sách Nguyễn Văn Bình rồi uống cà phê','TP.HCM','Dưới 200k','Yên tĩnh'),
('Ngắm hoàng hôn trên sông Sài Gòn bằng xe buýt sông','TP.HCM','Dưới 200k','Lãng mạn'),
('Dậy sớm ngắm bình minh ở biển Mỹ Khê','Đà Nẵng','Miễn phí','Lãng mạn'),
('Thuê xe máy đi đèo Hải Vân','Đà Nẵng','200k–500k','Ngoài trời'),
('Ăn mì Quảng và bánh xèo rồi đi dạo bên sông Hàn','Đà Nẵng','Dưới 200k','Ăn uống'),
('Đạp xe quanh hồ Xuân Hương và uống sữa đậu nành nóng','Đà Lạt','Dưới 200k','Lãng mạn'),
('Săn mây và cà phê lúc bình minh','Đà Lạt','200k–500k','Lãng mạn'),
('Ăn lẩu gà lá é và nướng bánh tráng buổi tối','Đà Lạt','200k–500k','Ăn uống'),
('Cùng nấu một món mà cả hai chưa từng thử',null,'Dưới 200k','Vui nhộn'),
('Làm gốm hoặc vẽ tranh cùng nhau ở một workshop',null,'200k–500k','Vui nhộn'),
('Picnic ở công viên gần nhà, mỗi người mang một món',null,'Dưới 200k','Yên tĩnh'),
('Karaoke chỉ hai đứa, hát toàn bài kỷ niệm',null,'200k–500k','Vui nhộn'),
('Ngày "không điện thoại": hai đứa đi chơi mà chỉ chụp bằng máy phim hoặc không chụp',null,'Miễn phí','Lãng mạn'),
('Đi chợ đêm, mỗi người chọn một món cho người kia',null,'Dưới 200k','Ăn uống')
) as v(t, c, b, m)
where not exists (select 1 from public.date_ideas d where d.title_vi = v.t);

insert into public.occasion_catalog (kind, title_vi, ideas_vi, sort_order)
select v.k, v.t, v.i::jsonb, v.o from (values
('tet','Tết Nguyên Đán','["Cùng gói bánh chưng hoặc bánh tét một buổi","Chuẩn bị bao lì xì nhỏ cho nhau, kèm một lời chúc viết tay","Đi chợ hoa đêm 28 Tết rồi chọn một cành mang về"]',1),
('midautumn','Rằm Trung Thu','["Tự làm bánh nướng, bánh dẻo ở nhà","Đi dạo phố lồng đèn rồi ngắm trăng rằm","Tặng nhau một chiếc lồng đèn giấy tự làm"]',2),
('qixi','Thất Tịch','["Ăn chè đậu đỏ cùng nhau cho may mắn","Viết cho nhau một lá thư mở vào Thất Tịch năm sau","Tối đó ra chỗ vắng đèn ngắm sao"]',3),
('valentine','Valentine 14/2','["Tự nấu bữa tối ở nhà thay vì chen nhau ở nhà hàng","Tặng một bó hoa nhỏ kèm tấm thiệp viết tay","Xem lại bộ phim hai đứa xem chung lần đầu"]',4),
('women','Quốc tế Phụ nữ 8/3','["Một bó hoa và một ngày không phải lo việc nhà","Đặt lịch spa hoặc làm tóc cho người ấy","Nấu món người ấy thích nhất"]',5),
('whiteValentine','Valentine Trắng 14/3','["Đáp lễ bằng hộp chocolate trắng tự làm","Một buổi hẹn cà phê bất ngờ giữa tuần","Món quà nhỏ gắn với một kỷ niệm của hai đứa"]',6),
('vnWomen','Ngày Phụ nữ Việt Nam 20/10','["Hoa và một bữa tối do bạn tự tay nấu","Một món quà người ấy từng nhắc mà chưa mua","Đưa người ấy đi ăn quán hồi mới quen"]',7),
('christmas','Giáng Sinh','["Đi dạo nhà thờ và phố trang trí đêm Noel","Đổi quà bí mật, giới hạn 200k","Trang trí một cây thông nhỏ cùng nhau"]',8),
('days100','100 ngày yêu','["Làm một cuốn album 100 tấm ảnh nhỏ","Quay lại nơi hẹn hò đầu tiên","Mỗi người viết ra 10 điều mình thích ở người kia"]',9)
) as v(k, t, i, o)
where not exists (select 1 from public.occasion_catalog c where c.kind = v.k);
