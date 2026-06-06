export interface ReleasedSong {
  id: string;
  title: string;
  youtubeUrl: string;
}

export interface Playlist {
  id: string;
  title: string;
  songIds?: string[];
}

export interface DemoSong {
  id: string;
  slug: string;
  title: string;
  author: string;
  composer?: string;
  singer?: string;
  audioUrl: string;
  coverUrl?: string;
  globalCoverUrl?: string;
  backgroundUrl?: string;
  lyrics: string;
  template: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15';
  status: 'public' | 'hidden';
  password?: boolean; // From public API
  passwordValue?: string; // From admin API
  requiresPassword?: boolean;
  isReleased?: boolean;
  playlistIds?: string[];
  createdAt: number;
}

export interface AppData {
  pageTitle?: string;
  artistName: string;
  artistBio: string;
  homeCoverUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  youtubePlaylistUrl?: string;
  spotifyUrl?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  socialTiktok?: string;
  globalPassword?: string;
  globalBaseUrl?: string;
  slideshowImages?: string[];
  releasedSongs: ReleasedSong[];
  demos: DemoSong[];
  playlists?: Playlist[];
}
