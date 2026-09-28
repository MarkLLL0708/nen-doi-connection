// Server-only: suggestion provider interface, the mock provider, and safety screening.
// Swap `mockProvider` for an LLM-backed provider later; it must follow coach_system_prompt.md.
import type { CoachDialect, CoachTone, CoachUseCase, CoachVersions } from "@/config/coach";

export type CoachRequest = { text: string; useCase: CoachUseCase; tone: CoachTone; dialect: CoachDialect; partner: string };
export interface CoachProvider { suggest(req: CoachRequest): Promise<CoachVersions> }

const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const has = (text: string, words: string[]) => { const raw = text.toLowerCase().normalize("NFC"), bare = strip(text); return words.some((w) => raw.includes(w) || bare.includes(strip(w))); };

/** Violence, abuse, self-harm or feeling unsafe: stop coaching and show the safety card. */
const SAFETY = ["bạo lực", "bị đánh", "đánh mình", "đánh em", "đánh tôi", "đánh tui", "đánh tớ", "tát mình", "tát em", "tát tôi", "bóp cổ", "đe doạ", "đe dọa", "dọa giết", "doạ giết",
  "tự tử", "tự sát", "tự làm đau", "tự hại", "tự làm hại", "muốn chết", "không muốn sống", "không an toàn", "thấy sợ anh", "thấy sợ em", "sợ bị đánh", "bị ép quan hệ", "cưỡng ép", "xâm hại", "lạm dụng",
  "hit me", "hits me", "abuse", "suicide", "kill myself", "self-harm", "unsafe", "violence", "violent"];
/** Coercion, manipulation, surveillance, guilt-tripping or diagnosis requests: refuse politely. */
const REFUSE = ["theo dõi", "định vị", "đọc trộm", "xem trộm", "kiểm tra điện thoại", "check điện thoại", "mật khẩu", "thao túng", "cảm thấy có lỗi", "thấy tội lỗi", "hối hận vì đã", "trả thù", "ép người yêu", "bắt người yêu phải",
  "chẩn đoán", "có bị trầm cảm", "bị rối loạn", "có bệnh tâm lý", "track", "spy", "manipulate", "guilt trip", "make them feel guilty", "diagnose"];

export const needsSafety = (t: string) => has(t, SAFETY);
export const shouldRefuse = (t: string) => has(t, REFUSE);

