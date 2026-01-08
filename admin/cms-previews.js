/* global CMS, React */

// Register the main stylesheet and fonts
CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap");
CMS.registerPreviewStyle("/styles.min.css");

// Helper to make React calls less verbose
const h = React.createElement;

const HomePreview = ({ entry, getAsset }) => {
  const data = entry.getIn(['data']).toJS();

  if (!data) return h('div', {}, 'Loading...');

  const hero = data.hero || {};
  const story = data.story || {};
  const vibe = data.vibe || {};
  const merch = data.merch || {};
  const pbs = data.pbs || {};

  return h('body', { className: 'dark-theme' }, // Simulate body class
    h('main', {},
      // Hero Section
      h('section', { className: 'hero' },
        h('div', { className: 'hero-background' },
          hero.heroImage ? h('img', {
            src: getAsset(hero.heroImage).toString(),
            alt: 'Group of runners',
            className: 'hero-image'
          }) : null,
          h('div', { className: 'hero-overlay' })
        ),
        h('div', { className: 'hero-content container' },
          h('div', { className: 'hero-title-group' },
            h('span', { className: 'pre-title' }, 'Bingham'),
            h('h1', { className: 'hero-title' },
              h('span', { className: 'title-line' }, 'Sunday'),
              h('span', { className: 'title-line' }, 'Running'),
              h('span', { className: 'title-line' }, 'Club')
            )
          ),
          h('p', { className: 'hero-tagline' }, hero.tagline),
          h('div', { className: 'hero-actions' },
            h('a', { href: hero.ctaLink, className: 'btn btn-primary', target: '_blank' }, hero.ctaText)
          )
        )
      ),

      // Our Story Section
      h('section', { className: 'section section-story' },
        h('div', { className: 'container' },
          h('div', { className: 'story-grid' },
            h('div', { className: 'story-content' },
              h('span', { className: 'section-label' }, story.label),
              h('h2', { className: 'section-title' }, story.title),
              h('p', { className: 'section-text' }, story.description)
            ),
            h('div', { className: 'member-avatars' },
              (story.members || []).map((member, index) =>
                h('div', { key: index, className: 'avatar-item' },
                  h('div', { className: 'avatar-ring' },
                    member.photo ? h('img', {
                      src: getAsset(member.photo).toString(),
                      alt: member.name,
                      className: 'avatar-image'
                    }) : null
                  ),
                  h('span', { className: 'avatar-name' }, member.name),
                  h('span', { className: 'avatar-role' }, member.tagline)
                )
              )
            )
          )
        )
      ),

      // Weekly Vibe Section
      h('section', { className: 'section section-vibe' },
        h('div', { className: 'container' },
          h('h2', { className: 'section-title' }, vibe.title),
          h('div', { className: 'vibe-grid' },
            // Schedule Card (Simplified SVG for brevity if needed, or pasted)
            (vibe.scheduleCard) ? h('div', { className: 'vibe-card vibe-orange' },
              h('h3', { className: 'vibe-title' }, vibe.scheduleCard.title),
              h('div', { className: 'vibe-icon' },
                // Accessing SVG via dangerouslySetInnerHTML or just text for now to avoid complexity?
                // SVGs are complex in h(), I'll use placeholders or simplified text for now to save space, or just the labels.
                // Or simple shapes.
                h('span', { style: { fontSize: '2em' } }, '📅')
              ),
              h('a', { href: vibe.scheduleCard.buttonLink, className: 'btn btn-small' }, vibe.scheduleCard.buttonText)
            ) : null,

            (vibe.instagramCard) ? h('div', { className: 'vibe-card vibe-pink' },
              h('h3', { className: 'vibe-title' }, vibe.instagramCard.title),
              h('div', { className: 'vibe-icon' }, h('span', { style: { fontSize: '2em' } }, '📷')),
              h('a', { href: vibe.instagramCard.buttonLink, className: 'btn btn-small', target: '_blank' }, vibe.instagramCard.buttonText)
            ) : null,

            (vibe.stravaCard) ? h('div', { className: 'vibe-card vibe-white' },
              h('h3', { className: 'vibe-title' }, vibe.stravaCard.title),
              h('div', { className: 'vibe-icon strava-icon' }, h('span', { style: { fontSize: '2em', color: '#FC4C02' } }, '🏃')),
              h('span', { className: 'vibe-label' }, vibe.stravaCard.label),
              h('a', { href: vibe.stravaCard.buttonLink, className: 'btn btn-small btn-orange', target: '_blank' }, vibe.stravaCard.buttonText)
            ) : null
          )
        )
      ),

      // Merch Section
      (merch.items && merch.items.length > 0) ? h('section', { className: 'section section-merch' },
        h('div', { className: 'container' },
          h('div', { className: 'section-header' },
            h('h2', { className: 'section-title' }, merch.title),
            merch.description ? h('p', { className: 'section-subtitle' }, merch.description) : null
          ),
          h('div', { className: 'merch-grid' },
            merch.items.map((item, i) =>
              h('div', { key: i, className: 'merch-card' },
                h('div', { className: 'merch-image' },
                  h('img', {
                    src: item.image ? getAsset(item.image).toString() : '/images/merch-placeholder.jpg',
                    alt: item.name
                  })
                ),
                h('div', { className: 'merch-details' },
                  h('h3', { className: 'merch-name' }, item.name),
                  h('span', { className: 'merch-price' }, item.price)
                )
              )
            )
          ),
          h('p', { className: 'merch-note' }, merch.note)
        )
      ) : null,

      // Personal Bests
      (pbs.records && pbs.records.length > 0) ? h('section', { className: 'section section-pbs' },
        h('div', { className: 'container' },
          h('h2', { className: 'section-title' }, pbs.title),
          h('div', { className: 'pbs-list' },
            pbs.records.map((rec, i) =>
              h('div', { key: i, className: 'pb-item' },
                h('span', { className: 'pb-distance' }, rec.distance),
                h('div', { className: 'pb-details' },
                  h('span', { className: 'pb-time' }, rec.time),
                  h('span', { className: 'pb-runner' }, rec.name),
                  h('span', { className: 'pb-date' }, rec.date) // Date format might be raw ISO
                )
              )
            )
          )
        )
      ) : null

    )
  );
}

