
// Add global type definition for window.google to support Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}

export enum Mode {
  UNKNOWN = 'unknown',
  GUEST = 'guest',
  USER = 'user'
}

export interface User {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export interface Profile {
  nickname?: string;
  photoUrl?: string;
}

export interface MBState {
  mode: Mode;
  user: User | null;
  profile: Profile | null;
  idToken: string;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  kind: string;
  mood: number;
  content: string;
  tags: string[];
  ts: string;
  photos: string[];
  likeCount: number;
  liked: boolean;
  commentCount: number;
}

export interface WorkRecord {
  entryId: string;
  title: string;
  genre: string;
  watchDate: string;
  episodes?: string;
  rating: number;
  note: string;
  status: 'watching' | 'not' | 'done';
  type: 'movie' | 'series';
}
