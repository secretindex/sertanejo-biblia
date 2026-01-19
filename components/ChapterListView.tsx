
import React, { useMemo } from 'react';
import { BibleBook, ImportedAudio, FavoriteType } from '../types';

interface ChapterListViewProps {
  book: BibleBook;
  onBack: () => void;
  importedAudios: ImportedAudio[];
  onSelectChapter: (bookName: string, chapter: number, file?: File, fileName?: string) => void;
  onGoHome: () => void;
  onToggleFavorite: (item: { originalId: string; type: FavoriteType; bookName: string; chapter: number; title: string; reference: string; timestamp: number }) => void;
  isFavorited: (type: FavoriteType, originalId: string) => boolean;
}

const ChapterListView: React.FC<ChapterListViewProps> = ({ book, onBack, importedAudios, onSelectChapter, onGoHome, onToggleFavorite, isFavorited }) => {
  // Filtra apenas os capítulos que possuem áudio importado para o livro selecionado
  const availableChapters = useMemo(() => {
    return importedAudios
      .filter(a => a.bookName === book.name)
      .sort((a, b) => a.chapter - b.chapter);
  }, [book.name, importedAudios]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative">
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Escolher Livro</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[var(--secondary-bg)] rounded-3xl flex items-center justify-center shadow-lg border-4 border-[var(--primary-bg)]">
             <span className="text-[var(--text-light)] text-2xl font-black">{book.name.substring(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-dark)] bible-font leading-none">{book.name}</h1>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">
              Capítulos Carregados: {availableChapters.length}
            </p>
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

      {availableChapters.length === 0 ? (
        <div className="text-center py-20 bg-[var(--tertiary-bg)]/50 rounded-[3rem] border-4 border-dashed border-[var(--border-light)]">
           <p className="text-[var(--text-muted)] font-bold italic">Nenhum áudio importado para {book.name}.</p>
           <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-2">Vá em Configurações para adicionar áudios.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableChapters.map((audio) => {
            const isFav = isFavorited('chapter', audio.fileName);
            return (
              <div key={audio.fileName} className="relative group">
                <button 
                  onClick={() => onSelectChapter(book.name, audio.chapter, audio.file, audio.fileName)}
                  className="w-full bg-[var(--tertiary-bg)] p-5 rounded-3xl flex items-center justify-between border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-xl transition-all pr-12"
                >
                  <div className="flex items-center">
                    {/* Ícone Estilo YouTube Personalizado - AGORA QUADRADO */}
                    <div className="w-10 h-10 bg-[var(--text-dark)] rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                       <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                          <path d="M8 5v14l11-7z" />
                       </svg>
                    </div>

                    <div className="text-left">
                      <span className="font-bold text-[var(--text-dark)] text-lg flex items-center gap-2">
                        Capítulo {audio.chapter}
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Áudio Integral</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => onToggleFavorite({
                    originalId: audio.fileName,
                    type: 'chapter',
                    bookName: book.name,
                    chapter: audio.chapter,
                    title: `Capítulo ${audio.chapter}`,
                    reference: `${book.name} ${audio.chapter}`,
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
      )}
    </div>
  );
};

export default ChapterListView;
