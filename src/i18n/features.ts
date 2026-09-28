/** Copy for Play, Date, Memories tabs and the Photo of the day. */
export const featVi = {
  play: {
    label: "CHƠI", title: "Chơi với nhau", body: "Mỗi ngày 5 thẻ mới. Chơi riêng, rồi cùng xem hai đứa hợp nhau đến đâu.",
    games: { this_or_that: "Chọn một", who_more_likely: "Ai dễ... hơn?" },
    gameNotes: { this_or_that: "Vuốt trái chọn bên trái, vuốt phải chọn bên phải.", who_more_likely: "Vuốt trái là bạn, vuốt phải là {{partner}}." },
    today: "5 thẻ hôm nay", start: "Chơi", played: "Đã chơi", back: "Quay lại",
    me: "TÔI", or: "hay",
    waitingTitle: "Xong phần bạn rồi.", waiting: "Chờ {{partner}} chơi xong là mở kết quả.",
    readyTitle: "Cả hai đã chơi.", reveal: "Mở kết quả",
    score: "Hợp nhau {{count}}/{{total}}", you: "Bạn", partnerPick: "{{partner}}",
    empty: "Chưa có thẻ nào cho trò này.",
  },
  date: {
    label: "HẸN HÒ", title: "Tối nay đi đâu?", body: "Vuốt ý tưởng hẹn hò. Chỉ những chỗ cả hai cùng thích mới hiện ra.",
    all: "Tất cả", match: "Trùng ý rồi!", matchBody: "{{title}} đã vào danh sách chung.",
    listTitle: "Danh sách chung", listEmpty: "Chưa trùng ý nào. Vuốt tiếp đi.", done: "Đã đi", notDone: "Chưa đi",
    budget: { low: "Tiết kiệm", mid: "Vừa phải", high: "Chơi lớn" },
    doneAll: "Hết ý tưởng ở đây rồi. Thử thành phố khác nhé.",
  },
  memories: {
    label: "KỶ NIỆM", title: "Kỷ niệm của hai đứa", add: "Thêm kỷ niệm", save: "Lưu", cancel: "Huỷ", saving: "Đang lưu…",
    fTitle: "Chuyện gì đã xảy ra?", fDate: "Ngày", fNote: "Ghi chú (không bắt buộc)", fPhoto: "Thêm ảnh",
    empty: "Chưa có kỷ niệm nào. Lưu câu trả lời hay, hoặc thêm một khoảnh khắc ở đây.", delete: "Xoá",
  },
  photo: {
    metaTitle: "Ảnh hôm nay · Nến Đôi", metaDesc: "Mỗi ngày một đề bài, hai tấm ảnh, mở cùng lúc.",
    label: "ẢNH HÔM NAY", pick: "Chọn ảnh", change: "Đổi ảnh", caption: "Vài chữ kèm ảnh (không bắt buộc)", send: "Gửi ảnh", sending: "Đang gửi…",
    waiting: "Đã gửi. Chờ {{partner}} gửi ảnh là hai tấm cùng mở.", reveal: "Mở ảnh", you: "Bạn", tooBig: "Ảnh lớn quá (tối đa 10MB).", back: "Về trang chủ",
  },
  error: "Có gì đó trục trặc. Thử lại nhé.",
};

export const featEn: typeof featVi = {
  play: {
    label: "PLAY", title: "Play together", body: "5 new cards a day. Play on your own, then see how in sync you are.",
    games: { this_or_that: "This or that", who_more_likely: "Who's more likely?" },
    gameNotes: { this_or_that: "Swipe left for the left one, right for the right one.", who_more_likely: "Swipe left for you, right for {{partner}}." },
    today: "Today's 5 cards", start: "Play", played: "Played", back: "Back",
    me: "ME", or: "or",
    waitingTitle: "Your part's done.", waiting: "Results open when {{partner}} finishes.",
    readyTitle: "You both played.", reveal: "Reveal results",
    score: "In sync {{count}}/{{total}}", you: "You", partnerPick: "{{partner}}",
    empty: "No cards for this game yet.",
  },
  date: {
    label: "DATES", title: "Where to tonight?", body: "Swipe date ideas. Only the ones you both like show up.",
    all: "All", match: "It's a match!", matchBody: "{{title}} is on your shared list.",
    listTitle: "Shared list", listEmpty: "No matches yet. Keep swiping.", done: "Been there", notDone: "Not yet",
    budget: { low: "Cheap", mid: "Mid", high: "Splurge" },
    doneAll: "That's every idea here. Try another city.",
  },
  memories: {
    label: "MEMORIES", title: "Your memories", add: "Add a memory", save: "Save", cancel: "Cancel", saving: "Saving…",
    fTitle: "What happened?", fDate: "Date", fNote: "Note (optional)", fPhoto: "Add a photo",
    empty: "No memories yet. Save a great answer, or add a moment here.", delete: "Delete",
  },
  photo: {
    metaTitle: "Today's photo · Nến Đôi", metaDesc: "One prompt a day, two photos, opened together.",
    label: "TODAY'S PHOTO", pick: "Choose a photo", change: "Change photo", caption: "A few words (optional)", send: "Send photo", sending: "Sending…",
    waiting: "Sent. Both photos open once {{partner}} sends theirs.", reveal: "Reveal photos", you: "You", tooBig: "That photo is too big (10MB max).", back: "Back home",
  },
  error: "Something went wrong. Try again.",
};
