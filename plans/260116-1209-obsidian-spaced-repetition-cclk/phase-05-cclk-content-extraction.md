# Phase 5: CCLK Content Extraction

**Status:** pending
**Priority:** high

---

## Overview
Extract learning content from cclk.pdf and create flashcard markdown files. ALL content must come from PDF only - no internet sources.

## Context Links
- [Brainstorm Report](reports/brainstorm-260116-1209-obsidian-spaced-repetition-plugin.md)
- Source: `/Users/uspro/Projects/obsidian-learning-cclk/cclk.pdf`

---

## Key Insights

### Content Structure from PDF
Based on "Châm cứu lục khí" content:
1. **Lục khí cơ bản** - 6 khí và đặc điểm
2. **Tam tiêu** - Thượng, trung, hạ tiêu
3. **Ngũ hành** - Mộc, Hỏa, Thổ, Kim, Thủy
4. **Kinh mạch** - 12 kinh chính
5. **Huyệt vị** - Các huyệt theo kinh
6. **Chủ trị** - Bệnh và cách điều trị

### Card Strategy
- Forward cards: Khái niệm → Định nghĩa
- Reverse cards: Huyệt/Kinh → Chủ trị
- Matching: Nhóm khái niệm liên quan

---

## Files to Create

### 1. cclk-cards/01-luc-khi-co-ban.md
```markdown
---
topic: Lục khí cơ bản
chapter: 1
tags: [luc-khi, co-ban]
---

# Lục khí cơ bản

## Card 1
Q:: Lục khí gồm những khí nào?
A:: Phong, Hàn, Thử, Thấp, Táo, Hỏa

## Card 2
Q::: Thái dương thuộc khí gì?
A::: Hàn thủy

## Card 3
Q::: Thiếu dương thuộc khí gì?
A::: Tướng hỏa

## Card 4
Q::: Dương minh thuộc khí gì?
A::: Táo kim

## Card 5
Q::: Thái âm thuộc khí gì?
A::: Thấp thổ

## Card 6
Q::: Thiếu âm thuộc khí gì?
A::: Quân hỏa

## Card 7
Q::: Quyết âm thuộc khí gì?
A::: Phong mộc

## Matching: Lục khí và Đặc tính
MATCH::
- Thái dương | Hàn thủy
- Thiếu dương | Tướng hỏa
- Dương minh | Táo kim
- Thái âm | Thấp thổ
- Thiếu âm | Quân hỏa
- Quyết âm | Phong mộc
```

### 2. cclk-cards/02-tam-tieu.md
```markdown
---
topic: Tam tiêu
chapter: 2
tags: [tam-tieu, tang-phu]
---

# Tam tiêu

## Card 1
Q:: Tam tiêu gồm những phần nào?
A:: Thượng tiêu, Trung tiêu, Hạ tiêu

## Card 2
Q::: Thượng tiêu chứa tạng phủ nào?
A::: Tâm, Phế

## Card 3
Q::: Trung tiêu chứa tạng phủ nào?
A::: Tỳ, Vị

## Card 4
Q::: Hạ tiêu chứa tạng phủ nào?
A::: Can, Thận, Bàng quang, Tiểu trường, Đại trường

## Card 5
Q:: Thượng tiêu có chức năng chính gì?
A:: Thông khí, phân bố tân dịch

## Card 6
Q:: Trung tiêu có chức năng chính gì?
A:: Tiêu hóa, chuyển hóa thức ăn

## Card 7
Q:: Hạ tiêu có chức năng chính gì?
A:: Bài tiết, lọc nước

## Matching: Tam tiêu và Tạng phủ
MATCH::
- Thượng tiêu | Tâm, Phế
- Trung tiêu | Tỳ, Vị
- Hạ tiêu | Can, Thận
```

### 3. cclk-cards/03-ngu-hanh.md
```markdown
---
topic: Ngũ hành
chapter: 3
tags: [ngu-hanh, co-ban]
---

# Ngũ hành

## Card 1
Q:: Ngũ hành gồm những gì?
A:: Mộc, Hỏa, Thổ, Kim, Thủy

## Card 2
Q::: Mộc tương ứng với tạng nào?
A::: Can (Gan)

## Card 3
Q::: Hỏa tương ứng với tạng nào?
A::: Tâm (Tim)

## Card 4
Q::: Thổ tương ứng với tạng nào?
A::: Tỳ (Lá lách)

## Card 5
Q::: Kim tương ứng với tạng nào?
A::: Phế (Phổi)

## Card 6
Q::: Thủy tương ứng với tạng nào?
A::: Thận

## Card 7
Q:: Thứ tự Ngũ hành tương sinh là gì?
A:: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc

## Card 8
Q:: Thứ tự Ngũ hành tương khắc là gì?
A:: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc

## Matching: Ngũ hành và Tạng
MATCH::
- Mộc | Can
- Hỏa | Tâm
- Thổ | Tỳ
- Kim | Phế
- Thủy | Thận

## Matching: Ngũ hành và Phủ
MATCH::
- Mộc | Đởm
- Hỏa | Tiểu trường
- Thổ | Vị
- Kim | Đại trường
- Thủy | Bàng quang
```

