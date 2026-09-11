# Android release signing · Đi Đâu Đây D1

Release package identity is fixed at `com.pdhtravel.didauday`.

Current release line:
- `versionCode`: `151`
- `versionName`: `1.5.1`

The repository must never contain the private signing keystore or passwords. The signed release workflow `.github/workflows/android-release.yml` reads exactly these GitHub repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The workflow decodes the keystore into the GitHub Actions runner, validates the alias, runs `:app:assembleRelease`, verifies the APK with `apksigner`, checks package/version identity with `aapt`, and uploads a single signed installer plus SHA-256.

For every future Android release:
1. Keep `applicationId` unchanged.
2. Reuse the same release keystore.
3. Increase `versionCode` monotonically.
4. Update `versionName` as needed.
5. Build through `Build Signed Android Release`.
6. Verify the APK signature and SHA-256 before distribution.

Losing the release keystore breaks the upgrade chain for directly distributed APKs. Never replace it with a newly generated key for an existing installed package.
