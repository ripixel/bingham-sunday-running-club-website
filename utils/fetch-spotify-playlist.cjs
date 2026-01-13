/**
 * Fetches tracks from a Spotify playlist and updates general.json
 *
 * For public playlists, no authentication is required.
 *
 * Usage: node utils/fetch-spotify-playlist.cjs
 */

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../content/settings/general.json');

function extractPlaylistId(urlOrId) {
  // Handle full URLs like https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  const match = urlOrId.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : urlOrId;
}

async function fetchPlaylistTracks(playlistId) {
  // Use Spotify's embed endpoint - works for public playlists without auth
  const response = await fetch(
    `https://open.spotify.com/embed/playlist/${playlistId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BSRC-Website/1.0)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }

  const html = await response.text();

  // Extract the JSON data from the embed page
  const dataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
  if (!dataMatch) {
    throw new Error('Could not parse playlist data from embed page');
  }

  const data = JSON.parse(dataMatch[1]);
  const entity = data.props?.pageProps?.state?.data?.entity;

  if (!entity) {
    throw new Error('Playlist data not found in embed response');
  }

  const tracks = entity.trackList
    .filter(track => track.title) // Filter out null entries
    .map(track => {
      const artistNames = track.subtitle || 'Unknown Artist';
      return `${track.title} - ${artistNames}`;
    });

  return {
    name: entity.title,
    tracks,
  };
}

async function main() {
  // Read current settings
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

  const playlistUrl = settings.social?.spotifyPlaylist;
  if (!playlistUrl || playlistUrl.includes('YOUR_PLAYLIST_ID')) {
    console.log('⏭️  Skipping Spotify fetch - no playlist URL configured');
    return;
  }

  const playlistId = extractPlaylistId(playlistUrl);
  console.log(`🎵 Fetching Spotify playlist: ${playlistId}`);

  const playlist = await fetchPlaylistTracks(playlistId);

  // Update settings with fresh track list
  settings.playlist = {
    description: playlist.name || settings.playlist?.description || 'BSRC Running Playlist',
    tracks: playlist.tracks,
  };

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
  console.log(`✅ Updated playlist with ${playlist.tracks.length} tracks`);
}

main().catch(err => {
  console.error('❌ Spotify fetch error:', err.message);
  // Don't fail the build - just skip playlist update
  process.exit(0);
});
