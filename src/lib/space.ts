// A "space" is a row in `couples`; `kind` decides content and wording (couple = người yêu, friends = bạn thân).
import i18n from "@/i18n";

export type SpaceKind = "couple" | "friends";

/** Copy that differs for a friends space. Keys are i18n paths; values replace the couple wording while a friends space is active. */
const FRIENDS: Record<"vi" | "en", Record<string, unknown>> = {
  vi: {
    "feat.thumb.metaTitle": "Đập tay · Nến Đôi", "feat.thumb.title": "Đập tay", "feat.thumb.open": "Đập tay", "feat.thumb.openSub": "Cùng chạm vào một lúc, dù đang ở đâu.",
    "feat.thumb.synced": "Đập tay rồi! {{partner}} cũng đang ở đây.", "feat.thumb.solo": "Kết nối bạn thân xong mới đập tay được nhé.",
    "feat.thumb.count": "Hai đứa đã đập tay {{count}} lần", "feat.thumb.hint": "Giữ ngón tay trên vòng tròn. Hai đứa cùng giữ là đập tay.", "feat.thumb.nudge": "Rủ {{partner}} đập tay",
    "feat.notif.thumb_nudge": "{{partner}} rủ bạn đập tay. Vào ngay nhé!", "feat.notif.thumb_synced": "Đập tay thành công với {{partner}}!",
    "sample.daysLabel": "ngày là bạn của nhau",
    "tabs.date": "Đi chơi",
    "feat.explore.desc.family": "Tuổi thơ, gia đình và chuyện nhà mỗi đứa.", "feat.explore.desc.money": "Tiền bạc, ranh giới và kèo chia tiền.", "feat.explore.desc.distance": "Giữ thân khi mỗi đứa một nơi.",
    "question.packs.family": "TUỔI THƠ & GIA ĐÌNH", "question.packs.money": "TIỀN BẠC & RANH GIỚI",
    "question.packs.distance": "BẠN XA", "question.packs.conflict": "GIẬN NHAU & LÀM LÀNH",

    "app.meta.pairTitle": "Mời bạn thân · Nến Đôi", "app.meta.pairDesc": "Gửi mã cho bạn thân để bắt đầu.",
    "app.meta.homeDesc": "Số ngày làm bạn, chuỗi lửa và việc hôm nay của hai bạn.",
    "app.setup.choice.label": "MỜI BẠN THÂN",
    "app.setup.start.label": "QUEN NHAU TỪ", "app.setup.start.q": "Hai bạn quen nhau từ ngày nào?",
    "app.setup.call.label": "XƯNG HÔ", "app.setup.call.q": "Hai đứa xưng hô thế nào?",
    "app.setup.type.label": "TÌNH BẠN", "app.setup.type.q": "Hai bạn là bạn kiểu gì?",
    "app.setup.consent.q": "Chuyện của hai người là của hai người.",
    "app.pair.label": "MỜI BẠN THÂN", "app.pair.title": "Mời bạn thân: gửi mã này cho {{partner}}.",
    "app.pair.note": "Mã dùng được 7 ngày. {{partner}} nhập mã hoặc bấm đường dẫn là hai bạn vào chung một không gian.",
    "app.pair.shareText": "Mời bạn thân vào Nến Đôi với mình nha. Mã mời: {{code}}",
    "app.pair.join": "Vào chung", "app.pair.joined": "Hai bạn đã vào chung một không gian.", "app.pair.full": "Không gian này đã đủ hai người.",
    "app.pair.already": "Bạn đang ở trong một không gian rồi.",
    "app.join.body": "Mã mời của bạn: {{code}}",
    "app.home.milestone.days": "{{count}} ngày là bạn của nhau. Đáng ăn mừng.",
    "app.home.milestone.anniv": "Thêm một năm làm bạn. Chúc mừng hai bạn.",
    "app.occasionNames.anniversary": "{{count}} NĂM QUEN NHAU",
    "app.home.occasionNotes.anniversary": "Rủ nhau đi lại quán quen đầu tiên nhé.",
    "app.home.occasionNotes.tet": "Tết này hai đứa hẹn gặp hôm nào?",
    "feat.date.label": "ĐI CHƠI", "feat.date.title": "Hôm nay đi đâu?", "feat.date.body": "Vuốt ý tưởng đi chơi. Chỉ những chỗ cả hai cùng thích mới hiện ra.",
    "feat.timeline.filters.date": "Đi chơi", "feat.timeline.kinds.date": "Đã đi chơi",
    "feat.timeline.ms.days": "{{count}} ngày là bạn", "feat.timeline.ms.years": "{{count}} năm quen nhau",
    "feat.capsule.body": "Viết một lá thư cho bạn thân, niêm phong lại. Mở đúng lúc cần.",
    "feat.capsule.types.fight": "Mở khi giận nhau", "feat.capsule.types.sad": "Mở khi buồn",
    "feat.play.verdicts.this_or_that": ["Trái gu từng câu. Thế mà vẫn chơi thân, lạ ghê.", "Khác gu mà vẫn chọn nhau làm bạn. Vậy là đủ rồi.", "Mỗi đứa một vị, ghép lại vừa khéo.", "Gu khá hợp. Kèo đi chơi dễ chốt rồi.", "Gần như chung một gu. Đi ăn khỏi cãi.", "Chung gu từng câu. Đáng ngờ lắm nha."],
  },
  en: {
    "feat.thumb.metaTitle": "High five · Nến Đôi", "feat.thumb.title": "High five", "feat.thumb.open": "High five", "feat.thumb.synced": "High five! {{partner}} is here too.",
    "feat.thumb.solo": "Connect with your friend first.", "feat.thumb.count": "You've high-fived {{count}} times", "feat.thumb.nudge": "Invite {{partner}} for a high five",
    "feat.notif.thumb_nudge": "{{partner}} wants a high five. Join now!", "feat.notif.thumb_synced": "High five with {{partner}} landed!",
    "feat.thumb.hint": "Keep your thumb on the circle. When you both hold, you high-five.",
    "sample.daysLabel": "days as friends",
    "tabs.date": "Hang out",
    "feat.explore.desc.family": "Childhood, family and home life.", "feat.explore.desc.money": "Money, boundaries and splitting the bill.", "feat.explore.desc.distance": "Staying close when you live apart.",
    "question.packs.family": "CHILDHOOD & FAMILY", "question.packs.money": "MONEY & BOUNDARIES",
    "question.packs.distance": "FAR APART", "question.packs.conflict": "FALLING OUT & MAKING UP",

    "app.meta.pairTitle": "Invite your best friend · Nến Đôi", "app.meta.pairDesc": "Send the code to your best friend to start.",
    "app.meta.homeDesc": "Days as friends, your streak and today's things.",
    "app.setup.choice.label": "INVITE YOUR BEST FRIEND",
    "app.setup.start.label": "FRIENDS SINCE", "app.setup.start.q": "When did you two meet?",
    "app.setup.call.label": "HOW YOU TALK", "app.setup.call.q": "How do you two address each other?",
    "app.setup.type.label": "YOUR FRIENDSHIP", "app.setup.type.q": "What kind of friends are you?",
    "app.setup.consent.q": "What's between you two stays between you two.",
    "app.pair.label": "INVITE YOUR BEST FRIEND", "app.pair.title": "Invite your best friend: send this code to {{partner}}.",
    "app.pair.note": "The code works for 7 days. When {{partner}} enters it or taps the link, you share one space.",
    "app.pair.shareText": "Join me on Nến Đôi, bestie. Invite code: {{code}}",
    "app.pair.join": "Join", "app.pair.joined": "You now share one space.", "app.pair.full": "This space already has two people.",
    "app.pair.already": "You're already in a space.",
    "app.join.body": "Your invite code: {{code}}",
    "app.home.milestone.days": "{{count}} days as friends. Worth celebrating.",
    "app.home.milestone.anniv": "Another year of friendship. Congratulations, you two.",
    "app.occasionNames.anniversary": "{{count}} YEARS AS FRIENDS",
    "app.home.occasionNotes.anniversary": "Go back to the first place you hung out.",
    "app.home.occasionNotes.tet": "Which day of Tết are you two meeting up?",
    "feat.date.label": "HANG OUT", "feat.date.title": "Where to today?", "feat.date.body": "Swipe hangout ideas. Only places you both like show up.",
    "feat.timeline.filters.date": "Hangouts", "feat.timeline.kinds.date": "Hangout done",
    "feat.timeline.ms.days": "{{count}} days as friends", "feat.timeline.ms.years": "{{count}} years as friends",
    "feat.capsule.body": "Write a letter to your best friend and seal it. Open it when it's needed.",
    "feat.capsule.types.fight": "Open when we're mad at each other", "feat.capsule.types.sad": "Open when you're sad",
    "feat.play.verdicts.this_or_that": ["Opposite tastes on every card. Still best friends, somehow.", "Different tastes, still picked each other. That's enough.", "Different flavours that go well together.", "Pretty matched. Weekend plans sorted.", "Almost the same taste. No arguing over food.", "Same pick every time. Suspicious."],
  },
};

