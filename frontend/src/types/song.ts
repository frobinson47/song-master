export interface SongMetadata {
  title: string;
  description: string;
  filename: string;
  created_at: string;
  album_art_url: string | null;
  suno_styles: string[];
  exclude_styles?: string[];
  user_prompt: string;
  persona?: string;
  genre?: string;
  tempo?: string | number;
  key?: string;
  emotional_arc?: string;
  instruments?: string;
  target_audience?: string;
  commercial_assessment?: string;
}

export interface SongDetail {
  metadata: SongMetadata;
  lyrics: string;
  raw_markdown: string;
}
