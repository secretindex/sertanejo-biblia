
import React, { useState, useMemo } from 'react';
import { StorySegment } from '../types';

interface StoriesListViewProps {
  onBack: () => void;
  stories: StorySegment[];
  onSelectBook: (bookName: string) => void;
  onGoHome: () => void; // Nova prop
}

const StoriesListView: React.FC<StoriesListViewProps> = ({ onBack, stories, onSelectBook, onGoHome }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const booksWithStories = useMemo(() => {
    // Explicitly type as string[] to fix the 'unknown' inference error on line 17
    const bookNames = Array.from(new Set(stories.map(s => s.bookName))) as string[];
    return bookNames
      .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
  }, [stories, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative"> {/* Adiciona relative para posicionar o botão home */}
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Início</span>
        </button>
        <h1 className="text-4xl font-bold text-[var(--text-dark)] bible-font leading-tight mb-1">Histórias Selecionadas</h1>
        <h2 className="text-xl text-[var(--text-dark)] font-semibold mb-2">Histórias</h2>
        <p className="text-[var(--text-muted)] font-medium opacity-80 italic">Selecione um livro para ver as histórias selecionadas</p>
        
        {/* Botão Home */}
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

      <div className="mb-10 relative">
        <input
          type="text"
          placeholder="Buscar livro..."
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-light)] rounded-2xl px-5 py-3 pr-12 shadow-sm focus:ring-4 focus:ring-[var(--text-muted)]/50 outline-none transition-all font-medium text-[var(--text-dark)] placeholder-[var(--text-muted)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-4">
        {booksWithStories.length === 0 ? (
          <div className="text-center py-20 bg-[var(--tertiary-bg)]/50 rounded-[2.5rem] border-2 border-dashed border-[var(--border-light)]">
             <p className="text-[var(--text-muted)] italic font-bold">Nenhum livro encontrado</p>
          </div>
        ) : (
          booksWithStories.map(book => (
            <button 
              key={book}
              onClick={() => onSelectBook(book)}
              className="w-full flex items-center justify-between p-5 bg-[var(--tertiary-bg)] rounded-3xl shadow-sm border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-xl transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[var(--secondary-bg)] rounded-2xl flex items-center justify-center mr-4 shadow-inner group-hover:scale-110 transition-transform">
                  <span className="text-[var(--text-light)] font-black text-lg">{book.substring(0, 1).toUpperCase()}</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-dark)] bible-font">{book}</h2>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-muted)] group-hover:text-[var(--secondary-bg)] transition-all" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StoriesListView;
