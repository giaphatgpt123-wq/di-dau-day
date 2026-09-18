# Android Release · Đi Đâu Đây D1 RC2

## Mục tiêu

Bản phát hành chính thức không dùng GitHub Actions artifact làm kênh tải chính. Workflow `.github/workflows/android-release.yml` build APK release đã ký, xác minh chữ ký/package/version, tạo SHA-256 và xuất bản các file trực tiếp vào GitHub Release.

## Quy ước phiên bản hiện tại

- Release tag: `android-v2.0.0`
- Android versionCode: `200`
- Android versionName: `2.0.0`
- App version: `D1-RC2.0.0`
- Package: `com.pdhtravel.didauday`

## File phát hành

Mỗi release phải có:

- `Di-Dau-Day-v2.0.0.apk`
- `Di-Dau-Day-v2.0.0.apk.sha256`
- `Di-Dau-Day-latest.apk`
- `Di-Dau-Day-latest.apk.sha256`

`Di-Dau-Day-latest.apk` là tên ổn định dành cho người dùng cuối; file versioned dùng cho lưu trữ và đối chiếu phiên bản.

## Signing secrets bắt buộc

Repository phải có đủ bốn GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Nếu thiếu bất kỳ secret nào, release workflow phải fail và không được tạo APK production không ký.

## Kiểm tra trước khi xuất bản

Workflow bắt buộc chạy toàn bộ regression hiện có, build release, kiểm tra offline assets, dùng Android `apksigner` xác minh chữ ký, dùng `aapt` xác minh package/version rồi mới tạo GitHub Release.

## Kênh phát hành

GitHub Actions artifact 90 ngày chỉ là bản sao CI dự phòng. GitHub Release là kênh phân phối chính và không phụ thuộc retention-days của artifact.
