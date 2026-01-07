# Bingham Sunday Running Club Website

🏃‍♀️ **All Paces. All Smiles. Just Show Up.**

The official website for Bingham Sunday Running Club - a friendly, inclusive running community that values good vibes over fast times.

## Tech Stack

- **Static Site Generator:** [Skier](https://github.com/ripixel/skier)
- **Hosting:** Firebase Hosting
- **CI/CD:** CircleCI
- **CMS:** [Decap CMS](https://decapcms.org/) (for non-technical content updates)
- **Styling:** Mobile-first CSS

## Getting Started

### Prerequisites

- Node.js v22+ (see `.nvmrc`)
- npm v9+

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Build with debug output
npm run dev

# Serve locally (after building)
npm run serve
```

### Production Build

```bash
npm run build
```

The built site will be output to `./public`

## Project Structure

```
bingham-sunday-running-club-website/
├── admin/                  # Decap CMS admin panel
│   ├── index.html
│   └── config.yml
├── assets/
│   ├── images/             # Static images
│   └── styles/
│       └── main.css        # Main stylesheet
├── content/                # CMS-editable content
│   ├── pages/
│   │   ├── home.json
│   │   ├── about.json
│   │   └── contact.json
│   └── settings/
│       └── general.json
├── pages/                  # Handlebars page templates
│   ├── index.html
│   ├── about.html
│   ├── gallery.html
│   └── contact.html
├── partials/               # Reusable template components
│   ├── head.html
│   ├── header.html
│   └── footer.html
├── public/                 # Built output (gitignored)
├── .circleci/
│   └── config.yml          # CI/CD configuration
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project alias
├── skier.tasks.cjs         # Skier build pipeline
└── package.json
```

## CMS (Decap CMS)

Access the content management system at `/admin` after deployment.

### Setting up CMS Auth

1. **For GitHub Backend:**
   - Update `admin/config.yml` with your GitHub repo details
   - Set up a GitHub OAuth App
   - Configure the OAuth provider in your hosting

2. **For Git Gateway (Netlify Identity):**
   - Uncomment the git-gateway backend in `admin/config.yml`
   - Set up Netlify Identity on your site

## Deployment

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Update `.firebaserc` with your project ID
3. Generate a CI token: `firebase login:ci`
4. Add the token as `FIREBASE_TOKEN` in CircleCI environment variables

### CircleCI Setup

1. Connect your GitHub repo to CircleCI
2. Add environment variable: `FIREBASE_TOKEN`
3. Pushes to `main` branch will auto-deploy

### Manual Deploy

```bash
firebase deploy
```

## Adding Images

Replace placeholder images in `assets/images/`:

| File | Purpose |
|------|---------|
| `hero-runners.jpg` | Hero section background |
| `avatar-sarah.jpg`, `avatar-mike.jpg`, `avatar-chen.jpg` | Member avatars |
| `gallery-1.jpg` to `gallery-8.jpg` | Gallery photos |
| `moment-1.jpg`, `moment-2.jpg` | Moments & Memories card |
| `favicon.ico` | Browser tab icon |
| `apple-touch-icon.png` | iOS home screen icon |
| `og-image.jpg` | Social media sharing image |
| `logo.png` | Site logo |

## License

MIT
