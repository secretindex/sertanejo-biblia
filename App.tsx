
import React, { useState, useCallback, useEffect, useRef } from 'react';

import HomeView from './components/HomeView';
import BookListView from './components/BookListView';
import ChapterListView from './components/ChapterListView';
import StoriesListView from './components/StoriesListView';
import StorySelectionView from './components/StorySelectionView';
import PlayerView from './components/PlayerView';
import DeveloperView from './components/DeveloperView';
import QuizListView from './components/QuizListView';
import QuizView from './components/QuizView';
import QuizResultsView from './components/QuizResultsView';
import MusicAndCordelListView from './components/MusicAndCordelListView';
import FavoritesListView from './components/FavoritesListView';

import { ChapterContent, AudioState, ImportedAudio, StorySegment, Quiz, BibleBook, QuizSubmission, CordelSegment, FavoriteItem, FavoriteType, AppThemeId, UserSettings, AppTheme } from './types';
import { getAllAudiosDB, getAllStoriesDB, getAllQuizzesDB, getAllSubmissionsDB, saveAudioFile, saveStoriesDB, deleteAudioDB, getAllCordelSegmentsDB, saveCordelSegmentsDB, getAllFavoritesDB, saveFavoriteDB, deleteFavoriteDB, getSettingsDB, saveSettingsDB } from './services/db';
import { extractStoriesFromAudio, extractMusicAndCordelFromAudio } from './services/geminiService';
import { sliceAudio } from './services/audioUtils';
import { BIBLE_BOOKS } from './constants';
import supabase from './utils/supabase';

type ViewState = 'home' | 'books' | 'bookChapters' | 'stories' | 'bookStories' | 'quizzes' | 'quizActive' | 'reader' | 'dev' | 'quizResults' | 'musicAndCordel' | 'favorites';

