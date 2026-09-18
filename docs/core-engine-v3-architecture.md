# RC2 Core Engine v3

## Mục tiêu
Loại business logic phụ thuộc R-002 khỏi module UI. Tuyến cụ thể là dữ liệu, không phải cấu trúc chương trình.

## Lớp lõi
- `RouteContext`: tuyến/chặng đang hoạt động.
- `GpsService`: một cửa đọc GPS-health và fix hợp lệ.
- `PoiRepository`: truy vấn POI đủ điều kiện theo route/stage.
- `DrivingAdvisor`: đề xuất phía trước, không hard-code route ID.
- `AlertEngine`: cảnh báo 30/20/10 km và service-gap theo RouteContext.
- `DrivingSession`: thời gian lái, pause do GPS, reset sau dừng 15 phút.

## Adapter UI
- `rc2-driving.js`
- `rc2-proactive.js`
- `rc2-driver-rest.js`

Các adapter không được sở hữu quy tắc nghiệp vụ tuyến. Chúng render kết quả từ `window.DiDauEngine` và duy trì API cũ để B5–B14 không bị phá.

## Luồng chuẩn
`GPS -> GpsService -> RouteContext -> PoiRepository -> DrivingAdvisor -> AlertEngine / DrivingSession -> UI`

## Quy tắc kiến trúc
1. Không hard-code `R-002` trong business logic runtime.
2. Dataset có thể mang `routeId`; engine nhận route hiện tại từ `RouteContext`.
3. POI không gắn route được coi là điểm dùng chung, vẫn có thể xuất hiện trên tuyến đang hoạt động.
4. Module UI không tự tái tính route/GPS/alert/session.
5. Test `core-engine-v3.test.js` phải chứng minh cùng engine chuyển được giữa ít nhất hai route ID mà không sửa code.
6. Android và PWA phải đóng gói `rc2-engine-v3.js` trước adapter driving.

## Version
Android RC2 Core v3 dùng `versionCode 200`, `versionName 2.0.0`. Signed-release gate phải xác minh đúng package/version trước phát hành.
