# Core Engine v3 Phase 2 — Application Services

Phase 2 introduces `rc2-app-services-v3.js` as the shared persistence/state boundary for RC2.

## Services
- `JsonStore`: JSON/text local persistence adapter.
- `RouteStore`: selected route and route-selection source.
- `AccountStore`: local users and session compatibility store.
- `GeometryStore`: geometry overrides and segment traces.
- `PoiStore`: POI collection persistence.
- `AuditStore`: bounded audit log with actor/session attribution.
- `GpsStore`: last accepted GPS fix persistence.

`rc2-engine-v3.js` consumes these services first and keeps legacy fallbacks only for compatibility with the current `app.js` bootstrap.

## Dependency direction
UI / legacy bootstrap -> AppServices -> Core Engine repositories/services -> advisor/policy -> UI adapters.

Business logic must not directly own route IDs or duplicate persistence keys. Route IDs belong to data; storage keys belong to AppServices.

## Migration policy
This is a strangler refactor. `app.js` remains a compatibility facade during Phase 2 rather than being rewritten in one high-risk change. New RC2 modules must use `DiDauServices` / `DiDauEngine`. Subsequent work can move route/geometry/account call sites out of `app.js` until it is only bootstrap/orchestration.

## Gates
`tests/core-v3-phase2-services.test.js` verifies route/account/POI/audit/GPS persistence and confirms Core Engine repositories read through the new service layer. B12–B14 and the Core v3 multi-route regression tests remain mandatory.