// Register for 'home' file in 'pages' collection
CMS.registerPreviewTemplate("home", HomePreview);

// Add basic previews for About and Contact to prevent raw JSON view
// About Preview
const AboutPreview = ({ entry, getAsset }) => {
  const data = entry.getIn(['data']).toJS();
  if (!data) return h('div', {}, 'Loading...');

  const philosophy = data.philosophy || {};
  const vibes = data.vibes || {};

  return h('body', { className: 'dark-theme' },
    h('main', { className: 'about-page' }, // Add wrappers if needed by CSS
      h('section', { className: 'section' },
        h('div', { className: 'container' },
          h('h1', { className: 'hero-title' }, data.title),
          h('p', { className: 'hero-tagline' }, data.subtitle)
          // Add more sections as per about.html...
          // Simplified for now to at least show title/subtitle properly with styles
        ),
        h('div', { className: 'container', style: { marginTop: '2rem' } },
          h('h2', { className: 'section-title' }, philosophy.heading),
          h('div', { className: 'content' }, philosophy.content) // Markdown rendering needed?
        )
      )
    )
  );
}
CMS.registerPreviewTemplate("about", AboutPreview);

const ContactPreview = ({ entry }) => {
  const data = entry.getIn(['data']).toJS();
  if (!data) return h('div', {}, 'Loading...');
  return h('body', { className: 'dark-theme' },
    h('main', {},
      h('section', { className: 'section' },
        h('div', { className: 'container' },
          h('h1', { className: 'section-title' }, data.title),
          h('p', { className: 'section-text' }, data.intro)
        )
      )
    )
  );
}
CMS.registerPreviewTemplate("contact", ContactPreview);
