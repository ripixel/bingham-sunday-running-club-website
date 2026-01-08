/* global CMS, createClass, h */

// Register the main stylesheet and fonts
CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap");
CMS.registerPreviewStyle("/styles.min.css");

// Home Page Preview
var HomePreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var getAsset = this.props.getAsset;

    var hero = entry.getIn(['data', 'hero']) || {};
    var story = entry.getIn(['data', 'story']) || {};
    var vibe = entry.getIn(['data', 'vibe']) || {};
    var merch = entry.getIn(['data', 'merch']) || {};
    var pbs = entry.getIn(['data', 'pbs']) || {};

    return h('div', { className: 'dark-theme' },
      h('main', {},
        // Hero Section
        h('section', { className: 'hero' },
          h('div', { className: 'hero-background' },
            hero.get('heroImage') ? h('img', {
              src: getAsset(hero.get('heroImage')).toString(),
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
            h('p', { className: 'hero-tagline' }, hero.get('tagline')),
            h('div', { className: 'hero-actions' },
              h('a', { href: hero.get('ctaLink'), className: 'btn btn-primary', target: '_blank' }, hero.get('ctaText'))
            )
          )
        ),

        // Our Story Section
        h('section', { className: 'section section-story' },
          h('div', { className: 'container' },
            h('div', { className: 'story-grid' },
              h('div', { className: 'story-content' },
                h('span', { className: 'section-label' }, story.get('label')),
                h('h2', { className: 'section-title' }, story.get('title')),
                h('p', { className: 'section-text' }, story.get('description'))
              ),
              h('div', { className: 'member-avatars' },
                (story.get('members') || []).map(function (member, index) {
                  return h('div', { key: index, className: 'avatar-item' },
                    h('div', { className: 'avatar-ring' },
                      member.get('photo') ? h('img', {
                        src: getAsset(member.get('photo')).toString(),
                        alt: member.get('name'),
                        className: 'avatar-image'
                      }) : null
                    ),
                    h('span', { className: 'avatar-name' }, member.get('name')),
                    h('span', { className: 'avatar-role' }, member.get('tagline'))
                  );
                })
              )
            )
          )
        ),

        // Weekly Vibe Section
        h('section', { className: 'section section-vibe' },
          h('div', { className: 'container' },
            h('h2', { className: 'section-title' }, vibe.get('title')),
            h('div', { className: 'vibe-grid' },
              // Schedule Card
              vibe.get('scheduleCard') ? h('div', { className: 'vibe-card vibe-orange' },
                h('h3', { className: 'vibe-title' }, vibe.getIn(['scheduleCard', 'title'])),
                h('div', { className: 'vibe-icon' }, '📅'),
                h('a', { href: vibe.getIn(['scheduleCard', 'buttonLink']), className: 'btn btn-small' },
                  vibe.getIn(['scheduleCard', 'buttonText']))
              ) : null,

              // Instagram Card
              vibe.get('instagramCard') ? h('div', { className: 'vibe-card vibe-pink' },
                h('h3', { className: 'vibe-title' }, vibe.getIn(['instagramCard', 'title'])),
                h('div', { className: 'vibe-icon' }, '📷'),
                h('a', { href: vibe.getIn(['instagramCard', 'buttonLink']), className: 'btn btn-small', target: '_blank' },
                  vibe.getIn(['instagramCard', 'buttonText']))
              ) : null,

              // Strava Card
              vibe.get('stravaCard') ? h('div', { className: 'vibe-card vibe-white' },
                h('h3', { className: 'vibe-title' }, vibe.getIn(['stravaCard', 'title'])),
                h('div', { className: 'vibe-icon strava-icon' }, '🏃'),
                h('span', { className: 'vibe-label' }, vibe.getIn(['stravaCard', 'label'])),
                h('a', { href: vibe.getIn(['stravaCard', 'buttonLink']), className: 'btn btn-small btn-orange', target: '_blank' },
                  vibe.getIn(['stravaCard', 'buttonText']))
              ) : null
            )
          )
        ),

        // Merch Section
        (merch.get('items') && merch.get('items').size > 0) ? h('section', { className: 'section section-merch' },
          h('div', { className: 'container' },
            h('div', { className: 'section-header' },
              h('h2', { className: 'section-title' }, merch.get('title')),
              merch.get('description') ? h('p', { className: 'section-subtitle' }, merch.get('description')) : null
            ),
            h('div', { className: 'merch-grid' },
              merch.get('items').map(function (item, i) {
                return h('div', { key: i, className: 'merch-card' },
                  h('div', { className: 'merch-image' },
                    h('img', {
                      src: item.get('image') ? getAsset(item.get('image')).toString() : '/images/merch-placeholder.jpg',
                      alt: item.get('name')
                    })
                  ),
                  h('div', { className: 'merch-details' },
                    h('h3', { className: 'merch-name' }, item.get('name')),
                    h('span', { className: 'merch-price' }, item.get('price'))
                  )
                );
              })
            ),
            h('p', { className: 'merch-note' }, merch.get('note'))
          )
        ) : null,

        // Personal Bests
        (pbs.get('records') && pbs.get('records').size > 0) ? h('section', { className: 'section section-pbs' },
          h('div', { className: 'container' },
            h('h2', { className: 'section-title' }, pbs.get('title')),
            h('div', { className: 'pbs-list' },
              pbs.get('records').map(function (rec, i) {
                return h('div', { key: i, className: 'pb-item' },
                  h('span', { className: 'pb-distance' }, rec.get('distance')),
                  h('div', { className: 'pb-details' },
                    h('span', { className: 'pb-time' }, rec.get('time')),
                    h('span', { className: 'pb-runner' }, rec.get('name')),
                    h('span', { className: 'pb-date' }, rec.get('date'))
                  )
                );
              })
            )
          )
        ) : null
      )
    );
  }
});

CMS.registerPreviewTemplate("home", HomePreview);

// About Page Preview
var AboutPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var philosophy = entry.getIn(['data', 'philosophy']) || {};

    return h('div', { className: 'dark-theme' },
      h('main', { className: 'about-page' },
        h('section', { className: 'section' },
          h('div', { className: 'container' },
            h('h1', { className: 'section-title' }, entry.getIn(['data', 'title'])),
            h('p', { className: 'hero-tagline' }, entry.getIn(['data', 'subtitle']))
          ),
          h('div', { className: 'container', style: { marginTop: '2rem' } },
            h('h2', { className: 'section-title' }, philosophy.get('heading')),
            h('div', { className: 'content' }, philosophy.get('content'))
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate("about", AboutPreview);

// Contact Page Preview
var ContactPreview = createClass({
  render: function () {
    var entry = this.props.entry;

    return h('div', { className: 'dark-theme' },
      h('main', {},
        h('section', { className: 'section' },
          h('div', { className: 'container' },
            h('h1', { className: 'section-title' }, entry.getIn(['data', 'title'])),
            h('p', { className: 'section-text' }, entry.getIn(['data', 'intro']))
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate("contact", ContactPreview);
