export interface ReleasedSong {
  id: string;
  title: string;
  youtubeUrl: string;
}

export interface DemoSong {
  id: string;
  slug: string;
  title: string;
  author: string;
  audioUrl: string;
  coverUrl?: string;
  globalCoverUrl?: string;
  backgroundUrl?: string;
  lyrics: string;
  template: '1' | '2' | '3' | '4'; // 1: Vui vẻ, 2: Sôi động, 3: Buồn, 4: Thư giãn
  status: 'public' | 'hidden';
  password?: boolean; // From public API
  passwordValue?: string; // From admin API
  requiresPassword?: boolean;
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
  globalPassword?: string;
  slideshowImages?: string[];
  releasedSongs: ReleasedSong[];
  demos: DemoSong[];
}
