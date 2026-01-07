# Architecture Overview

This project uses a "Hybrid" JAMstack architecture to provide a dynamic CMS experience on a static host without monthly fees.

## The Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **SSG** | [Skier](https://github.com/ripixel/skier) | Compiles JSON content and HTML templates into the final static site. |
| **Hosting** | Firebase Hosting | Serves the static files (`public/`) globally. |
| **CMS** | [Decap CMS](https://decapcms.org/) | A Single Page App (SPA) that runs in `/admin`. It edits JSON files in the Git repo directly. |
| **Backend** | Cloud Functions | Acts as an OAuth 2.0 gateway to allow Decap CMS to authenticate with GitHub. |

## Data Flow
1.  **Content**: All content lives in `content/` as JSON files.
2.  **Build**: When you run `npm run build`, Skier reads `content/`, applies it to templates in `pages/` and `partials/`, and outputs HTML to `public/`.
3.  **Edit**: When a user logs into `/admin`, Decap CMS reads the data *directly from the GitHub API*, not your live site.
4.  **Save**: When a user saves, Decap CMS makes a Commit (or PR) to the GitHub repository.
5.  **Deploy**: A CI/CD pipeline (CircleCI) detects the commit, runs the build, and deploys the new static files to Firebase.

## Key Directories

*   `admin/`: Contains the CMS entry point (`index.html`) and configuration (`config.yml`).
*   `functions/`: The TypeScript code for the OAuth gateway.
*   `content/`: The raw data files.
*   `assets/`: CSS, Images, and other static assets.
*   `pages/`: HTML templates for the site's pages.
*   `partials/`: Reusable HTML components (Nav, Footer, etc).
*   `public/`: The compilation output (ignored by Git).
