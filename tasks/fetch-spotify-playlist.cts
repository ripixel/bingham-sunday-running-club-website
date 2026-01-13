import * as fs from 'fs';
import * as path from 'path';
import type { TaskDef } from 'skier/dist/types';

interface SpotifyPlaylist {
  name: string;
  tracks: string[];
}

interface Settings {
  social?: {
    spotifyPlaylist?: string;
  };
  playlist?: {
    description: string;
    tracks: string[];
  };
  [key: string]: unknown;
}

function extractPlaylistId(urlOrId: string): string {
  const match = urlOrId.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : urlOrId;
}

async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyPlaylist> {
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
    .filter((track: { title?: string }) => track.title)
    .map((track: { title: string; subtitle?: string }) => {
      const artistNames = track.subtitle || 'Unknown Artist';
      return `${track.title} - ${artistNames}`;
    });

  return {
    name: entity.title,
    tracks,
  };
}

export const createFetchSpotifyPlaylistTask = (): TaskDef<{}, void> => ({
  name: 'fetch-spotify-playlist',
  config: {},
  run: async (_, { logger }) => {
    const settingsPath = path.resolve(process.cwd(), 'content/settings/general.json');

    const settings: Settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    const playlistUrl = settings.social?.spotifyPlaylist;
    if (!playlistUrl || playlistUrl.includes('YOUR_PLAYLIST_ID')) {
      logger.info('Skipping Spotify fetch - no playlist URL configured');
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    logger.info(`Fetching Spotify playlist: ${playlistId}`);

    try {
      const playlist = await fetchPlaylistTracks(playlistId);

      settings.playlist = {
        description: playlist.name || settings.playlist?.description || 'BSRC Running Playlist',
        tracks: playlist.tracks,
      };

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
      logger.info(`Updated playlist with ${playlist.tracks.length} tracks`);
    } catch (err) {
      // Don't fail the build - just log and continue
      logger.warn(`Spotify fetch error: ${(err as Error).message}`);
    }
  }
});
