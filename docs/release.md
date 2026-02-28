# Release and Deployment

This project ships a macOS Tauri app and a separate static landing page.

## 1. Configure app metadata

1. Confirm app identifier and version in `src-tauri/tauri.conf.json`.
2. Keep `package.json` and Tauri version in sync for each release.
3. Ensure app icon exists at `src-tauri/icons/icon.png`.

## 2. Add required GitHub secrets

In your GitHub repo: `Settings -> Secrets and variables -> Actions`.

Add these secrets:

- `APPLE_CERTIFICATE`: Base64-encoded `.p12` signing certificate.
- `APPLE_CERTIFICATE_PASSWORD`: Password used when exporting `.p12`.
- `APPLE_SIGNING_IDENTITY`: Identity name from Keychain (example: `Developer ID Application: Your Name (TEAMID)`).
- `APPLE_ID`: Apple ID email used for notarization.
- `APPLE_PASSWORD`: App-specific Apple ID password.
- `APPLE_TEAM_ID`: Apple Developer Team ID.

## 3. Trigger release

The workflow is at `.github/workflows/release-macos.yml`.

Release options:

1. Push a Git tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

2. Or run the workflow manually from GitHub Actions and pass `tag`.

The workflow creates/updates a draft GitHub Release and uploads signed, notarized macOS artifacts.

## 4. Publish release

1. Open the draft release in GitHub.
2. Add changelog notes.
3. Publish the release.

## 5. Deploy landing page to Vercel

The landing site lives in `landing/`.

In Vercel project settings:

- Root Directory: `landing`
- Framework Preset: `Other`
- Build Command: (leave empty)
- Output Directory: `.`

Before first deploy, edit `landing/config.js` and set your GitHub repo slug:

```js
window.QUICKTOOLS_REPO = "YOUR_GITHUB_USERNAME/YOUR_REPO";
```

After deploying, the landing page fetches latest release assets and points download buttons to the newest macOS builds.
