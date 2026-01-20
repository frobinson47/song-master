import { create } from 'zustand';
import { SongMetadata } from '../types/song';

interface SongsState {
  songs: SongMetadata[];
  loading: boolean;
  setSongs: (songs: SongMetadata[]) => void;
  setLoading: (loading: boolean) => void;
  addSong: (song: SongMetadata) => void;
  removeSong: (filename: string) => void;
}

export const useSongsStore = create<SongsState>((set) => ({
  songs: [],
  loading: false,
  setSongs: (songs) => set({ songs }),
  setLoading: (loading) => set({ loading }),
  addSong: (song) => set((state) => ({ songs: [song, ...state.songs] })),
  removeSong: (filename) =>
    set((state) => ({
      songs: state.songs.filter((s) => s.filename !== filename),
    })),
}));
