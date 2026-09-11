# Đi Đâu Đây D1 / PDH Travel

## Current release
**D1-RC1.3.0 – Functional Recovery**

RC1.3 thay RC1.2 demo shell bằng cấu trúc tuyến/lộ trình PDH Travel và xử lý các lỗi phát hiện khi test thực tế.

## Đã triển khai
- Catalog tuyến có cấu trúc `route → segment → corridor → POI`.
- 12 tuyến ban đầu: TP.HCM → Huế, Nha Trang, Đà Nẵng, Đà Lạt, Vũng Tàu, Tây Ninh, Cần Thơ; Cần Thơ → Châu Đốc/Cà Mau; TP.HCM → Buôn Ma Thuột; Buôn Ma Thuột → Pleiku; Pleiku → Kon Tum.
- Thư viện luôn có tuyến/lộ trình, không còn màn hình rỗng.
- GPS dùng `watchPosition`, high accuracy, hiển thị sai số và nút GPS lớn.
- Install panel tự ẩn khi app chạy standalone.
- Nhập điểm thủ công dùng tọa độ thật và checkbox kiểm chứng tại chỗ; không auto-verify.
- Tài khoản User/Admin cục bộ; cho phép thiết lập Admin đầu tiên trên thiết bị.
- Bộ icon RC1.3 mới dùng biểu tượng lộ trình + ghim vị trí, thay icon cũ.
- Service Worker cache catalog tuyến để hỗ trợ offline shell.
- GitHub Actions chặn deploy nếu RC1.3 thiếu tuyến, GPS, Admin bootstrap hoặc asset PWA.

## Giới hạn bảo mật
Tài khoản RC1.3 là **local-device account**, chưa phải xác thực backend/cloud. Không coi đây là hệ thống identity máy chủ.

## Production
https://giaphatgpt123-wq.github.io/di-dau-day/

## Release policy
Không gắn STABLE cho tới khi Android/iOS, GPS, offline cold-start, persistence và update-retention PASS trên thiết bị thật.