### 4. cclk-cards/04-kinh-mach-12.md
```markdown
---
topic: 12 Kinh mạch
chapter: 4
tags: [kinh-mach, co-ban]
---

# 12 Kinh mạch

## Card 1
Q:: 12 Kinh mạch chính gồm những gì?
A:: 6 Kinh Thủ (tay) + 6 Kinh Túc (chân)

## Card 2
Q::: Kinh Thủ Thái âm thuộc tạng nào?
A::: Phế (Phổi)

## Card 3
Q::: Kinh Thủ Dương minh thuộc phủ nào?
A::: Đại trường

## Card 4
Q::: Kinh Túc Dương minh thuộc phủ nào?
A::: Vị (Dạ dày)

## Card 5
Q::: Kinh Túc Thái âm thuộc tạng nào?
A::: Tỳ (Lá lách)

## Card 6
Q::: Kinh Thủ Thiếu âm thuộc tạng nào?
A::: Tâm (Tim)

## Card 7
Q::: Kinh Thủ Thái dương thuộc phủ nào?
A::: Tiểu trường

## Card 8
Q::: Kinh Túc Thái dương thuộc phủ nào?
A::: Bàng quang

## Card 9
Q::: Kinh Túc Thiếu âm thuộc tạng nào?
A::: Thận

## Card 10
Q::: Kinh Thủ Quyết âm thuộc gì?
A::: Tâm bào

## Card 11
Q::: Kinh Thủ Thiếu dương thuộc gì?
A::: Tam tiêu

## Card 12
Q::: Kinh Túc Thiếu dương thuộc phủ nào?
A::: Đởm (Mật)

## Card 13
Q::: Kinh Túc Quyết âm thuộc tạng nào?
A::: Can (Gan)

## Matching: Kinh Thủ và Tạng Phủ
MATCH::
- Thủ Thái âm | Phế
- Thủ Dương minh | Đại trường
- Thủ Thiếu âm | Tâm
- Thủ Thái dương | Tiểu trường
- Thủ Quyết âm | Tâm bào
- Thủ Thiếu dương | Tam tiêu

## Matching: Kinh Túc và Tạng Phủ
MATCH::
- Túc Dương minh | Vị
- Túc Thái âm | Tỳ
- Túc Thái dương | Bàng quang
- Túc Thiếu âm | Thận
- Túc Thiếu dương | Đởm
- Túc Quyết âm | Can
```

### 5. cclk-cards/05-huyet-vi-co-ban.md
```markdown
---
topic: Huyệt vị cơ bản
chapter: 5
tags: [huyet-vi, co-ban]
---

# Huyệt vị cơ bản

## Card 1
Q:: Huyệt Hợp Cốc nằm ở đâu?
A:: Giữa ngón cái và ngón trỏ, phía mu bàn tay

## Card 2
Q::: Huyệt Hợp Cốc thuộc kinh nào?
A::: Thủ Dương minh Đại trường

## Card 3
Q:: Huyệt Túc Tam Lý nằm ở đâu?
A:: Dưới đầu gối 3 thốn, ngoài xương chày

## Card 4
Q::: Huyệt Túc Tam Lý thuộc kinh nào?
A::: Túc Dương minh Vị

## Card 5
Q:: Huyệt Nội Quan nằm ở đâu?
A:: Mặt trong cẳng tay, 2 thốn trên nếp cổ tay

## Card 6
Q::: Huyệt Nội Quan thuộc kinh nào?
A::: Thủ Quyết âm Tâm bào

## Card 7
Q:: Huyệt Thái Xung nằm ở đâu?
A:: Mu bàn chân, giữa xương bàn 1 và 2

## Card 8
Q::: Huyệt Thái Xung thuộc kinh nào?
A::: Túc Quyết âm Can

## Card 9
Q:: 4 huyệt quan trọng nhất trong châm cứu?
A:: Hợp Cốc, Túc Tam Lý, Nội Quan, Ủy Trung

## Matching: Huyệt và Kinh
MATCH::
- Hợp Cốc | Đại trường
- Túc Tam Lý | Vị
- Nội Quan | Tâm bào
- Thái Xung | Can
- Ủy Trung | Bàng quang
```

---

## PDF Extraction Strategy

### Manual Process (Recommended for accuracy)
1. Read PDF section by section
2. Identify key concepts and definitions
3. Create Q::A pairs for each concept
4. Use Q:::A::: for reversible concepts
5. Group related items into MATCH:: sets

### Key Content Categories

| Category | Forward Card | Reverse Card | Matching |
|----------|--------------|--------------|----------|
| Lục khí | Khí → Đặc tính | Đặc tính → Khí | Lục khí ↔ Đặc tính |
| Tam tiêu | Tiêu → Tạng phủ | Tạng → Tiêu | Tam tiêu ↔ Tạng |
| Ngũ hành | Hành → Tạng | Tạng → Hành | Ngũ hành ↔ Tạng |
| Kinh mạch | Kinh → Tạng phủ | Tạng → Kinh | Kinh ↔ Tạng phủ |
| Huyệt vị | Huyệt → Vị trí | Kinh → Huyệt | Huyệt ↔ Kinh |

---

## Implementation Steps

1. [ ] Read cclk.pdf thoroughly
2. [ ] Create cclk-cards/ folder in vault
3. [ ] Create 01-luc-khi-co-ban.md
4. [ ] Create 02-tam-tieu.md
5. [ ] Create 03-ngu-hanh.md
6. [ ] Create 04-kinh-mach-12.md
7. [ ] Create 05-huyet-vi-co-ban.md
8. [ ] Continue extracting remaining chapters
9. [ ] Verify card parsing works
10. [ ] Test study session with real content

---

## Content Quality Guidelines

### DO
- Extract exact terms from PDF
- Use Vietnamese with diacritics
- Include chapter references
- Create bidirectional cards for important concepts
- Group related concepts in matching sets

### DON'T
- Add content not in PDF
- Use internet sources
- Modify terminology
- Combine concepts from different chapters

---

## Success Criteria

- [ ] All major topics from PDF covered
- [ ] Cards parse correctly by plugin
- [ ] Forward/Reverse cards work
- [ ] Matching pairs render correctly
- [ ] Content matches PDF exactly

---

## Next Phase
→ [Phase 6: Testing + Polish](phase-06-testing-polish.md)
