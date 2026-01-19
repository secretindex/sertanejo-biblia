
import React, { useState, useMemo } from 'react';
import { Quiz, ImportedAudio } from '../types';

interface QuizListViewProps {
  onBack: () => void;
  quizzes: Quiz[];
  importedAudios: ImportedAudio[];
  onSelectQuiz: (quiz: Quiz, audioFile: File) => void;
  onGoHome: () => void; // Nova prop
}

const QuizListView: React.FC<QuizListViewProps> = ({ onBack, quizzes, importedAudios, onSelectQuiz, onGoHome }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.bookName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quizzes, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative"> {/* Adiciona relative para posicionar o botão home */}
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Início</span>
        </button>
        <h1 className="text-4xl font-bold text-[var(--text-dark)] bible-font leading-none mb-2">Testagens de Áudios</h1>
        <p className="text-[var(--text-muted)] font-medium opacity-80 italic">Ouça e responda sobre a Palavra</p>
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

      <div className="mb-8 relative">
        <input 
          type="text" 
          placeholder="Buscar teste ou livro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-light)] rounded-2xl px-6 py-4 pr-14 shadow-sm focus:ring-4 focus:ring-[var(--text-muted)]/50 outline-none transition-all text-[var(--text-dark)] placeholder-[var(--text-muted)]"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="text-center p-16 bg-[var(--tertiary-bg)] rounded-[2.5rem] border-4 border-dashed border-[var(--border-light)] shadow-inner">
          <p className="text-[var(--text-muted)] italic">Nenhuma testagem disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map(quiz => {
            const audio = importedAudios.find(a => a.fileName === quiz.audioFileName);
            if (!audio || !audio.file) return null;

            return (
              <button
                key={quiz.id}
                onClick={() => onSelectQuiz(quiz, audio.file!)}
                className="w-full bg-[var(--tertiary-bg)] p-6 rounded-3xl flex items-center justify-between border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-xl transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[var(--secondary-bg)] rounded-2xl flex items-center justify-center text-[var(--text-light)] group-hover:bg-[var(--secondary-bg)] group-hover:text-[var(--text-light)] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[var(--text-dark)] text-lg leading-tight">{quiz.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 uppercase tracking-wider font-bold">{quiz.bookName} {quiz.chapter > 0 ? `• Cap. ${quiz.chapter}` : ''}</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-muted)] group-hover:text-[var(--secondary-bg)] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizListView;