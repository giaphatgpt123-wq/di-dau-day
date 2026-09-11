# Đi Đâu Đây D1 — RC1.2.0

Production PWA cho thử nghiệm cài đặt và chạy thực tế trên mobile.

## Production
- GitHub Pages: https://giaphatgpt123-wq.github.io/di-dau-day/
- Branch phát hành: `main`
- Release candidate: `A1-RC4-GH1`
- Deploy: GitHub Actions → GitHub Pages

## PWA install
- Android Chrome/Edge: dùng nút **Cài ứng dụng** trong app hoặc menu trình duyệt → **Cài ứng dụng / Thêm vào màn hình chính**.
- iPhone/iPad Safari: **Chia sẻ → Thêm vào Màn hình chính → Thêm**.
- App phát hiện chế độ standalone và Service Worker update.
- Mã QR tại `install-qr.png` mở trực tiếp bản GitHub Pages.
- Nút **Mở bản đầy đủ** chuyển sang bản có tài khoản, thư viện và đồng bộ máy chủ.

## Release gate trên GitHub Actions
Workflow chỉ deploy khi các kiểm tra sau PASS:
- `index.html`, `manifest.webmanifest`, `sw.js` tồn tại;
- icon PWA 192×192, 512×512 và Apple Touch Icon tồn tại;
- QR cài đặt tồn tại và được tham chiếu trong giao diện;
- manifest có các trường cốt lõi và tham chiếu icon hợp lệ;
- `index.html` mang phiên bản `A1-RC4-GH1`;
- Service Worker mang cache version RC1.2.

## Dữ liệu người dùng
Dữ liệu hiện lưu cục bộ bằng `localStorage`. Việc cập nhật PWA/Service Worker không chủ động xóa thư viện người dùng.

## Trạng thái phát hành
GitHub/Pages có thể được đánh dấu PASS khi workflow production hoàn tất thành công. Các mục Android install, iOS Add to Home Screen, standalone reopen và offline restart chỉ được PASS sau quan sát trên thiết bị thật.
