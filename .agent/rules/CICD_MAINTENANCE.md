# CI/CD Maintenance Guide

**For: AI Agents & Maintainers**

This document explains how to safely modify the build and deployment pipeline. The pipeline is fragile and distributed across three files. **If you change one, you usually must update the others.**

## The Triad of Configuration

| File | Role | Critical Dependency |
| :--- | :--- | :--- |
| `package.json` | Defines `scripts` (`build`, `dev`). | The source of truth for *how* to build. |
| `firebase.json` | Configures Manual Deployment. | MUST match `package.json` logic via `predeploy` hooks. |
| `.circleci/config.yml` | Configures CI/CD Deployment. | MUST mirror the steps in `firebase.json` AND specifically handle caching. |

## Scenario: "I changed how the build works"

**IF** you modify `npm run build` (or add a new build step):

1.  **Update `package.json`**:
    *   Ensure the script works locally (`npm run build`).

2.  **Check `firebase.json`**:
    *   Look at `functions.predeploy`. It currently runs `npm --prefix "$RESOURCE_DIR" run build`.
    *   Does your change require a new `predeploy` hook? (e.g., if you added a database migration script).

3.  **Update `.circleci/config.yml`** (The most common point of failure):
    *   **Dependencies**: If you added a new folder with a `package.json` (like `functions/`), you MUST add a `npm install` step for it in the `install_deps` job.
    *   **Caching**: If you added a new `node_modules` folder, you MUST add it to the `save_cache` -> `paths` list.
    *   **Cache Keys**: If you added a new `package-lock.json`, you MUST add it to the `key` checksum (e.g., `checksum "functions/package-lock.json"`). **Failure to do this will cause the build to use old dependencies.**

## Scenario: "I added a new Backend Service"

**IF** you add something like a new Python script or Go binary:

1.  **Firebase CLI**: You might need to add a `firebase.json` entry.
2.  **CircleCI Docker Image**: The current image is `cimg/node:22.21.1`. If you need Python/Go, you must change the executor or use a generic image and install tools manually.

## Checklist for CI Changes
- [ ] Did you run `npm run build` locally?
- [ ] Did you deploy locally with `firebase deploy`? (Tests `firebase.json` hooks)
- [ ] Did you verify `.circleci/config.yml` installs ALL dependencies?
- [ ] Did you verify `.circleci/config.yml` caches ALL `node_modules`?
