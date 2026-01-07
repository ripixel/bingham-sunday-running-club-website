# Bingham Sunday Running Club Website

**No Pace. No Pressure. Just Good Vibes.**

This is the repository for the official website of the Bingham Sunday Running Club. It is a static site powered by **Skier**, hosted on **Firebase**, and managed via **Decap CMS**.

## 🚀 Quick Start
*(Full guide in [docs/SETUP.md](docs/SETUP.md))*

```bash
# 1. Install Dependencies
npm install
cd functions && npm install && cd ..

# 2. Run Locally
npm run dev
```
Open `http://localhost:3000`.

## 📚 Documentation
This project is thoroughly documented to help community maintainers.

*   **[Setup Guide](docs/SETUP.md)**: Start here! How to install tools and get running.
*   **[Architecture](docs/ARCHITECTURE.md)**: How Skier, Firebase, and Decap CMS work together.
*   **[CMS Authentication](docs/CMS_AUTH.md)**: **IMPORTANT**. Explains the custom OAuth gateway because netlify-identity doesn't work on Firebase. Read this if Auth breaks.
*   **[Content Model](docs/CONTENT_MODEL.md)**: How to add new fields to the CMS and use them in templates.
*   **[Deployment](docs/DEPLOYMENT.md)**: How to deploy via CLI or CircleCI.

## 🤝 Contributing
The content of this site is managed by club admins via the `/admin` portal.
The code is managed by community developers here on GitHub.

### Permissions
*   **Content**: Ask an admin to add you to the GitHub repository collaborators list.
*   **Code**: Please open a Pull Request.

---
*Maintained with ❤️ by the BSRC Community.*
