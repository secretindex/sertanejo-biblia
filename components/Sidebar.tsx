
import React, { useState } from 'react';
import { BIBLE_BOOKS } from '../constants';
import { BibleBook } from '../types';

interface SidebarProps {
  onSelect: (book: string, chapter: number) => void;
  currentBook?: string;
  currentChapter?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, currentBook, currentChapter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);

  const filteredBooks = BIBLE_BOOKS.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 h-full flex flex-col border-r border-stone-200 bg-white/50 backdrop-blur-md">
      <div className="p-6 border-b border-stone-100">
        <h1 className="text-2xl font-bold text-amber-900 mb-4 bible-font">Escrituras</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar livro..."
            className="w-full px-4 pr-10 py-2 bg-stone-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
        {selectedBook ? (
          <div>
            <button 
              onClick={() => setSelectedBook(null)}
              className="flex items-center text-amber-600 hover:text-amber-700 mb-4 transition-colors text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para livros
            </button>
            <h2 className="text-lg font-bold text-stone-800 px-2 mb-4">{selectedBook.name}</h2>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onSelect(selectedBook.name, ch)}
                  className={`py-2 text-center rounded-lg transition-all ${
                    currentBook === selectedBook.name && currentChapter === ch
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-stone-50 hover:bg-amber-100 text-stone-600'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        ) : (
          filteredBooks.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                currentBook === book.name ? 'bg-amber-50 text-amber-900' : 'hover:bg-stone-50 text-stone-600'
              }`}
            >
              <span className="font-medium">{book.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                {book.testament}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;