type Base = CoachVersions;
const BASE: Record<Exclude<CoachUseCase, "dialect">, Base> = {
  rewrite: {
    short: "Mình hơi buồn chuyện này. {partner} rảnh thì mình nói chuyện chút nhé?",
    medium: "Mình muốn nói chuyện này nhẹ nhàng thôi: mình thấy hơi buồn và hơi hụt hẫng. Mình không trách {partner}, mình chỉ muốn hai đứa hiểu nhau hơn.",
    long: "Mình nghĩ một lúc rồi mới nhắn, vì không muốn nói lúc đang bực. Chuyện vừa rồi làm mình hơi buồn. Mình không cần ai đúng ai sai, mình chỉ muốn {partner} biết mình đang cảm thấy vậy, và nghe {partner} kể phía của {partner}. Khi nào tiện, hai đứa nói chuyện nhé.",
  },
  apologize: {
    short: "Mình xin lỗi {partner}. Mình sai rồi, và mình muốn sửa.",
    medium: "Mình xin lỗi vì chuyện vừa rồi. Mình hiểu vì sao {partner} buồn, và đó không phải lỗi của {partner}. Mình sẽ để ý hơn.",
    long: "Mình xin lỗi {partner}. Mình đã làm {partner} buồn và mình không muốn biện minh. Mình hiểu {partner} đã mong chờ điều khác từ mình. Lần sau mình sẽ làm khác đi, và nếu {partner} muốn, mình muốn bù lại bằng một việc cụ thể, {partner} chọn nhé.",
  },
  space: {
    short: "Tối nay mình cần chút yên tĩnh. Không phải vì {partner} đâu, mai mình nhắn nhé.",
    medium: "Hôm nay mình hơi mệt nên muốn có chút thời gian một mình. Không phải vì {partner} làm gì sai. Mình nghỉ một chút rồi mình gọi {partner}.",
    long: "Mình muốn nói trước để {partner} khỏi lo: hôm nay mình cần một khoảng riêng để nghỉ ngơi. Không có chuyện gì giữa hai đứa cả, mình chỉ cần nạp lại năng lượng. Mai mình gọi cho {partner}, mình kể {partner} nghe hôm nay của mình nhé.",
  },
  cute: {
    short: "Đang làm việc mà tự nhiên nhớ {partner} ghê.",
    medium: "Báo cáo: hôm nay mình nghĩ tới {partner} hơi nhiều hơn dự kiến. Không có lý do gì đặc biệt, chỉ là nhớ thôi.",
    long: "Mình không định nhắn gì sến đâu, nhưng thật lòng là hôm nay có mấy lúc mình tự dưng mỉm cười vì nhớ {partner}. Tối nay rảnh thì kể mình nghe ngày của {partner} nha, mình muốn nghe hết.",
  },
  restart: {
    short: "Mình không muốn giận lâu. Mình nói chuyện lại được không {partner}?",
    medium: "Hồi nãy hai đứa đều hơi nóng. Mình muốn nói chuyện lại, bình tĩnh hơn. Mình sẽ nghe {partner} trước.",
    long: "Mình đã bình tĩnh lại rồi. Mình không muốn chuyện vừa rồi làm hai đứa xa nhau. Mình muốn nghe {partner} nói hết, rồi mình nói phần của mình. Mình nghĩ tụi mình có thể tìm cách để lần sau đỡ căng hơn. {partner} thấy lúc nào tiện thì nói mình nhé.",
  },
  questions: {
    short: "1. Tiền bạc: mình nên chia chi tiêu chung thế nào?\n2. Gia đình: dịp lễ về nhà ai trước?\n3. Tương lai: 3 năm nữa mình muốn sống ở đâu?",
    medium: "1. Tiền bạc: {partner} thấy thoải mái nhất với cách chia tiền chung nào?\n2. Gia đình: có điều gì về gia đình {partner} mà mình nên biết để hiểu hơn?\n3. Tương lai: 3 năm nữa, {partner} hình dung hai đứa đang sống thế nào?",
    long: "Mình muốn hỏi {partner} vài câu, không cần trả lời liền đâu:\n1. Tiền bạc: với {partner}, tiết kiệm và tận hưởng nên chia thế nào cho vừa?\n2. Gia đình: {partner} muốn hai đứa ra mắt hoặc về thăm gia đình theo nhịp nào?\n3. Tương lai: điều gì {partner} muốn hai đứa cùng làm được trong vài năm tới?",
  },
};

