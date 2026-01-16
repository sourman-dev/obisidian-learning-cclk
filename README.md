# CCLK Flashcards - Obsidian Plugin

Plugin học huyệt vị Châm Cứu Lục Khí (CCLK) bằng phương pháp lặp lại cách quãng (Spaced Repetition) sử dụng thuật toán SM-2.

## Tính năng

- **Flashcards 2 chiều**: Hỏi xuôi và hỏi ngược để rèn phản xạ
- **Matching pairs**: Ghép cặp huyệt vị với ngũ du huyệt và ngũ hành
- **Thuật toán SM-2**: Tự động lập lịch ôn tập dựa trên độ khó
- **Theo dõi tiến độ**: Lưu trạng thái học tập, streak, accuracy
- **Học theo chủ đề**: Chọn học riêng từng kinh hoặc học tổng hợp

## Nội dung

13 chủ đề từ sách Châm Cứu Lục Khí:
1. Sự hình thành Lục Khí
2. Tương sinh, tương khắc, phản sinh
3. 12 Tạng Phủ
4. 12 Kinh Mạch
5. Bổ mạch, bổ huyệt
6. Huyệt Ngũ Du
7. Nguyên lý chữa bệnh
8. Huyệt Kinh Phế và Đại Trường
9. Huyệt Kinh Tâm Bào và Tam Tiêu
10. Huyệt Kinh Tâm và Tiểu Trường
11. Huyệt Kinh Tỳ và Vị
12. Huyệt Kinh Can và Đởm
13. Huyệt Kinh Thận và Bàng Quang

## Cài đặt

### Phương pháp 1: Sử dụng BRAT (Khuyên dùng)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool) cho phép cài đặt plugin từ GitHub và tự động cập nhật.

**Bước 1: Cài đặt BRAT**
1. Mở Obsidian → Settings → Community plugins
2. Tắt "Restricted mode" nếu chưa tắt
3. Nhấn "Browse" và tìm "BRAT"
4. Cài đặt và bật plugin BRAT

**Bước 2: Thêm CCLK Flashcards qua BRAT**
1. Mở Settings → BRAT
2. Nhấn "Add Beta plugin"
3. Nhập URL repository:
   ```
   sourman-dev/obisidian-learning-cclk
   ```
4. Nhấn "Add Plugin"
5. Vào Settings → Community plugins và bật "CCLK Flashcards"

**Bước 3: Copy thư mục cards vào vault**
1. Tải thư mục `cclk-cards` từ repository
2. Copy vào thư mục vault của bạn (cùng cấp với `.obsidian`)

### Phương pháp 2: Cài đặt thủ công

1. Tải file `main.js`, `manifest.json`, `styles.css` từ [Releases](https://github.com/sourman-dev/obisidian-learning-cclk/releases)
2. Tạo thư mục `.obsidian/plugins/cclk-flashcards` trong vault
3. Copy 3 file vào thư mục vừa tạo
4. Copy thư mục `cclk-cards` vào vault
5. Khởi động lại Obsidian và bật plugin

## Hướng dẫn sử dụng

### Mở plugin
- Click icon **Layers** trên ribbon (thanh bên trái)
- Hoặc dùng Command Palette: `Ctrl/Cmd + P` → "Open CCLK Flashcards"

### Chọn chủ đề học
1. Tick chọn các chủ đề muốn học
2. Chọn chế độ:
   - **Topic Drill**: Học từng chủ đề, câu hỏi theo thứ tự
   - **Mixed Review**: Trộn lẫn các chủ đề, câu hỏi ngẫu nhiên
3. Nhấn "Start Session"

### Học flashcard
1. Đọc câu hỏi
2. Nhấn "Show Answer" để xem đáp án
3. Tự đánh giá và chọn:
   - **Again**: Quên hoàn toàn, sẽ hỏi lại sớm
   - **Hard**: Nhớ được nhưng khó, interval ngắn
   - **Good**: Nhớ tốt, interval bình thường
   - **Easy**: Nhớ rất dễ, interval dài

### Matching pairs
- Kéo thả hoặc click để ghép cặp huyệt vị với phân loại
- Hoàn thành tất cả cặp để tiếp tục

### Xem thống kê
- Sau mỗi session sẽ hiển thị:
  - Số card đã học
  - Tỷ lệ chính xác
  - Streak (số ngày học liên tiếp)

## Cấu trúc thư mục

```
vault/
├── .obsidian/
│   └── plugins/
│       └── cclk-flashcards/
│           ├── main.js
│           ├── manifest.json
│           └── styles.css
├── cclk-cards/
│   ├── 01-su-hinh-thanh-luc-khi.md
│   ├── 02-tuong-sinh-tuong-khac-phan-sinh.md
│   └── ... (13 files)
└── .cclk-data/
    └── progress.json  (tự động tạo)
```

## Tùy chỉnh

Vào Settings → CCLK Flashcards để:
- Thay đổi thư mục chứa cards
- Giới hạn số card mỗi session
- Bật/tắt hiển thị streak

## Phát triển

```bash
# Clone repository
git clone git@github.com:sourman-dev/obisidian-learning-cclk.git

# Cài dependencies
npm install

# Build
npm run build

# Deploy vào vault (cập nhật path trong package.json)
npm run deploy
```

## License

MIT License

## Tác giả

Developed with ❤️ for Vietnamese Traditional Medicine learners.
