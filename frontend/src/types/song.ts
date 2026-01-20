export interface SongMetadata {
  title: string;
  description: string;
  filename: string;
  created_at: string;
  album_art_url: string | null;
  suno_styles: string[];
  user_prompt: string;
}

export interface SongDetail {
  metadata: SongMetadata;
  lyrics: string;
  raw_markdown: string;
}
