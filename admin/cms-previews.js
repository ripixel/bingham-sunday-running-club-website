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
            h('div', { className: 'hero-text-box' },
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
              h('div', { className: 'story-team' },
                // Founder
                story.get('founder') ? h('div', { className: 'founder-section' },
                  h('div', { className: 'founder-avatar' },
                    h('div', { className: 'founder-ring' },
                      story.getIn(['founder', 'photo']) ? h('img', {
                        src: getAsset(story.getIn(['founder', 'photo'])).toString(),
                        alt: story.getIn(['founder', 'name']),
                        className: 'founder-image'
                      }) : null
                    )
                  ),
                  h('span', { className: 'founder-name' }, story.getIn(['founder', 'name'])),
                  h('span', { className: 'founder-role' }, story.getIn(['founder', 'tagline']))
                ) : null,

                // Key Members
                (story.get('keyMembers') && story.get('keyMembers').size > 0) ? h('div', { className: 'key-members' },
                  h('h3', { className: 'key-members-title' }, 'Key Members'),
                  h('div', { className: 'member-avatars' },
                    story.get('keyMembers').map(function (member, index) {
                      var accentColor = member.get('accentColor') || 'pink';
                      return h('div', { key: index, className: 'avatar-item' },
                        h('div', { className: 'avatar-ring avatar-ring-' + accentColor },
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
                ) : null
              )
            )
          )
        ),

        // Weekly Vibe Section
        h('section', { className: 'section section-vibe' },
          h('div', { className: 'container' },
            h('h2', { className: 'section-title' }, vibe.get('title')),
            h('div', { className: 'vibe-grid' },
              (vibe.get('cards') || []).map(function (card, index) {
                var target = card.get('openInNewTab') ? '_blank' : undefined;

                return h('a', {
                  key: index,
                  href: card.get('buttonLink'),
                  className: 'vibe-card',
                  target: target
                },
                  h('h3', { className: 'vibe-title' }, card.get('title')),
                  h('div', { className: 'vibe-icon' }, card.get('icon')),
                  card.get('description') ? h('span', { className: 'vibe-label' }, card.get('description')) : null,
                  h('span', { className: 'btn btn-small' }, card.get('buttonText'))
                );
              })
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
            h('div', { className: 'pbs-grid' },
              pbs.get('records').map(function (rec, i) {
                return h('div', { key: i, className: 'pb-card' },
                  h('div', { className: 'pb-icon' }, '🏆'),
                  h('div', { className: 'pb-content' },
                    h('span', { className: 'pb-distance' }, rec.get('distance')),
                    h('h3', { className: 'pb-time' }, rec.get('time')),
                    h('div', { className: 'pb-meta' },
                      h('span', { className: 'pb-runner' }, rec.get('name')),
                      h('span', { className: 'pb-separator' }, '•'),
                      h('span', { className: 'pb-date' }, rec.get('date'))
                    )
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
    var philosophy = entry.getIn(['data', 'philosophy']);
    var vibes = entry.getIn(['data', 'vibes']);
    var location = entry.getIn(['data', 'location']);

    return h('div', { className: 'dark-theme' },
      h('main', {},
        // Page Header
        h('section', { className: 'page-header' },
          h('div', { className: 'container' },
            h('h1', { className: 'page-title' }, entry.getIn(['data', 'title'])),
            h('p', { className: 'page-subtitle' }, entry.getIn(['data', 'subtitle']))
          )
        ),

        // About Content
        h('section', { className: 'section section-about' },
          h('div', { className: 'container' },
            h('div', { className: 'about-content' },

              // Philosophy Section
              philosophy ? h('div', { className: 'about-block' },
                h('h2', {}, philosophy.get('heading')),
                h('div', { className: 'markdown-content' }, philosophy.get('content'))
              ) : null,

              // Vibes Section
              vibes ? h('div', { className: 'about-block' },
                h('h2', {}, vibes.get('heading')),
                h('div', { className: 'markdown-content' }, vibes.get('content')),
                h('div', { className: 'values-list' },
                  (vibes.get('values') || []).map(function (value, index) {
                    return h('div', { key: index, className: 'value-item' },
                      h('span', { className: 'value-icon' }, value.get('icon')),
                      h('div', { className: 'value-content' },
                        h('h3', {}, value.get('title')),
                        h('p', {}, value.get('description'))
                      )
                    );
                  })
                )
              ) : null,

              // Location Section
              location ? h('div', { className: 'about-block' },
                h('h2', {}, location.get('heading')),
                h('div', { className: 'markdown-content' }, location.get('content'))
              ) : null
            )
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
        // Page Header
        h('section', { className: 'page-header' },
          h('div', { className: 'container' },
            h('h1', { className: 'page-title' }, entry.getIn(['data', 'title'])),
            h('p', { className: 'page-subtitle' }, entry.getIn(['data', 'subtitle']))
          )
        ),

        // Contact Content
        h('section', { className: 'section section-contact' },
          h('div', { className: 'container' },
            h('div', { className: 'contact-grid' },
              // Contact Info
              h('div', { className: 'contact-info' },
                h('h2', {}, entry.getIn(['data', 'sectionTitle'])),
                h('p', {}, entry.getIn(['data', 'intro'])),

                h('div', { className: 'contact-methods' },
                  (entry.getIn(['data', 'cards']) || []).map(function (card, index) {
                    return h('a', {
                      key: index,
                      href: card.get('link'),
                      className: 'contact-card',
                      target: '_blank'
                    },
                      h('div', {
                        className: 'contact-icon'
                      }, card.get('icon')),
                      h('div', { className: 'contact-text' },
                        h('h3', {}, card.get('title')),
                        h('p', {}, card.get('description'))
                      )
                    );
                  })
                )
              ),

              // Meeting Card (placeholder - actual data comes from about.json)
              h('div', { className: 'contact-meeting' },
                h('div', { className: 'meeting-card' },
                  h('h2', {}, '📍 Next Run'),
                  h('div', { className: 'meeting-details' },
                    h('div', { className: 'meeting-row' },
                      h('span', { className: 'meeting-label' }, 'When'),
                      h('span', { className: 'meeting-value' }, 'Every Sunday @ 9:00 AM')
                    ),
                    h('div', { className: 'meeting-row' },
                      h('span', { className: 'meeting-label' }, 'Where'),
                      h('span', { className: 'meeting-value' }, 'Bingham Market Place')
                    ),
                    h('div', { className: 'meeting-row' },
                      h('span', { className: 'meeting-label' }, 'Distance'),
                      h('span', { className: 'meeting-value' }, '5-10km (your choice!)')
                    ),
                    h('div', { className: 'meeting-row' },
                      h('span', { className: 'meeting-label' }, 'Afterwards'),
                      h('span', { className: 'meeting-value' }, 'Brunch at a local café ☕')
                    )
                  ),
                  h('p', { className: 'meeting-note' }, entry.getIn(['data', 'meetingNote']))
                )
              )
            )
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate("contact", ContactPreview);

// Events Page Preview
var EventsPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var getAsset = this.props.getAsset;

    return h('div', { className: 'dark-theme' },
      h('main', {},
        // Page Header
        h('section', { className: 'section-header' },
          h('div', { className: 'container' },
            h('h1', { className: 'page-title' }, entry.getIn(['data', 'title'])),
            h('p', { className: 'page-intro' }, entry.getIn(['data', 'intro']))
          )
        ),

        // Events List (Mock)
        h('section', { className: 'section section-events' },
          h('div', { className: 'container' },
            // Mock Next Run
            h('div', { className: 'next-run-highlight' },
              h('span', { className: 'highlight-label' }, 'Next Run'),
              h('div', { className: 'event-card featured blue' },
                h('div', { className: 'event-date' },
                  h('span', { className: 'date-day' }, 'Sunday 12th May'),
                  h('span', { className: 'date-time' }, '09:00')
                ),
                h('div', { className: 'event-details' },
                  h('h2', { className: 'event-title' }, 'Sunday Club Run'),
                  h('div', { className: 'event-meta' },
                    h('span', { className: 'meta-item location' }, '📍 Bingham Market Place'),
                    h('span', { className: 'meta-item distance' }, '📏 5-10km')
                  )
                )
              )
            ),

            // Mock Upcoming
            h('h2', { className: 'section-title' }, 'Upcoming Runs'),
            h('div', { className: 'events-grid' },
              [1, 2, 3].map(function (i) {
                return h('div', { key: i, className: 'event-card blue' },
                  h('div', { className: 'event-header' },
                    h('span', { className: 'event-date-short' }, 'Sun ' + (12 + i * 7) + 'th May'),
                    h('span', { className: 'event-time-short' }, '09:00')
                  ),
                  h('div', { className: 'event-body-content' },
                    h('h3', { className: 'event-title-small' }, 'Sunday Club Run'),
                    h('div', { className: 'event-meta-small' },
                      h('span', {}, 'Bingham Market Place'),
                      h('span', {}, '5-10km')
                    )
                  )
                );
              })
            )
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate("events", EventsPreview);
