# D1-RC1.2.0 — Mobile Install Validation

## GitHub production scope
- GitHub Pages enabled and deployed from `main`.
- HTTPS production URL fixed at `https://giaphatgpt123-wq.github.io/di-dau-day/`.
- PWA manifest uses 192×192 and 512×512 PNG icons.
- Apple Touch Icon included for iOS/iPadOS.
- Service Worker cache version: `d1-rc1.2-shell-v6`.
- GitHub Actions contains an automated PWA release gate before deployment.
- Quick install button and standalone detection are included in the application shell.

## Gate policy
GitHub/Pages may be PASS after a successful workflow deployment. Android install, iOS Add to Home Screen, offline reopen and update-with-data-retention remain PENDING until observed on a real device.
