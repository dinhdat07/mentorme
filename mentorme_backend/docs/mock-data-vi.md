# Bộ dữ liệu mẫu (Tiếng Việt) để thử tính năng Trust Score & Match Engine

Các request dưới đây dùng cURL, có thể paste vào terminal sau khi server chạy ở `http://localhost:4000`. Thay token JWT thực tế vào chỗ `<ACCESS_TOKEN>` nếu endpoint cần auth.

## 1) Tạo tài khoản & hồ sơ

### Đăng ký học sinh
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Minh An",
    "email": "an.hocvien@example.com",
    "phone": "0901234567",
    "password": "Matkhau@123",
    "role": "STUDENT"
  }'
```

### Đăng ký gia sư
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Trần Thu Hà",
    "email": "ha.giasu@example.com",
    "phone": "0912345678",
    "password": "Matkhau@123",
    "role": "TUTOR"
  }'
```

Sau khi đăng ký gia sư, admin cần duyệt (hoặc bạn cập nhật thẳng trong DB) để `verified=true` và `status=ACTIVE`.

## 2) Tạo môn học (subject)
```bash
curl -X POST http://localhost:4000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Toán",
    "level": "THCS",
    "description": "Ôn tập toán cơ bản & nâng cao"
  }'
```

## 3) Tạo lớp học của gia sư (cần token của gia sư)
```bash
curl -X POST http://localhost:4000/api/classes \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "<ID_Mon_Toan>",
    "title": "Toán 9 - Luyện thi vào 10",
    "description": "Hệ thống lý thuyết, bài tập chọn lọc, kèm bám sát đề thi.",
    "targetGrade": "Lớp 9",
    "pricePerHour": 200000,
    "locationType": "ONLINE",
    "city": "Hà Nội",
    "district": "Cầu Giấy",
    "status": "PUBLISHED"
  }'
```

## 4) Học sinh đặt lịch học (cần token học sinh)
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "<ID_Lop_Toan>",
    "requestedHoursPerWeek": 3,
    "startDateExpected": "2025-12-01T12:00:00Z",
    "noteFromStudent": "Mong muốn luyện đề vào 10",
    "isTrial": true
  }'
```

## 5) Gia sư xác nhận & hoàn tất buổi học
```bash
# Xác nhận (chuyển sang TRIAL/CONFIRMED)
curl -X PATCH http://localhost:4000/api/bookings/<BOOKING_ID>/confirm \
  -H "Authorization: Bearer <ACCESS_TOKEN_TUTOR>"

# Sau khi hoàn thành, đánh dấu COMPLETED để tính trustScore
curl -X PATCH http://localhost:4000/api/bookings/<BOOKING_ID>/complete \
  -H "Authorization: Bearer <ACCESS_TOKEN_TUTOR>"
```

## 6) Học sinh đánh giá gia sư (làm tăng trustScore)
```bash
curl -X POST http://localhost:4000/api/reviews \
  -H "Authorization: Bearer <ACCESS_TOKEN_STUDENT>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<BOOKING_ID>",
    "rating": 5,
    "comment": "Cô dạy dễ hiểu, cho nhiều ví dụ thực tế!"
  }'
```

## 7) Kiểm tra trustScore hiện tại
```bash
curl http://localhost:4000/api/tutors/<TUTOR_PROFILE_ID>/trust-score
```
Phản hồi sẽ gồm `trustScore`, `averageRating`, `totalCompletedBookings`, `totalReviews`.

## 8) Kiểm thử Match Engine
Gọi endpoint gợi ý gia sư, có thể truyền `subjectId`, `city`, `district`, `priceMin/priceMax`, `gradeLevel`.
```bash
curl "http://localhost:4000/api/matching/tutors?subjectId=<ID_Mon_Toan>&city=H%C3%A0%20N%E1%BB%99i&district=C%E1%BA%A7u%20Gi%E1%BA%A5y&priceMin=150000&priceMax=250000&gradeLevel=L%E1%BB%9Bp%209"
```
Kết quả trả về danh sách `{ tutor, matchScore }` đã được sắp xếp giảm dần theo `matchScore`.
