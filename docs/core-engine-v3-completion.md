# Core Engine v3 architecture completion

Runtime ownership is now separated into explicit layers:

1. `rc2-app-services-v3.js` — persistence/state boundary.
2. `rc2-route-geometry-domain-v3.js` — route, geometry, trace, QA and map-matching domain.
3. `rc2-engine-v3.js` — GPS context, POI repository, driving advisor, alerts and driving session.
4. RC2 feature adapters — discovery/driving/alerts/rest/status and related UI feature modules.
5. `rc2-ui-shell-v3.js` — primary routes/geometry/library/admin renderers and top-level view routing.
6. `rc2-bootstrap-v3.js` — final navigation/search/account wiring and UI boot.

`app.js` remains loaded only as a legacy compatibility kernel for older GPS capture, trace capture, account dialogs, import/export and APIs that have not yet been deleted. New business logic, route-specific policy, storage access, top-level render routing, or bootstrap wiring MUST NOT be added to `app.js`.

Route identifiers belong in route/POI data. Core, UI shell and bootstrap must remain route-agnostic.

The architecture gate requires B12, B13, B14, multi-route Core v3, application services, Route/Geometry domain, and UI/Bootstrap ownership tests to pass. PWA and Android offline bundles must contain every architectural layer.

Legacy deletion is a cleanup task, not a runtime architecture dependency: compatibility functions can be removed incrementally only after their callers are migrated and covered by tests.
