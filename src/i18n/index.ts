import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  vi: { translation: {
    brandLine: "Một chút gần nhau, mỗi ngày.", eyebrow: "BẢN SẮC NẾN ĐÔI", guideTitle: "Ấm áp từ điều nhỏ xíu.", guideIntro: "Một góc nhỏ cho hai người, dịu dàng và đầy niềm vui.",
    sections: { colors: "Bảng màu", gradients: "Mỗi sắc thái, một câu chuyện", type: "Chữ nghĩa có cảm xúc", mascot: "Gặp bé Nến", buttons: "Chạm để thấy vui", cards: "Những khoảnh khắc", together: "Hai đứa mình", motions: "Một chút chuyển động", navigation: "Đi đâu hôm nay?" },
    colors: { cream: "Kem ấm", ember: "Cam lửa", rose: "Hồng má", charcoal: "Than ấm" },
    categories: { memory: "Kỷ niệm", food: "Ẩm thực", tet: "Tết", distance: "Yêu xa", deep: "Sâu lắng", fun: "Vui vẻ" },
    expressions: { vui: "Vui", yeu: "Yêu", doi: "Dỗi", doiBung: "Đói", nho: "Nhớ", ngu: "Ngủ", mung: "Mừng", buon: "Buồn" },
    type: { display: "Chuyện mình, cứ từ từ thôi.", heading: "Có nhau là đủ vui rồi.", body: "Hôm nay tụi mình dành cho nhau vài phút nhé?", caption: "MỘT NGÀY THẬT DỊU DÀNG" },
    actions: { start: "Bắt đầu thôi", later: "Để lát nữa nha", openSheet: "Mở lời nhắn", close: "Đóng", celebrate: "Thả niềm vui", switchTheme: "Đổi giao diện", switchLanguage: "English", again: "Thử lại" },
    card: { tag: "DÀNH CHO HAI ĐỨA", title: "Một điều bé xíu, mình kể nhau nghe.", body: "Nếu hôm nay là một màu, cậu sẽ chọn màu gì?", swipe: "Vuốt một cái, thêm một nụ cười", swipeHint: "Kéo thẻ sang trái hoặc phải" },
    streak: { label: "ngày bên nhau", status: "Lửa nhỏ, thương to" },
    avatars: { you: "Cậu", partner: "Người ấy", done: "Đã xong", waiting: "Đang chờ" },
    empty: "Chưa có gì ở đây, nhưng tụi mình có nhau mà!", sheet: { title: "Một lời nhắn nhỏ", body: "Ngày nào cũng có thể bắt đầu bằng một điều dịu dàng.", tag: "CHỈ DÀNH CHO HAI ĐỨA" },
    tabs: { home: "Trang chủ", play: "Chơi", date: "Hẹn hò", memories: "Kỷ niệm", settings: "Cài đặt" },
    sample: "Một ngày thật đẹp để thương nhau.", preview: "XEM THỬ", waitingNote: "Chờ một chút, vui thêm chút.", celebrationLabel: "Pháo giấy", swipeLeft: "Sang trái", swipeRight: "Sang phải", themeLight: "Chế độ sáng", themeDark: "Chế độ tối", gradientLabel: "Nền chuyển màu", navigationLabel: "Thanh điều hướng", colorSample: "Mẫu màu", mascotLabel: "Bé Nến: {{expression}}", fontSample: "Mẫu chữ", swipeLabel: "Thẻ vuốt", tapHint: "Chạm thử", count: "7", pageTitle: "Cẩm nang phong cách" 
  } },
  en: { translation: {
    brandLine: "A little closer, every day.", eyebrow: "THE NẾN ĐÔI LOOK", guideTitle: "Warmth in the little things.", guideIntro: "A little place for two, gentle and full of joy.",
    sections: { colors: "Our colors", gradients: "A mood for every story", type: "Words with feeling", mascot: "Meet little Flame", buttons: "Made to be tapped", cards: "Little moments", together: "The two of us", motions: "A little movement", navigation: "Where to today?" },
    colors: { cream: "Warm cream", ember: "Ember orange", rose: "Blushing rose", charcoal: "Warm charcoal" },
    categories: { memory: "Memories", food: "Food", tet: "Tết", distance: "Long distance", deep: "Heart to heart", fun: "Just for fun" },
    expressions: { vui: "Happy", yeu: "In love", doi: "Pouty", doiBung: "Hungry", nho: "Missing you", ngu: "Sleepy", mung: "Celebrating", buon: "Sad" },
    type: { display: "Our story can take its time.", heading: "Being together is enough.", body: "Let's take a few minutes for each other today?", caption: "A VERY GENTLE DAY" },
    actions: { start: "Let's begin", later: "Maybe later", openSheet: "Open a note", close: "Close", celebrate: "Let joy fly", switchTheme: "Switch theme", switchLanguage: "Tiếng Việt", again: "Try again" },
    card: { tag: "JUST FOR US TWO", title: "One tiny thing to tell each other.", body: "If today were a color, which would you pick?", swipe: "One swipe, one more smile", swipeHint: "Drag the card left or right" },
    streak: { label: "days together", status: "Little flame, big love" },
    avatars: { you: "You", partner: "Your person", done: "Done", waiting: "Waiting" },
    empty: "Nothing here yet, but we've got each other!", sheet: { title: "A little note", body: "Every day can begin with something gentle.", tag: "JUST FOR THE TWO OF US" },
    tabs: { home: "Home", play: "Play", date: "Dates", memories: "Memories", settings: "Settings" },
    sample: "A lovely day to love each other.", preview: "PREVIEW", waitingNote: "A little wait, a little more joy.", celebrationLabel: "Confetti", swipeLeft: "Left", swipeRight: "Right", themeLight: "Light theme", themeDark: "Dark theme", gradientLabel: "Gradient screen", navigationLabel: "Bottom navigation", colorSample: "Color sample", mascotLabel: "Little Flame: {{expression}}", fontSample: "Type sample", swipeLabel: "Swipe card", tapHint: "Give it a tap", count: "7", pageTitle: "Style guide"
  } },
} as const;

i18n.use(initReactI18next).init({ resources, lng: "vi", fallbackLng: "vi", interpolation: { escapeValue: false }, react: { useSuspense: false } });
export default i18n;