const originals: Record<string, Record<string, unknown>> = {};
let active: SpaceKind = "couple";

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Swaps wording for the whole app so every screen, notification and share card follows the space kind. */
export function applySpaceKind(kind: SpaceKind) {
  if (kind === active) return;
  for (const lng of ["vi", "en"] as const) {
    const bundle = i18n.getResourceBundle(lng, "translation") as Record<string, unknown> | undefined;
    if (!bundle) continue;
    const orig = (originals[lng] ??= {});
    for (const [path, val] of Object.entries(FRIENDS[lng])) {
      if (!(path in orig)) orig[path] = getPath(bundle, path);
      const next = kind === "friends" ? val : orig[path];
      const parts = path.split("."), leaf = parts.pop()!;
      const nested = parts.reduceRight<Record<string, unknown>>((acc, k) => ({ [k]: acc }), { [leaf]: next });
      i18n.addResourceBundle(lng, "translation", nested, true, true);
    }
  }
  active = kind;
  void i18n.changeLanguage(i18n.language);
}
export const activeSpaceKind = () => active;

// Options that differ per kind.
export const FRIEND_CALLS = ["banminh", "cauto", "maytao", "custom"] as const;
export const FRIEND_STAGES = ["childhood", "college", "work", "new", "far", "roommate"] as const;
export const FRIEND_STYLES = ["fun", "deep", "nostalgic", "frank", "food", "travel"] as const;
export const COUPLE_STAGES = ["dating", "engaged", "married", "long_distance"] as const;
