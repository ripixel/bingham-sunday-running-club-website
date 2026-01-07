# Setup Guide

This guide will take you from "I just cloned the repo" to "I have the site running locally".

## 1. Prerequisites

You need the following tools installed on your machine:
- **Node.js**: v18 or v20 recommended (v22 is also fine).
- **Firebase CLI**: Install globally with `npm install -g firebase-tools`.
- **Git**: To manage the code.

## 2. Installation

This project has two distinct parts that need dependencies: the **root** (website/build tools) and **functions** (backend).

```bash
# 1. Install root dependencies (Skier, local scripts)
npm install

# 2. Install functions dependencies (Express, OAuth utils)
cd functions
npm install
cd ..
```

## 3. Local Development

### Running the Website
To run the static site generator in "watch" mode (with live reload):

```bash
npm run dev
```
*   This runs `skier --debug`.
*   Site usually opens at: `http://localhost:3000` (check console output).

### Running the Backend (Optional but recommended)
If you need to work on the OAuth login or other backend features, you must run the Firebase Emulators.

```bash
# In a separate terminal window:
firebase emulators:start --only functions
```

*   **Note**: The "Login with GitHub" button in local dev might try to hit the *production* function URL (`bingham-sunday-running-club.web.app`) unless you manually configure it to hit `localhost`. For most content editing tasks, you don't need this running locally; you can just verify the UI.

## 4. Configuration files
-   `firebase.json`: Configures Hosting rewrites and Functions predeploy hooks.
-   `.firebaserc`: Maps the project to the Firebase project ID (`bingham-sunday-running-club`).
-   `admin/config.yml`: The heart of the CMS configuration.
