# Deployment Guide

How to ship changes to the world.

## 1. Manual Deployment (Fastest)

Prerequisite: You must be logged in to Firebase CLI (`firebase login`).

### Deploy Everything (Site + Functions)
Use this when you have changed backend code (`functions/`) or want to do a full release.
```bash
# 1. Build the site (compiles SKier templates & Admin config)
npm run build

# 2. Deploy
firebase deploy
```

### Deploy Hosting Only (Faster)
Use this when you have only changed website content or templates (`content/`, `pages/`, `assets/`).
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Functions Only
Use this when you have only updated the OAuth gateway code.
```bash
firebase deploy --only functions
```
*Note: This automatically runs `npm run build` in the functions folder first, thanks to `firebase.json` predeploy hooks.*

## 2. CI/CD (CircleCI)
We use CircleCI to automatically deploy to production whenever a commit is pushed to the `main` branch.

### Configuration
The pipeline is defined in `.circleci/config.yml`.

### Key Steps
1.  **Install Dependencies**: Runs `npm install` in root AND `functions/`.
2.  **Build**: Runs `npm run build`.
3.  **Deploy**: Runs `firebase deploy` using a `FIREBASE_TOKEN` stored in CircleCI context.

### Troubleshooting CI
If the build fails on the "Deploy" step saying `functions/lib/index.js does not exist`:
*   **Cause**: The functions weren't compiled.
*   **Fix**: Ensure `firebase.json` has the `predeploy` hook: `"npm --prefix \"$RESOURCE_DIR\" run build"`.
*   **Check Cache**: We cache `functions/node_modules` to speed up builds. If you added a dependency and the build fails, the cache key might need updating (we use `package-lock.json` checksums).
