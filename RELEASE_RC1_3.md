# D1-RC1.3.0 – Functional Recovery

## Trigger
RC1.2 real-device validation found poor icon quality, missing multi-route journey data, weak GPS UX, install UI not hiding after install, empty library, and missing account/Admin functions.

## Recovery scope
RC1.3 introduces a structured PDH Travel route catalog and connects Route, Library, GPS and Account views to it.

## Route catalog
12 route definitions with segment-level structure:
- TP.HCM → Huế
- TP.HCM → Nha Trang
- TP.HCM → Đà Nẵng
- TP.HCM → Đà Lạt
- TP.HCM → Vũng Tàu
- TP.HCM → Tây Ninh
- TP.HCM → Cần Thơ
- Cần Thơ → Châu Đốc
- Cần Thơ → Cà Mau
- TP.HCM → Buôn Ma Thuột
- Buôn Ma Thuột → Pleiku
- Pleiku → Kon Tum

Distances are approximate planning metadata, not navigation-grade routing. External map apps remain responsible for turn-by-turn routing.

## Account boundary
Admin/User accounts in RC1.3 are local-device accounts. Password values are hashed before local storage, but this is not equivalent to secure backend authentication.

## Release gate
Deploy is blocked unless route data, install assets, GPS code, Admin bootstrap and RC1.3 service worker validate in GitHub Actions.

## Status
RC candidate only. Real-device test required before STABLE.
