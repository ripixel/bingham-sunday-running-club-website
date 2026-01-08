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
                h('p', { className: 'section-text' }, story.get('description')),
                // Buttons
                (story.get('buttons') && story.get('buttons').size > 0) ? h('div', { className: 'story-buttons' },
                  story.get('buttons').map(function (btn, i) {
                    return h('a', {
                      key: i,
                      href: btn.get('link'),
                      className: 'btn btn-' + (btn.get('style') || 'primary')
                    }, btn.get('text'));
                  })
                ) : null
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
            h('div', { className: 'section-header' },
              h('h2', { className: 'section-title' }, vibe.get('title')),
              vibe.get('description') ? h('p', { className: 'section-subtitle' }, vibe.get('description')) : null
            ),
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

        // Personal Bests
        (pbs.get('records') && pbs.get('records').size > 0) ? h('section', { className: 'section section-pbs' },
          h('div', { className: 'container' },
            h('div', { className: 'section-header' },
              h('h2', { className: 'section-title' }, pbs.get('title')),
              pbs.get('description') ? h('p', { className: 'section-subtitle' }, pbs.get('description')) : null
            ),
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
        ) : null,

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
    var getAsset = this.props.getAsset;
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

              // Route Section
              (entry.getIn(['data', 'route'])) ? h('section', { className: 'section section-route' },
                h('div', { className: 'container' },
                  h('div', { className: 'section-title' },
                    h('span', { className: 'section-label' }, 'THE COURSE'),
                    h('h2', {}, entry.getIn(['data', 'route', 'heading'])),
                    h('p', { className: 'section-text' }, entry.getIn(['data', 'route', 'description']))
                  ),

                  h('div', { className: 'route-container' },
                    // Controls
                    h('div', { className: 'route-controls' },
                      // Tabs
                      h('div', { className: 'route-tabs' },
                        (entry.getIn(['data', 'route', 'loops']) || []).map(function (loop, i) {
                          return h('button', { key: i, className: 'route-tab ' + (i === 0 ? 'active' : '') },
                            h('span', { className: 'tab-title' }, loop.get('title')),
                            h('span', { className: 'tab-dist' }, loop.get('distance'))
                          );
                        })
                      ),

                      // Calculator (Static Mock)
                      h('div', { className: 'route-calculator theme-pink' },
                        h('div', { className: 'calc-equation' },
                          h('span', { className: 'calc-static' }, 'Approach (0.55km)'),
                          h('span', { className: 'calc-op' }, '+'),
                          h('div', { className: 'calc-input-wrapper' },
                            h('input', { type: 'number', className: 'calc-input', value: '1', disabled: true }),
                            h('span', { className: 'calc-label' }, 'laps')
                          ),
                        ),
                        h('div', { className: 'calc-result' },
                          h('span', { className: 'calc-op' }, '≈'),
                          h('span', { className: 'calc-total-value' }, '1.35km')
                        )
                      ),

                      // Info
                      h('div', { className: 'route-info' },
                        // Approach
                        h('div', { className: 'approach-info' },
                          h('h3', {}, entry.getIn(['data', 'route', 'approach', 'title'])),
                          h('p', {}, entry.getIn(['data', 'route', 'approach', 'description']))
                        ),

                        // Loops
                        (entry.getIn(['data', 'route', 'loops']) || []).map(function (loop, i) {
                          // Always show all loops in preview for editing, or just the first?
                          // Let's show all but maybe styled as if they are lists for the preview sake,
                          // or just show the active one. The user asked to update preview to account for changes.
                          // Live site hides inactive ones. For CMS it's often better to see all content.
                          // Let's force them distinct by adding color classes directly or just listing them.
                          // Actually, the CSS hides .loop-info that isn't active.
                          // Let's mimic the structure but force display for preview context or just active first.
                          // Simplest is to render them all but override display style inline if needed,
                          // OR just render them as a list for the editor to see.
                          // Let's adhere to the "active" visual.
                          var isActive = i === 0;
                          return h('div', {
                            key: i,
                            className: 'loop-info loop-info-' + loop.get('id') + (isActive ? ' active' : ''),
                            style: { display: isActive ? 'block' : 'none' } // Force display logic if CSS relies on JS
                          },
                            h('h3', {}, loop.get('title')),
                            h('p', {}, loop.get('description'))
                          );
                        }),

                        // Finishing
                        h('div', { className: 'finishing-info' },
                          h('h3', {}, entry.getIn(['data', 'route', 'finishing', 'title'])),
                          h('p', {}, entry.getIn(['data', 'route', 'finishing', 'description']))
                        )
                      )
                    ),

                    // Map Placeholder
                    h('div', { className: 'route-map-container' },
                      h('div', {
                        style: {
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '1.5rem',
                          background: '#e5e7eb'
                        }
                      }, 'Interactive Map Preview')
                    )
                  )
                )
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
                h('div', { className: 'markdown-content' }, location.get('content')),
                location.get('mapLink') ? h('div', { className: 'location-actions', style: { marginTop: '1.5rem' } },
                  h('a', {
                    href: location.get('mapLink'),
                    className: 'btn btn-green',
                    target: '_blank'
                  }, location.get('mapLinkText') || 'Open in Google Maps')
                ) : null,

                // Parking Section
                location.get('parking') ? h('div', { className: 'parking-section' },
                  h('h3', {}, location.getIn(['parking', 'heading'])),
                  h('div', { className: 'parking-grid' },
                    (location.getIn(['parking', 'options']) || []).map(function (option, i) {
                      return h('div', { key: i, className: 'parking-card' },
                        h('h4', {}, option.get('title')),
                        h('p', {}, option.get('description'))
                      );
                    })
                  )
                ) : null,

                // Post-Run Section
                entry.getIn(['data', 'postRun']) ? h('div', { className: 'section-post-run' },
                  h('h3', {}, entry.getIn(['data', 'postRun', 'heading'])),
                  h('p', { className: 'post-run-desc' }, entry.getIn(['data', 'postRun', 'description'])),
                  h('div', { className: 'post-run-container' },
                    h('div', { className: 'post-run-image' },
                      entry.getIn(['data', 'postRun', 'image']) ? h('img', {
                        src: getAsset(entry.getIn(['data', 'postRun', 'image'])).toString(),
                        alt: entry.getIn(['data', 'postRun', 'venueName'])
                      }) : null
                    ),
                    h('div', { className: 'post-run-content' },
                      h('div', { className: 'post-run-features' },
                        (entry.getIn(['data', 'postRun', 'features']) || []).map(function (feature, i) {
                          return h('span', { key: i, className: 'feature-tag' }, feature);
                        })
                      )
                    )
                  )
                ) : null

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

// Events Preview - handles both Events Page and individual Special Events
var EventsPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var getAsset = this.props.getAsset;

    // Check if this is the Events Page (has 'intro') or a Special Event (has 'date')
    var isEventsPage = entry.getIn(['data', 'intro']) !== undefined;

    if (isEventsPage) {
      // Events Page Preview
      return h('div', { className: 'dark-theme' },
        h('main', {},
          // Page Header
          h('section', { className: 'page-header' },
            h('div', { className: 'container' },
              h('h1', { className: 'page-title' }, entry.getIn(['data', 'title'])),
              h('p', { className: 'page-subtitle' }, entry.getIn(['data', 'intro']))
            )
          ),

          // Mock Events Section
          h('section', { className: 'section section-events' },
            h('div', { className: 'container' },
              h('p', { style: { textAlign: 'center', color: '#999', padding: '3rem 0' } },
                'Events will be dynamically populated from the Special Events collection.'
              )
            )
          )
        )
      );
    }

    // Special Event Preview

    // Extract data
    var title = entry.getIn(['data', 'title']) || 'Event Title';
    var dateStr = entry.getIn(['data', 'date']);
    var location = entry.getIn(['data', 'location']) || 'Bingham Market Place';
    var distance = entry.getIn(['data', 'distance']);
    var meetingNote = entry.getIn(['data', 'meetingNote']);
    var body = entry.getIn(['data', 'body']); // Description
    var link = entry.getIn(['data', 'link']); // Sign up link
    var linkText = entry.getIn(['data', 'linkText']) || 'Sign Up / Info';

    // Format Date
    var displayDate = 'Date TBD';
    var displayTime = '09:00';

    if (dateStr) {
      var dateObj = new Date(dateStr);
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      var dayName = days[dateObj.getDay()];
      var dayNum = dateObj.getDate();
      var monthName = months[dateObj.getMonth()];

      // Suffix for day
      var suffix = 'th';
      if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
      else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
      else if (dayNum === 3 || dayNum === 23) suffix = 'rd';

      displayDate = dayName + ' ' + dayNum + suffix + ' ' + monthName;

      var hours = dateObj.getHours().toString().padStart(2, '0');
      var minutes = dateObj.getMinutes().toString().padStart(2, '0');
      displayTime = hours + ':' + minutes;
    }

    return h('div', { className: 'dark-theme' },
      h('main', {},
        // Page Header
        h('section', { className: 'section-header' },
          h('div', { className: 'container' },
            h('h1', { className: 'page-title' }, title),
            h('p', { className: 'page-intro' }, 'Preview of how this event will appear as the "Next Run"')
          )
        ),

        // Events List (with "Next Run" populated by this event)
        h('section', { className: 'section section-events' },
          h('div', { className: 'container' },

            // Next Run Highlight (Card Style)
            h('div', { className: 'next-run-highlight' },
              h('span', { className: 'highlight-label' }, 'Next Run'),
              h('div', { className: 'event-card featured orange' }, // Orange background
                h('div', { className: 'event-date' },
                  h('span', { className: 'date-day' }, displayDate),
                  h('span', { className: 'date-time' }, displayTime)
                ),
                h('div', { className: 'event-details' },
                  h('h2', { className: 'event-title' }, title),
                  // Special Event Badge
                  h('span', { className: 'badge badge-special' }, 'Special Event'),

                  h('div', { className: 'event-meta' },
                    h('span', { className: 'meta-item location' }, '📍 ' + location),
                    distance ? h('span', { className: 'meta-item distance' }, '📏 ' + distance) : null
                  ),

                  // Description
                  body ? h('div', { className: 'event-body' },
                    // Basic markdown rendering or just text. CMS raw value is markdown.
                    // Since we don't have a markdown processor easily here, we'll just dump text or use widget preview if possible.
                    // For now, simple text display is better than nothing.
                    body
                  ) : null,

                  // Meeting Note
                  meetingNote ? h('p', {
                    className: 'event-body',
                    style: { fontWeight: '700', marginTop: 'var(--space-2)' }
                  }, meetingNote) : null,

                  // Action Link
                  link ? h('a', {
                    href: link,
                    className: 'btn btn-small',
                    style: {
                      background: 'white',
                      color: 'var(--color-orange)',
                      width: 'fit-content',
                      marginTop: 'var(--space-4)'
                    }
                  }, linkText) : null
                )
              )
            )
            // No upcoming runs section
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate("events", EventsPreview);
