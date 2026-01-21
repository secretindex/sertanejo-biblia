import { ImportedAudio, StorySegment, QuizSubmission, Quiz, CordelSegment, FavoriteItem, UserSettings } from '../types';

import supabase from '@/utils/supabase';

const DB_NAME = 'SertanejoBibleDB';
const STORE_AUDIOS = 'audios';
const STORE_STORIES = 'stories';
const STORE_QUIZZES = 'quizzes';
const STORE_SUBMISSIONS = 'submissions';
const STORE_IMAGES = 'chapter_images';
const STORE_CORDEL = 'cordel_segments';
const STORE_FAVORITES = 'favorites';
const STORE_SETTINGS = 'user_settings'; // Nova store
const DB_VERSION = 7; // Incrementado

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_AUDIOS)) {
        db.createObjectStore(STORE_AUDIOS, { keyPath: 'fileName' });
      }
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUIZZES)) {
        db.createObjectStore(STORE_QUIZZES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        db.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_CORDEL)) {
        db.createObjectStore(STORE_CORDEL, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
      // Nova store para configurações (key única 'config')
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveImageDB = async (key: string, dataUrl: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    store.put({ key, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getImageDB = async (key: string): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const store = tx.objectStore(STORE_IMAGES);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.dataUrl : null);
    request.onerror = () => reject(request.error);
  });
};

export const saveAudioFile = async (audio: ImportedAudio) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIOS, 'readwrite');
    const store = tx.objectStore(STORE_AUDIOS);
    const request = store.put(audio);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllAudiosDB = async (): Promise<ImportedAudio[]> => {
  let { data: imported_audios, error } = await supabase
    .from('imported_audios')
    .select('*');

  console.log("Imported audios fetched from Supabase:", imported_audios, error);

  // make imported audios typed as ImportedAudio[]

  if (error) {
    console.error("Error fetching imported audios from Supabase:", error);
  }

  return imported_audios as ImportedAudio[];

  // const db = await initDB();
  // return new Promise((resolve, reject) => {
  //   const tx = db.transaction(STORE_AUDIOS, 'readonly');
  //   const store = tx.objectStore(STORE_AUDIOS);
  //   const request = store.getAll();
  //   request.onsuccess = () => resolve(request.result);
  //   request.onerror = () => reject(request.error);
  // });
};

export const saveStoriesDB = async (stories: StorySegment[]) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readwrite');
    const store = tx.objectStore(STORE_STORIES);
    store.clear();
    stories.forEach(story => store.put(story));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllStoriesDB = async (): Promise<StorySegment[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readonly');
    const store = tx.objectStore(STORE_STORIES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveQuizDB = async (quiz: Quiz) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUIZZES, 'readwrite');
    const store = tx.objectStore(STORE_QUIZZES);
    const request = store.put(quiz);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllQuizzesDB = async (): Promise<Quiz[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUIZZES, 'readonly');
    const store = tx.objectStore(STORE_QUIZZES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteQuizDB = async (id: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_QUIZZES, 'readwrite');
  return new Promise<void>((resolve, reject) => {
    const request = tx.objectStore(STORE_QUIZZES).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteAudioDB = async (fileName: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_AUDIOS, 'readwrite');
  return new Promise<void>((resolve, reject) => {
    const request = tx.objectStore(STORE_AUDIOS).delete(fileName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveSubmissionDB = async (submission: QuizSubmission) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    const request = store.put(submission);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(tx.error);
  });
};

export const getAllSubmissionsDB = async (): Promise<QuizSubmission[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveCordelSegmentsDB = async (cordelSegments: CordelSegment[]) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_CORDEL, 'readwrite');
    const store = tx.objectStore(STORE_CORDEL);
    store.clear();
    cordelSegments.forEach(segment => store.put(segment));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllCordelSegmentsDB = async (): Promise<CordelSegment[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CORDEL, 'readonly');
    const store = tx.objectStore(STORE_CORDEL);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Funções para Favoritos
export const saveFavoriteDB = async (favorite: FavoriteItem) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const request = store.put(favorite);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteFavoriteDB = async (id: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllFavoritesDB = async (): Promise<FavoriteItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FAVORITES, 'readonly');
    const store = tx.objectStore(STORE_FAVORITES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Funções para Configurações do Usuário
export const saveSettingsDB = async (settings: UserSettings) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.put({ ...settings, id: 'config' });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSettingsDB = async (): Promise<UserSettings | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get('config');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
