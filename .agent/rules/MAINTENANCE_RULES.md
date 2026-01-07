# Documentation Maintenance Rules

**Attention Future Developers and AI Agents:**

This project prioritizes high-quality, up-to-date documentation. It is a community project maintained by volunteers, so documentation is the only lifeline.

## The Rule
> **If you change code, you MUST update the documentation.**

## The Doc Suite
All documentation lives in the `docs/` folder, except the root `README.md`.

| File | Purpose | Update When... |
| :--- | :--- | :--- |
| `README.md` | The entry point. | You change the project name, major tech stack, or high-level goals. |
| `docs/SETUP.md` | Dev environment guide. | You add system dependencies (like a new CLI tool) or change how to run the dev server. |
| `docs/ARCHITECTURE.md` | High-level system design. | You change the hosting provider, SSG, or add a database. |
| `docs/CMS_AUTH.md` | **CRITICAL**. OAuth logic. | You touch `functions/`, `admin/config.yml` (backend section), or change the GitHub App. |
| `docs/CONTENT_MODEL.md` | Content schemas. | You add new collections or fields to `admin/config.yml`. |
| `docs/DEPLOYMENT.md` | How to ship. | You change `.circleci/config.yml` or `firebase.json`. |

## How to Update
1.  **Check**: Before finishing a task, ask: "Did I change how this works?"
2.  **Edit**: Update the relevant markdown file.
3.  **Verify**: Ensure links between documents still work.

DO NOT let this documentation rot. It is as important as the code.
