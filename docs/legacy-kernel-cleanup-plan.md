# Legacy kernel cleanup

`app.js` is now a compatibility kernel only. Runtime ownership is:

1. `rc2-app-services-v3.js` — persistence/state boundary.
2. `rc2-route-geometry-domain-v3.js` — route/geometry business logic.
3. `rc2-engine-v3.js` — driving/advisor/alert/session core.
4. `rc2-ui-shell-v3.js` — top-level render/view routing.
5. `rc2-bootstrap-v3.js` — navigation/search/account boot wiring.

Cleanup rule: `app.js` may keep platform adapters and legacy callable APIs (GPS acquisition, trace capture, local account/POI modals, backup/import) but must delegate storage, route/geometry calculations and top-level rendering to the owners above. New business logic must not be added to `app.js`.
