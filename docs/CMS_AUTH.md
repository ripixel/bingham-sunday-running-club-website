# CMS Authentication Deep Dive

This document explains the custom authentication flow used to allow Decap CMS to run on Firebase Hosting with GitHub storage.

> [!WARNING]
> This is the most complex part of the system. **Do not modify** the `functions/` code or the `admin/config.yml` backend settings unless you fully understand the OAuth handshake described below.

## The Problem
Decap CMS was built for Netlify. Its default "Netlify Identity" widget requires Netlify's backend. Since we host on Firebase, we cannot use it.

## The Solution: OAuth Gateway
We use a **Custom OAuth Gateway** running as a Firebase Cloud Function.
1.  **User** clicks "Login with GitHub" in the CMS.
2.  **CMS** opens a popup: `https://<site-url>/api/auth`.
3.  **Function** redirects the user to `github.com`.
4.  **User** approves the app on GitHub.
5.  **GitHub** redirects back to `https://<site-url>/api/callback` with a temporary `code`.
6.  **Function** takes that code, swaps it for a secure `access_token`, and sends it back to the CMS using `window.postMessage`.
7.  **CMS** saves the token in the browser and uses it to talk to the GitHub API.

## Granting Access (How to add users)
There is no database of users in Firebase. Authentication is delegated entirely to GitHub repository permissions.

### To give a friend access to the Admin Panel:
1.  **They must have a GitHub Account**. (Free).
2.  **Go to the Repository on GitHub**: Settings > Collaborators.
3.  **Add People**: Enter their email or username and invite them.
4.  **Accept Invite**: They must check their email and accept the invitation.
5.  **Done**: They can now go to `https://bingham-sunday-running-club.web.app/admin` and log in.

## Configuration

### 1. `admin/config.yml`
Tells Decap CMS where to find our gateway.
```yaml
backend:
  name: github
  base_url: https://bingham-sunday-running-club.web.app  # Point to OUR site (for auth)
  auth_endpoint: api/auth                              # Point to OUR function
  api_root: https://api.github.com                       # Point to GITHUB (for content)
```

### 2. Firebase Secrets
The function needs your GitHub OAuth App credentials.
*   `OAUTH_CLIENT_ID`
*   `OAUTH_CLIENT_SECRET`

Updated via: `firebase functions:secrets:set OAUTH_CLIENT_ID`

### 3. GitHub OAuth App
In GitHub Developer Settings, the app MUST allow these callbacks:
*   **Authorization callback URL**: `https://bingham-sunday-running-club.web.app/api/callback`

(If you change the domain, you MUST update this URL).