// Definição das Cores dos Temas
const THEMES: Record<AppThemeId, AppTheme> = {
  original: {
    id: 'original',
    name: 'Sertão Original',
    colors: {
      primaryBg: '#F8F5F1',
      secondaryBg: '#4A352F',
      tertiaryBg: '#FFFFFF',
      textDark: '#3A2923',
      textLight: '#FFFFFF',
      textMuted: '#7A6F68',
      borderLight: '#E8E2DD'
    }
  },
  terra: {
    id: 'terra',
    name: 'Terra Roxa',
    colors: {
      primaryBg: '#FDF6F3',
      secondaryBg: '#8B4513',
      tertiaryBg: '#FFF8F0',
      textDark: '#4A2511',
      textLight: '#FFE4CA',
      textMuted: '#A0522D',
      borderLight: '#E6CDBF'
    }
  },
  luar: {
    id: 'luar',
    name: 'Luar do Sertão',
    colors: {
      primaryBg: '#F0F4F8',
      secondaryBg: '#2C3E50',
      tertiaryBg: '#FFFFFF',
      textDark: '#1A252F',
      textLight: '#E0E6ED',
      textMuted: '#607D8B',
      borderLight: '#CFD8DC'
    }
  },
  mandacaru: {
    id: 'mandacaru',
    name: 'Verde Mandacaru',
    colors: {
      primaryBg: '#F1F8F4',
      secondaryBg: '#2E5936',
      tertiaryBg: '#FFFFFF',
      textDark: '#1B3A22',
      textLight: '#E8F5E9',
      textMuted: '#588C64',
      borderLight: '#C8E6C9'
    }
  },
  sol: {
    id: 'sol',
    name: 'Sol do Agreste',
    colors: {
      primaryBg: '#FFFBE6',
      secondaryBg: '#E67E22',
      tertiaryBg: '#FFFFFF',
      textDark: '#5D4037',
      textLight: '#FFF3E0',
      textMuted: '#A1887F',
      borderLight: '#F5CBA7'
    }
  },
  ceu: {
    id: 'ceu',
    name: 'Céu do Sertão',
    colors: {
      primaryBg: '#F0F8FF',
      secondaryBg: '#1F618D',
      tertiaryBg: '#FFFFFF',
      textDark: '#154360',
      textLight: '#D4E6F1',
      textMuted: '#5499C7',
      borderLight: '#A9CCE3'
    }
  },
  asa_branca: {
    id: 'asa_branca',
    name: 'Asa Branca',
    colors: {
      primaryBg: '#FAFAFA',
      secondaryBg: '#424949',
      tertiaryBg: '#FFFFFF',
      textDark: '#17202A',
      textLight: '#F2F3F4',
      textMuted: '#909497',
      borderLight: '#D7DBDD'
    }
  },
  romaria: {
    id: 'romaria',
    name: 'Romaria',
    colors: {
      primaryBg: '#F5EEF8',
      secondaryBg: '#6C3483',
      tertiaryBg: '#FFFFFF',
      textDark: '#4A235A',
      textLight: '#E8DAEF',
      textMuted: '#AF7AC5',
      borderLight: '#D2B4DE'
    }
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterContent | null>(null);
  const [importedAudios, setImportedAudios] = useState<ImportedAudio[]>([]);
  const [stories, setStories] = useState<StorySegment[]>([]);
  const [cordelSegments, setCordelSegments] = useState<CordelSegment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; file: File } | null>(null);
  const [globalAudioState, setGlobalAudioState] = useState<AudioState>(AudioState.IDLE);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({ themeId: 'original' });

  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Apply Theme Helper
  const applyTheme = (themeId: AppThemeId) => {
    const theme = THEMES[themeId];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary-bg', theme.colors.primaryBg);
    root.style.setProperty('--secondary-bg', theme.colors.secondaryBg);
    root.style.setProperty('--tertiary-bg', theme.colors.tertiaryBg);
    root.style.setProperty('--text-dark', theme.colors.textDark);
    root.style.setProperty('--text-light', theme.colors.textLight);
    root.style.setProperty('--text-muted', theme.colors.textMuted);
    root.style.setProperty('--border-light', theme.colors.borderLight);
  };

  const loadData = useCallback(async () => {
    try {
      const [savedAudios, savedStories, savedQuizzes, savedSubmissions, savedCordelSegments, savedFavorites, savedSettings] = await Promise.all([
        getAllAudiosDB(),
        getAllStoriesDB(),
        getAllQuizzesDB(),
        getAllSubmissionsDB(),
        getAllCordelSegmentsDB(),
        getAllFavoritesDB(),
        getSettingsDB()
      ]);
      setImportedAudios(savedAudios);
      setStories(savedStories);
      setQuizzes(savedQuizzes);
      setQuizSubmissions(savedSubmissions);
      setCordelSegments(savedCordelSegments);
      setFavorites(savedFavorites);

      if (savedSettings) {
        setUserSettings(savedSettings);
        applyTheme(savedSettings.themeId);
      } else {
        applyTheme('original');
      }

    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current);
      if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
    };
  }, [loadData]);

  // Handler para atualizar configurações
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    applyTheme(newSettings.themeId);
    await saveSettingsDB(newSettings);
  };

  const handleSelectChapter = useCallback((
    bookName: string,
    chapter: number,
    file?: File | Blob,
    startTime?: number,
    endTime?: number,
    fileName?: string,
    storyTitle?: string,
    reference?: string
  ) => {
    if (!file) return;

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    const isSameAudio = currentChapter?.fileName === fileName && currentChapter?.storyTitle === storyTitle;

    const content: ChapterContent = {
      book: bookName,
      chapter: chapter,
      verses: [],
      audio_file: file,
      start_time: startTime,
      end_time: endTime,
      file_name: fileName,
      story_title: storyTitle,
      reference: reference
    };

    setCurrentChapter(content);
    setView('reader');

    if (!isSameAudio && audioRef.current) {
      if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
      const url = URL.createObjectURL(file);
      activeBlobUrlRef.current = url;
      audioRef.current.src = url;
      audioRef.current.load();

      const onCanPlay = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = startTime || 0;
          audioRef.current.play().catch(console.error);
        }
      };
      audioRef.current.addEventListener('canplay', onCanPlay, { once: true });
    } else if (isSameAudio && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentChapter]);

  const navigateAudio = useCallback((direction: 'next' | 'prev') => {
    if (!currentChapter || !selectedBook) return;

    const isStory = !!currentChapter.storyTitle && stories.some(s => s.fileName === currentChapter.fileName && s.title === currentChapter.storyTitle);
    const isCordelOrMusic = !!currentChapter.storyTitle && cordelSegments.some(s => s.fileName === currentChapter.fileName && s.title === currentChapter.storyTitle);

    if (isStory) {
      const bookStories = stories
        .filter(s => s.bookName === selectedBook.name)
        .sort((a, b) => a.chapter - b.chapter || a.startTime - b.startTime);

      const currentIndex = bookStories.findIndex(s => s.fileName === currentChapter.fileName && s.title === currentChapter.storyTitle);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < bookStories.length) {
        const nextStory = bookStories[nextIndex];
        const sourceAudio = nextStory.audioBlob || importedAudios.find(a => a.fileName === nextStory.fileName)?.file;
        handleSelectChapter(nextStory.bookName, nextStory.chapter, sourceAudio, nextStory.audioBlob ? 0 : nextStory.startTime, nextStory.audioBlob ? undefined : nextStory.endTime, nextStory.fileName, nextStory.title, nextStory.reference);
      }
    } else if (isCordelOrMusic) {
      const bookCordels = cordelSegments
        .filter(s => s.bookName === selectedBook.name)
        .sort((a, b) => a.chapter - b.chapter || a.startTime - b.startTime);

      const currentIndex = bookCordels.findIndex(s => s.fileName === currentChapter.fileName && s.title === currentChapter.storyTitle);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < bookCordels.length) {
        const nextCordel = bookCordels[nextIndex];
        const sourceAudio = nextCordel.audioBlob || importedAudios.find(a => a.fileName === nextCordel.fileName)?.file;
        handleSelectChapter(nextCordel.bookName, nextCordel.chapter, sourceAudio, nextCordel.audioBlob ? 0 : nextCordel.startTime, nextCordel.audioBlob ? undefined : nextCordel.endTime, nextCordel.fileName, nextCordel.title, nextCordel.reference);
      }
    }
    else { // Regular chapter navigation
      const bookChapters = importedAudios
        .filter(a => a.bookName === selectedBook.name)
        .sort((a, b) => a.chapter - b.chapter);

      const currentIndex = bookChapters.findIndex(a => a.fileName === currentChapter.fileName);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < bookChapters.length) {
        const nextChapter = bookChapters[nextIndex];
        handleSelectChapter(selectedBook.name, nextChapter.chapter, nextChapter.file, undefined, undefined, nextChapter.fileName);
      }
    }
  }, [currentChapter, selectedBook, stories, cordelSegments, importedAudios, handleSelectChapter]);

  const skipAudio = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    }
  }, []);

  const handleQuizSubmission = (submission: QuizSubmission) => {
    setQuizSubmissions(prev => [...prev, submission]);
  };

  const processAudioAnalysis = async (audio: ImportedAudio) => {
    if (!audio.file || processingFiles.has(audio.file_name)) return;
    setProcessingFiles(prev => {
      const next = new Set(prev);
      next.add(audio.file_name);
      return next;
    });

    try {
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      };

      const base64 = await blobToBase64(audio.file);
      const extracted = await extractStoriesFromAudio(base64, audio.book_name, audio.chapter);

      for (const s of extracted) {
        try {
          const cutBlob = await sliceAudio(audio.file, s.start_time, s.end_time);
          const newStory: StorySegment = {
            id: Math.random().toString(36).substr(2, 9),
            book_name: audio.book_name,
            chapter: audio.chapter,
            title: s.title,
            reference: s.reference,
            start_time: s.start_time,
            end_time: s.end_time,
            file_name: audio.file_name,
            audio_blob: cutBlob
          };

          setStories(prev => {
            const updated = [...prev, newStory];
            saveStoriesDB(updated);
            return updated;
          });
        } catch (e) {
          console.error("Erro no corte de história individual", e);
        }
      }

      setImportedAudios(prev => {
        const updated = prev.map(a => a.file_name === audio.file_name ? { ...a, stories_identified: true } : a);
        updated.forEach(a => saveAudioFile(a));
        return updated;
      });

    } catch (err) {
      console.error(`Erro ao processar ${audio.file_name}`, err);
    } finally {
      setProcessingFiles(prev => {
        const next = new Set(prev);
        next.delete(audio.file_name);
        return next;
      });
    }
  };

  const processCordelAnalysis = async (audio: ImportedAudio) => {
    if (!audio.file || processingFiles.has(audio.file_name)) return;
    setProcessingFiles(prev => {
      const next = new Set(prev);
      next.add(audio.file_name);
      return next;
    });

    try {
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      };

      const base64 = await blobToBase64(audio.file);
      const extracted = await extractMusicAndCordelFromAudio(base64, audio.book_name, audio.chapter);

      for (const s of extracted) {
        try {
          const cutBlob = await sliceAudio(audio.file, s.start_time, s.end_time);
          const newCordel: CordelSegment = {
            id: Math.random().toString(36).substr(2, 9),
            book_name: audio.book_name,
            chapter: audio.chapter,
            title: s.title,
            reference: s.reference,
            segment_type: s.segment_type,
            start_time: s.start_time,
            end_time: s.end_time,
            file_name: audio.file_name,
            audio_blob: cutBlob
          };

          setCordelSegments(prev => {
            const updated = [...prev, newCordel];
            saveCordelSegmentsDB(updated);
            return updated;
          });
        } catch (e) {
          console.error("Erro no corte de cordel/música individual", e);
        }
      }

      setImportedAudios(prev => {
        const updated = prev.map(a => a.fileName === audio.file_name ? { ...a, cordelIdentified: true } : a);
        updated.forEach(a => saveAudioFile(a));
        return updated;
      });

    } catch (err) {
      console.error(`Erro ao processar ${audio.file_name} para cordéis/músicas`, err);
    } finally {
      setProcessingFiles(prev => {
        const next = new Set(prev);
        next.delete(audio.file_name);
        return next;
      });
    }
  };

  const toggleFavorite = async (item: Omit<FavoriteItem, 'id'>) => {
    const existing = favorites.find(f => f.originalId === item.originalId && f.type === item.type);
    if (existing) {
      await deleteFavoriteDB(existing.id);
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
    } else {
      const newItem: FavoriteItem = { ...item, id: `fav-${Date.now()}` };
      await saveFavoriteDB(newItem);
      setFavorites(prev => [...prev, newItem]);
    }
  };

  const isFavorited = (type: FavoriteType, originalId: string) => {
    return favorites.some(f => f.type === type && f.originalId === originalId);
  };

  const handleSelectFavorite = (fav: FavoriteItem) => {
    const bookObj = BIBLE_BOOKS.find(b => b.name === fav.bookName);
    if (bookObj) {
      setSelectedBook(bookObj);
    }

    if (fav.type === 'chapter') {
      const audio = importedAudios.find(a => a.fileName === fav.originalId);
      if (audio && audio.file) {
        handleSelectChapter(fav.bookName, fav.chapter, audio.file, undefined, undefined, audio.fileName);
      } else {
        alert("Áudio original não encontrado.");
      }
    } else if (fav.type === 'story') {
      const story = stories.find(s => s.id === fav.originalId);
      if (story) {
        const sourceAudio = story.audioBlob || importedAudios.find(a => a.fileName === story.fileName)?.file;
        handleSelectChapter(story.bookName, story.chapter, sourceAudio, story.audioBlob ? 0 : story.startTime, story.audioBlob ? undefined : story.endTime, story.fileName, story.title, story.reference);
      } else {
        alert("História original não encontrada.");
      }
    } else if (fav.type === 'music' || fav.type === 'cordel') {
      const segment = cordelSegments.find(s => s.id === fav.originalId);
      if (segment) {
        const sourceAudio = segment.audioBlob || importedAudios.find(a => a.fileName === segment.fileName)?.file;
        handleSelectChapter(segment.bookName, segment.chapter, sourceAudio, segment.audioBlob ? 0 : segment.startTime, segment.audioBlob ? undefined : segment.endTime, segment.fileName, segment.title, segment.reference);
      } else {
        alert("Segmento original não encontrado.");
      }
    }
  };

  const goBack = () => {
    if (view === 'reader') {
      const isFromStories = !!(currentChapter?.storyTitle || currentChapter?.reference) && stories.some(s => s.fileName === currentChapter?.fileName && s.title === currentChapter?.storyTitle);
      const isFromCordel = !!(currentChapter?.storyTitle || currentChapter?.reference) && cordelSegments.some(s => s.fileName === currentChapter?.fileName && s.title === currentChapter?.storyTitle);

      if (isFromStories) setView('bookStories');
      else if (isFromCordel) setView('musicAndCordel');
      else setView('bookChapters');
    } else if (view === 'bookChapters') {
      setSelectedBook(null);
      setView('books');
    } else if (view === 'bookStories') {
      setSelectedBook(null);
      setView('stories');
    } else if (view === 'quizActive') {
      setActiveQuiz(null);
      setView('quizzes');
    } else if (view === 'quizResults') {
      setView('home');
    } else if (view === 'musicAndCordel') {
      setView('home');
    } else if (view === 'favorites') {
      setView('home');
    }
    else if (['books', 'stories', 'quizzes', 'dev'].includes(view)) {
      setView('home');
    }
  };

  const goHome = () => {
    setView('home');
    setSelectedBook(null);
    setActiveQuiz(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-x-hidden bg-[var(--primary-bg)] transition-colors duration-500">
      <audio
        ref={audioRef}
        onPlay={() => setGlobalAudioState(AudioState.PLAYING)}
        onPause={() => setGlobalAudioState(AudioState.PAUSED)}
        onEnded={() => {
          setGlobalAudioState(AudioState.IDLE);
          if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = window.setTimeout(() => {
            navigateAudio('next');
          }, 2500);
        }}
      />

      {view === 'home' && (
        <HomeView
          onStart={() => setView('books')}
          onStories={() => setView('stories')}
          onQuizzes={() => setView('quizzes')}
          onMusicAndCordel={() => setView('musicAndCordel')}
          onDevAccess={() => setView('dev')}
          onViewQuizResults={() => setView('quizResults')}
          onViewFavorites={() => setView('favorites')}
          userSettings={userSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {view === 'books' && (
        <BookListView
          onBack={goBack}
          onSelectBook={(book) => { setSelectedBook(book); setView('bookChapters'); }}
          importedAudios={importedAudios}
          onGoHome={goHome}
        />
      )}

      {/* ... [Restante dos componentes mantidos iguais] ... */}

      {view === 'bookChapters' && selectedBook && (
        <ChapterListView
          book={selectedBook}
          onBack={goBack}
          importedAudios={importedAudios}
          onSelectChapter={(bookName, chap, file, fName) => handleSelectChapter(bookName, chap, file, undefined, undefined, fName)}
          onGoHome={goHome}
          onToggleFavorite={toggleFavorite}
          isFavorited={isFavorited}
        />
      )}

      {view === 'stories' && (
        <StoriesListView
          onBack={goBack}
          stories={stories}
          onSelectBook={(bookName) => {
            const book = BIBLE_BOOKS.find(b => b.name === bookName);
            if (book) { setSelectedBook(book); setView('bookStories'); }
          }}
          onGoHome={goHome}
        />
      )}

      {view === 'bookStories' && selectedBook && (
        <StorySelectionView
          book={selectedBook}
          onBack={goBack}
          stories={stories}
          importedAudios={importedAudios}
          onSelectStory={(story) => {
            const sourceAudio = story.audioBlob || importedAudios.find(a => a.fileName === story.fileName)?.file;
            handleSelectChapter(story.bookName, story.chapter, sourceAudio, story.audioBlob ? 0 : story.startTime, story.audioBlob ? undefined : story.endTime, story.fileName, story.title, story.reference);
          }}
          onGoHome={goHome}
          onToggleFavorite={toggleFavorite}
          isFavorited={isFavorited}
        />
      )}

      {view === 'quizzes' && (
        <QuizListView
          onBack={goBack}
          quizzes={quizzes}
          importedAudios={importedAudios}
          onSelectQuiz={(quiz, file) => { setActiveQuiz({ quiz, file }); setView('quizActive'); }}
          onGoHome={goHome}
        />
      )}

      {view === 'quizActive' && activeQuiz && (
        <QuizView
          quiz={activeQuiz.quiz}
          audioFile={activeQuiz.file}
          onBack={goBack}
          onGoHome={goHome}
          onSubmission={handleQuizSubmission}
        />
      )}

      {view === 'quizResults' && (
        <QuizResultsView
          onBack={goBack}
          quizzes={quizzes}
          submissions={quizSubmissions}
          onGoHome={goHome}
        />
      )}

      {view === 'musicAndCordel' && (
        <MusicAndCordelListView
          onBack={goBack}
          cordelSegments={cordelSegments}
          importedAudios={importedAudios}
          onSelectCordel={(cordel) => {
            const book = BIBLE_BOOKS.find(b => b.name === cordel.bookName);
            if (book) setSelectedBook(book);

            const sourceAudio = cordel.audioBlob || importedAudios.find(a => a.fileName === cordel.fileName)?.file;
            handleSelectChapter(cordel.bookName, cordel.chapter, sourceAudio, cordel.audioBlob ? 0 : cordel.startTime, cordel.audioBlob ? undefined : cordel.endTime, cordel.fileName, cordel.title, cordel.reference);
          }}
          onGoHome={goHome}
          onToggleFavorite={toggleFavorite}
          isFavorited={isFavorited}
        />
      )}

      {view === 'favorites' && (
        <FavoritesListView
          onBack={goBack}
          favorites={favorites}
          importedAudios={importedAudios}
          stories={stories}
          cordelSegments={cordelSegments}
          onSelectFavorite={handleSelectFavorite}
          onToggleFavorite={toggleFavorite}
          isFavorited={isFavorited}
          onGoHome={goHome}
        />
      )}

      {view === 'reader' && (
        <PlayerView
          content={currentChapter}
          isLoading={false}
          onBack={goBack}
          audioRef={audioRef}
          onNext={() => navigateAudio('next')}
          onPrev={() => navigateAudio('prev')}
          onGoHome={goHome}
        />
      )}

      {view === 'dev' && (
        <DeveloperView
          onBack={goBack}
          importedAudios={importedAudios}
          onUpdateAudios={(audios) => setImportedAudios(audios)}
          onDeleteAudio={async (f: string, f_ext: string, id: string) => {
            console.log(`Deletando áudio: ${f}`);

            const { data, error } = await supabase.storage.from('Audios').remove([`public/${f}.${f_ext.split('.').pop()}`]);
            const { data: data2, error: error2 } = await supabase.from("imported_audios").delete().eq("id", id);

            if (error2) console.error("Erro ao deletar do Supabase DB:", error2);
            else console.log("Entrada deletada do Supabase DB:", data2);

            if (error) console.error("Erro ao deletar do Supabase:", error);
            else console.log("Áudio deletado do Supabase:", data);

            setImportedAudios(prev => prev.filter(a => a.file_name !== f));
            await deleteAudioDB(f);
            setStories(prev => {
              const filtered = prev.filter(s => s.file_name !== f);
              saveStoriesDB(filtered);
              return filtered;
            });
            setCordelSegments(prev => {
              const filtered = prev.filter(s => s.file_name !== f);
              saveCordelSegmentsDB(filtered);
              return filtered;
            });
          }}
          onAnalyze={processAudioAnalysis}
          onAnalyzeCordel={processCordelAnalysis}
          processingFiles={processingFiles}
          quizzes={quizzes}
          onUpdateQuizzes={(updatedQuizzes) => setQuizzes(updatedQuizzes)}
          cordelSegments={cordelSegments}
          onUpdateCordelSegments={(updatedCordel) => setCordelSegments(updatedCordel)}
          onGoHome={goHome}
        />
      )}

      {/* Mini Players (Global) mantidos iguais */}
      {view === 'home' && currentChapter && globalAudioState !== AudioState.IDLE && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (audioRef.current) {
              if (audioRef.current.paused) audioRef.current.play().catch(console.error);
              else audioRef.current.pause();
            }
          }}
          onDoubleClick={() => setView('reader')}
          className="fixed top-6 left-6 z-[60] w-20 h-20 rounded-full bg-[var(--secondary-bg)] border border-[var(--tertiary-bg)] shadow-2xl flex items-center justify-center cursor-pointer hover:scale-[1.05] active:scale-95 transition-all text-[var(--text-light)] group"
        >
          {globalAudioState === AudioState.PLAYING ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-ping"></span>
              </div>
            </>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}

      {view !== 'home' && view !== 'reader' && view !== 'quizActive' && currentChapter && globalAudioState !== AudioState.IDLE && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 w-full border-t p-4 shadow-2xl flex items-center justify-between transition-colors duration-300 ${globalAudioState === AudioState.PLAYING ? 'bg-[var(--secondary-bg)] border-[var(--secondary-bg)]' : 'bg-[var(--tertiary-bg)] border-[var(--border-light)]'}`}>
          {/* ... [Código do player de barra inferior mantido] ... */}
          <div
            className="flex items-center flex-1 cursor-pointer min-w-0"
            onClick={() => setView('reader')}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${globalAudioState === AudioState.PLAYING ? 'bg-[var(--tertiary-bg)]' : 'bg-[var(--secondary-bg)]'}`}>
              {globalAudioState === AudioState.PLAYING ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--secondary-bg)]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.5 10a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-4.66a.75.75 0 001.5 0V6.66a.75.75 0 00-1.5 0v6.68z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-light)] translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex flex-col text-left min-w-0 pr-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none opacity-80 ${globalAudioState === AudioState.PLAYING ? 'text-[var(--text-light)]' : 'text-[var(--text-muted)]'}`}>
                {globalAudioState === AudioState.PLAYING ? 'Ouvindo Agora' : 'Pausado'}
              </span>
              <span className={`text-base font-bold truncate leading-tight ${globalAudioState === AudioState.PLAYING ? 'text-[var(--text-light)]' : 'text-[var(--text-dark)]'}`}>
                {currentChapter.storyTitle || `${currentChapter.book} ${currentChapter.chapter}`}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => skipAudio(-15)} className={`p-2 rounded-full transition-colors active:scale-90 ${globalAudioState === AudioState.PLAYING ? 'text-[var(--text-light)] hover:bg-white/10' : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'}`} aria-label="Voltar 15 segundos">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 3.2A1 1 0 0019 15.2V8.8a1 1 0 00-1.6-.8l-5.334 3.2zM2.066 11.2a1 1 0 000 1.6l5.334 3.2A1 1 0 009 15.2V8.8a1 1 0 00-1.6-.8l-5.334 3.2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  if (audioRef.current.paused) audioRef.current.play().catch(console.error);
                  else audioRef.current.pause();
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${globalAudioState === AudioState.PLAYING ? 'bg-[var(--tertiary-bg)] text-[var(--secondary-bg)]' : 'bg-[var(--secondary-bg)] text-[var(--text-light)]'}`}
            >
              {globalAudioState === AudioState.PLAYING ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button onClick={() => skipAudio(15)} className={`p-2 rounded-full transition-colors active:scale-90 ${globalAudioState === AudioState.PLAYING ? 'text-[var(--text-light)] hover:bg-white/10' : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'}`} aria-label="Avançar 15 segundos">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.934 12.8a1 1 0 000-1.6L6.6 8a1 1 0 00-1.6.8v6.4a1 1 0 001.6.8l5.334-3.2zM21.934 12.8a1 1 0 000-1.6L16.6 8a1 1 0 00-1.6.8v6.4a1 1 0 001.6.8l5.334-3.2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
