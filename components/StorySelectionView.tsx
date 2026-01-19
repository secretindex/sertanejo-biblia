
import React, { useMemo } from 'react';
import { StorySegment, ImportedAudio, BibleBook, FavoriteType } from '../types';

interface StorySelectionViewProps {
  book: BibleBook;
  onBack: () => void;
  stories: StorySegment[];
  importedAudios: ImportedAudio[];
  onSelectStory: (story: StorySegment) => void;
  onGoHome: () => void;
  onToggleFavorite: (item: { originalId: string; type: FavoriteType; bookName: string; chapter: number; title: string; reference: string; timestamp: number }) => void;
  isFavorited: (type: FavoriteType, originalId: string) => boolean;
}

const StorySelectionView: React.FC<StorySelectionViewProps> = ({ book, onBack, stories, importedAudios, onSelectStory, onGoHome, onToggleFavorite, isFavorited }) => {
  const groupedStories = useMemo(() => {
    const filtered = stories.filter(s => s.bookName === book.name);
    const groups: Record<number, StorySegment[]> = {};
    filtered.forEach(s => {
      if (!groups[s.chapter]) groups[s.chapter] = [];
      groups[s.chapter].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [stories, book]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative">
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Livros</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[var(--secondary-bg)] rounded-3xl flex items-center justify-center shadow-lg">
             <span className="text-[var(--text-light)] text-2xl font-black">{book.name.substring(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-dark)] bible-font leading-none">{book.name}</h1>
            <p className="text-[10px] text-[var(--text-muted)] font-medium opacity-80 uppercase tracking-widest mt-1">Histórias Disponíveis</p>
          </div>
        </div>
        <button 
          onClick={onGoHome} 
          className="absolute top-0 right-0 p-2 text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors active:scale-90"
          aria-label="Voltar para a página inicial"
          title="Início"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3" />
          </svg>
        </button>
      </header>

      <div className="space-y-10">
        {groupedStories.map(([chapter, chapterStories]) => (
          <div key={chapter}>
            <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center">
              <span className="w-10 h-0.5 bg-[var(--border-light)] mr-3"></span>
              Capítulo {chapter}
            </h2>
            <div className="space-y-3">
              {chapterStories.map(story => {
                const isFav = isFavorited('story', story.id);
                return (
                  <div key={story.id} className="relative group">
                    <button
                      onClick={() => onSelectStory(story)}
                      className="w-full bg-[var(--tertiary-bg)] p-5 rounded-3xl flex items-center justify-between border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-xl transition-all pr-12"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {/* Ícone Estilo YouTube Personalizado - QUADRADO */}
                        <div className="w-10 h-10 bg-[var(--text-dark)] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                           <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                              <path d="M8 5v14l11-7z" />
                           </svg>
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--text-dark)] leading-tight truncate group-hover:text-[var(--secondary-bg)]">{story.title}</h4>
                          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{story.reference}</span>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => onToggleFavorite({
                        originalId: story.id,
                        type: 'story',
                        bookName: story.bookName,
                        chapter: story.chapter,
                        title: story.title,
                        reference: story.reference,
                        timestamp: Date.now()
                      })}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors active:scale-90 ${
                        isFav ? 'text-amber-500 hover:bg-amber-100' : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
                      }`}
                      aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorySelectionView;