/** Approved samples, used when the input matches. */
const APPROVED: { match: string; useCase: CoachUseCase; out: Base }[] = [
  { match: "sao nay không trả lời tin nhắn", useCase: "rewrite", out: {
    short: "Hôm nay mình hơi lo vì chưa nghe tin {partner}. Rảnh thì nhắn mình một câu nhé.",
    medium: "Hôm nay mình hơi nhớ và lo vì chưa nghe tin từ {partner}. Khi nào rảnh, {partner} nhắn mình một câu nhé, mình chỉ muốn biết {partner} ổn không.",
    long: "Hôm nay mình hơi nhớ và lo vì chưa nghe tin từ {partner}. Mình biết có thể {partner} đang bận, mình không trách đâu. Khi nào rảnh, {partner} nhắn mình một câu nhé, mình chỉ muốn biết {partner} ổn không." } },
  { match: "quên", useCase: "apologize", out: {
    short: "Mình xin lỗi vì đã quên ngày quan trọng của hai đứa. Mình muốn bù lại cho {partner}.",
    medium: "Mình xin lỗi vì đã quên ngày quan trọng của hai đứa. Mình biết {partner} đã mong chờ và mình hiểu vì sao {partner} buồn. Mình muốn bù lại bằng một buổi tối chỉ dành cho hai đứa, {partner} chọn thời gian nhé.",
    long: "Mình xin lỗi vì đã quên ngày quan trọng của hai đứa. Mình biết {partner} đã mong chờ và mình hiểu vì sao {partner} buồn, mình không muốn viện cớ. Mình muốn bù lại bằng một buổi tối chỉ dành cho hai đứa, {partner} chọn thời gian nhé. Và từ giờ mình sẽ ghi lại những ngày của tụi mình." } },
  { match: "quá tải", useCase: "space", out: {
    short: "Hôm nay mình hơi quá tải, cần một tối yên tĩnh. Mai mình gọi {partner} nhé?",
    medium: "Hôm nay mình hơi quá tải nên cần một buổi tối yên tĩnh một mình. Không phải vì {partner} làm gì sai, mình chỉ cần nạp lại năng lượng. Mai mình gọi cho {partner} nhé?",
    long: "Hôm nay mình hơi quá tải nên cần một buổi tối yên tĩnh một mình. Không phải vì {partner} làm gì sai, mình chỉ cần nạp lại năng lượng. Mình nói trước để {partner} khỏi lo. Mai mình gọi cho {partner} nhé?" } },
];

const TONE: Record<CoachTone, { open?: string; close?: string }> = {
  gentle: {}, mature: {},
  cute: { close: "Thương {partner}." },
  funny: { open: "Nói nghiêm túc nhưng không quá nghiêm túc nha:", close: "(Đọc xong nhớ cười một cái.)" },
  direct: { open: "Mình nói thẳng, nhưng không có ý gắt:" },
  flirty: { close: "Mà nói thật, {partner} đáng yêu lắm đó." },
  parents: {},
};

const w = (word: string) => new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "gu");
const swap = (s: string, pairs: [string, string][]) => pairs.reduce((acc, [a, b]) => acc.replace(w(a), b), s);

function toneApply(v: Base, tone: CoachTone): Base {
  if (tone === "parents") {
    const p = (s: string) => swap(s.replace(/\{partner\}/g, "cô chú"), [["Mình", "Cháu"], ["mình", "cháu"], ["hai đứa", "hai cháu"], ["tụi", "chúng"], ["nhé", "ạ"], ["nha", "ạ"]]).replace(/ ghê/g, "");
    return { short: p(v.short), medium: p(v.medium), long: p(v.long) };
  }
  const t = TONE[tone];
  return { short: v.short, medium: [t.open, v.medium].filter(Boolean).join(" "), long: [t.open, v.long, t.close].filter(Boolean).join(" ") };
}

export function dialectApply(s: string, d: CoachDialect) {
  if (d === "south") return swap(s, [["nhé", "nha"], ["thế nào", "sao"], ["thế", "vậy"], ["tớ", "tui"]]);
  if (d === "north") return swap(s, [["nha", "nhé"], ["vậy", "thế"], ["hông", "không"], ["tui", "tớ"]]);
  return s;
}

export const mockProvider: CoachProvider = {
  async suggest({ text, useCase, tone, dialect, partner }) {
    let v: Base;
    if (useCase === "dialect") {
      const clean = text.trim().replace(/\s+/g, " ");
      const first = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
      v = { short: first, medium: clean, long: `${clean} ${dialect === "south" ? "Vậy nha." : "Thế nhé."}` };
    } else {
      const lower = text.toLowerCase();
      v = APPROVED.find((a) => a.useCase === useCase && lower.includes(a.match))?.out ?? BASE[useCase];
      v = toneApply(v, tone);
    }
    const fill = (s: string) => dialectApply(s, dialect).split("{partner}").join(partner);
    return { short: fill(v.short), medium: fill(v.medium), long: fill(v.long) };
  },
};

export const provider: CoachProvider = mockProvider;
