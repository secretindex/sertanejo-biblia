
export interface BibleBook {
  id: string;
  name: string;
  testament: 'Velho' | 'Novo';
  chapters: number;
  created_at?: string;
}

export interface StorySegment {
  id: string;
  book_name: string;
  chapter: number;
  title: string;
  reference: string;
  start_time: number;
  end_time: number;
  file_name?: string;
  audio_blob?: Blob; // The actual sliced audio data
}

export interface CordelSegment {
  id: string;
  book_name: string;
  chapter: number;
  title: string;
  segment_type: 'music' | 'cordel'; // 'music' or 'cordel'
  reference: string;
  start_time: number;
  end_time: number;
  file_name?: string;
  audio_blob?: Blob; // The actual sliced audio data
}

export interface ChapterContent {
  book: string;
  chapter: number;
  verses: { number: number; text: string }[];
  audio_file?: File | Blob;
  start_time?: number;
  end_time?: number;
  file_name?: string;
  story_title?: string;
  reference?: string;
}

export interface ImportedAudio {
  id?: string;
  book_name: string;
  chapter: number;
  chapter_id?: string;
  created_at?: string;
  file_name: string;
  file?: File;
  stories_identified?: boolean;
  cordel_identified?: boolean;
  category?: 'library' | 'quiz'; // Novo campo para separar áudios da biblioteca e de quiz
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  is_audio?: boolean;
}

export enum AudioState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED'
}
// Added Quiz related interfaces to fix import errors
export interface QuizQuestion {
  id: string;
  text: string;
}

export interface Quiz {
  id: string;
  title: string;
  book_name: string;
  chapter: number;
  audio_file_name: string;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  question_id: string;
  answer_text: string;
}

export type AgeGroup = '5-11' | '12-17' | '18-30' | '31-59' | '60+';

export interface QuizSubmission {
  id: string;
  quizId: string;
  userName: string;
  submissionDate: string;
  city: string;
  state: string;
  ageGroup: AgeGroup;
  answers: QuizAnswer[];
  timestamp: number;
}

export type FavoriteType = 'chapter' | 'story' | 'music' | 'cordel';

export interface FavoriteItem {
  id: string;
  originalId: string; // ID original do item (ou fileName para capitulos)
  type: FavoriteType;
  bookName: string;
  chapter: number;
  title?: string;
  reference?: string;
  timestamp: number;
}

// Configurações e Temas
export type AppThemeId = 'original' | 'terra' | 'luar' | 'mandacaru' | 'sol' | 'ceu' | 'asa_branca' | 'romaria';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  colors: {
    primaryBg: string;
    secondaryBg: string;
    tertiaryBg: string;
    textDark: string;
    textLight: string;
    textMuted: string;
    borderLight: string;
  }
}

export interface UserSettings {
  id?: string;
  themeId: AppThemeId;
  avatarImage?: string; // Base64 image
  tintAvatar?: boolean; // Se true, aplica a cor do tema na foto
}
