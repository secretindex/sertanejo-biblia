
import React, { useState, useMemo } from 'react';
import { BIBLE_BOOKS } from '../constants';
import { BibleBook, ImportedAudio } from '../types';

interface BookListViewProps {
  onBack: () => void;
  onSelectBook: (book: BibleBook) => void;
  importedAudios: ImportedAudio[];
  onGoHome: () => void; // Nova prop
}

const BookListView: React.FC<BookListViewProps> = ({ onBack, onSelectBook, importedAudios, onGoHome }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const importedBookNames = Array.from(new Set(importedAudios.map(a => a.bookName)));
  
  const booksWithAudio = useMemo(() => {
    return BIBLE_BOOKS.filter(b => 
      importedBookNames.includes(b.name) && 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [importedBookNames, searchTerm]);
  
  const novoTestamento = booksWithAudio.filter(b => b.testament === 'Novo');
  const velhoTestamento = booksWithAudio.filter(b => b.testament === 'Velho');

  const BookItem: React.FC<{ book: BibleBook }> = ({ book }) => {
    const bookAudiosCount = importedAudios.filter(a => a.bookName === book.name).length;

    return (
      <button
        onClick={() => onSelectBook(book)}
        className="w-full bg-[var(--tertiary-bg)] p-5 rounded-3xl flex items-center shadow-lg border border-[var(--border-light)] hover:border-[var(--text-muted)] hover:ring-2 hover:ring-[var(--border-light)] transition-all active:scale-[0.98] group mb-4"
      >
        <div className="w-14 h-14 bg-[var(--secondary-bg)] rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[var(--text-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-[var(--text-dark)] text-xl bible-font leading-none">{book.name}</h3>
          <p className="text-[var(--text-muted)] text-[10px] mt-1 font-black uppercase tracking-widest">{bookAudiosCount} capítulos disponíveis</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-muted)] group-hover:text-[var(--text-dark)] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative"> {/* Adiciona relative para posicionar o botão home */}
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Início</span>
        </button>
        <h1 className="text-5xl font-bold text-[var(--text-dark)] bible-font leading-none mb-2">Escrituras</h1>
        <p className="text-[var(--text-muted)] font-medium opacity-80">Escolha um livro para ouvir a Palavra</p>
        
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
          placeholder="Buscar livro sagrado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-light)] rounded-2xl px-6 py-4 pr-14 shadow-xl focus:ring-4 focus:ring-[var(--text-muted)]/50 outline-none transition-all text-[var(--text-dark)] font-medium placeholder-[var(--text-muted)]"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-12">
        {novoTestamento.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-[var(--text-dark)] uppercase tracking-[0.3em] mb-6 flex items-center">
              <span className="w-10 h-1 bg-[var(--border-light)] mr-3"></span>
              Novo Testamento
            </h2>
            {novoTestamento.map(book => <BookItem key={book.id} book={book} />)}
          </section>
        )}

        {velhoTestamento.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-[var(--text-dark)] uppercase tracking-[0.3em] mb-6 flex items-center">
              <span className="w-10 h-1 bg-[var(--border-light)] mr-3"></span>
              Velho Testamento
            </h2>
            {velhoTestamento.map(book => <BookItem key={book.id} book={book} />)}
          </section>
        )}
      </div>
    </div>
  );
};

export default BookListView;