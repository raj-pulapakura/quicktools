# QuickTools Landing Page

This folder is a standalone static site intended for Vercel.

## Configure

Set your repo slug in `config.js`:

```js
window.QUICKTOOLS_REPO = "YOUR_GITHUB_USERNAME/YOUR_REPO";
```

The page uses GitHub Releases API to fetch latest assets and wire download buttons.

## Vercel Settings

- Root Directory: `landing`
- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: `.`
