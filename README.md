# Đi Đâu Đây D1 RC1 - Install Recovery

## Nâng cấp module cài đặt
- Nút "Cài ứng dụng" luôn hiện.
- Phát hiện Android / iOS / desktop.
- Phát hiện trạng thái standalone/đã cài.
- Hỗ trợ `beforeinstallprompt` khi trình duyệt cung cấp.
- Hướng dẫn riêng cho iPhone/iPad Safari.
- Bổ sung icon PWA 192/512 + maskable + Apple Touch Icon.
- Service Worker có version riêng, xóa cache cũ khi activate.
- Phát hiện Service Worker mới và cho phép "Cập nhật ngay".
- Tách APP_VERSION / CACHE_VERSION / DATA_SCHEMA_VERSION.
- Migration dữ liệu cục bộ không xóa thư viện người dùng.

## Cách chạy đúng
GPS, Service Worker và PWA install cần HTTP/HTTPS.

Local:
    python -m http.server 8080

Sau đó mở:
    http://localhost:8080

Production:
Đưa toàn bộ nội dung thư mục lên GitHub Pages / Cloudflare Pages / Netlify / Vercel bằng HTTPS.

## Release
D1-RC1.0.0
Mục tiêu: Install Recovery Release.
