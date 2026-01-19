
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Quiz, AudioState, QuizSubmission, AgeGroup } from '../types';
import { saveSubmissionDB } from '../services/db';

interface QuizViewProps {
  quiz: Quiz;
  audioFile: File;
  onBack: () => void;
  onGoHome: () => void;
  onSubmission?: (submission: QuizSubmission) => void; // Callback para atualizar o estado global
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, audioFile, onBack, onGoHome, onSubmission }) => {
  const [audioState, setAudioState] = useState<AudioState>(AudioState.IDLE);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const submissionDate = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  useEffect(() => {
    if (audioRef.current) {
      const url = URL.createObjectURL(audioFile);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) { alert("Por favor, informe seu nome."); return; }
    if (!city.trim()) { alert("Por favor, informe sua cidade."); return; }
    if (!state.trim()) { alert("Por favor, informe seu estado."); return; }
    if (!ageGroup) { alert("Por favor, selecione sua faixa etária."); return; }
    
    setIsSubmitting(true);
    const submission: QuizSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      quizId: quiz.id,
      userName: userName,
      submissionDate: submissionDate, 
      city: city,
      state: state,
      ageGroup: ageGroup as AgeGroup, 
      answers: quiz.questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id] || ''
      })),
      timestamp: Date.now()
    };

    try {
      await saveSubmissionDB(submission);
      if (onSubmission) {
        onSubmission(submission); // Atualiza o App.tsx imediatamente
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar respostas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in max-w-lg mx-auto bg-[var(--primary-bg)] min-h-screen">
        <div className="w-24 h-24 bg-[var(--secondary-bg)] text-[var(--text-light)] rounded-3xl flex items-center justify-center mb-6 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[var(--text-dark)] mb-4 bible-font">Respostas Enviadas!</h2>
        <p className="text-[var(--text-muted)] font-medium text-lg mb-8 leading-relaxed">Obrigado por completar esta testagem. Sua participação ajuda a levar a Palavra mais longe.</p>
        <button 
          onClick={onGoHome} 
          className="w-full bg-[var(--secondary-bg)] text-[var(--text-light)] py-4 rounded-xl font-bold hover:bg-[#3A2923] transition-all shadow-md active:scale-95"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    // TEMA SERTANEJO (Cores Quentes, Bordas Arredondadas)
    <div className="flex-1 flex flex-col h-full bg-[var(--primary-bg)] animate-fade-in pb-20 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="p-6 sticky top-0 bg-[var(--primary-bg)]/95 backdrop-blur-md z-20 flex items-center justify-between border-b border-[var(--border-light)]">
        <button 
          onClick={onBack} 
          className="p-2 text-[var(--text-dark)] hover:bg-[var(--tertiary-bg)] rounded-full transition-all active:scale-90"
          title="Voltar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 px-4 text-center">
          <h2 className="text-xl font-bold text-[var(--text-dark)] bible-font leading-tight truncate">{quiz.title}</h2>
          <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5 uppercase tracking-widest">{quiz.bookName} {quiz.chapter > 0 ? `• Cap. ${quiz.chapter}` : ''}</p>
        </div>

        <button 
          onClick={onGoHome} 
          className="p-2 text-[var(--text-dark)] hover:bg-[var(--tertiary-bg)] rounded-full transition-all active:scale-90"
          title="Início"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3" />
          </svg>
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10 w-full">
        
        {/* PLAYER DE ÁUDIO */}
        <div className="bg-[var(--tertiary-bg)] rounded-[2rem] p-8 border border-[var(--border-light)] shadow-sm">
          <audio 
            ref={audioRef} 
            className="hidden" 
            onPlay={() => setAudioState(AudioState.PLAYING)}
            onPause={() => setAudioState(AudioState.PAUSED)}
            onEnded={() => setAudioState(AudioState.IDLE)}
            controls
          />
          <div className="flex flex-col items-center">
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase mb-6 tracking-[0.2em]">Áudio da Testagem</h3>
            <button 
              onClick={() => {
                if (audioRef.current?.paused) audioRef.current.play();
                else audioRef.current?.pause();
              }}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 mb-4 shadow-xl ${
                audioState === AudioState.PLAYING 
                  ? 'bg-[var(--tertiary-bg)] text-[var(--secondary-bg)] border-2 border-[var(--secondary-bg)]' 
                  : 'bg-[var(--secondary-bg)] text-[var(--text-light)]'
              }`}
            >
              {audioState === AudioState.PLAYING ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest mt-2">
                {audioState === AudioState.PLAYING ? 'Reproduzindo...' : 'Toque para Ouvir'}
            </p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[var(--tertiary-bg)] p-8 rounded-[2rem] border border-[var(--border-light)] shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2 bible-font flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               Seus Dados
            </h3>
            
            <div className="space-y-5">
               <div>
                 <label htmlFor="userName" className="block text-xs font-black text-[var(--text-muted)] uppercase mb-2 tracking-wide">Nome Completo</label>
                 <input 
                   id="userName"
                   type="text" 
                   required
                   placeholder="Digite seu nome"
                   value={userName}
                   onChange={(e) => setUserName(e.target.value)}
                   className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] font-medium placeholder-[var(--text-muted)] transition-all"
                 />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-black text-[var(--text-muted)] uppercase mb-2 tracking-wide">Cidade</label>
                    <input
                      id="city"
                      type="text"
                      required
                      placeholder="Sua cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] font-medium placeholder-[var(--text-muted)] transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-black text-[var(--text-muted)] uppercase mb-2 tracking-wide">Estado</label>
                    <input
                      id="state"
                      type="text"
                      required
                      placeholder="UF"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] font-medium placeholder-[var(--text-muted)] transition-all"
                    />
                  </div>
               </div>
               
               {/* FAIXA ETÁRIA */}
               <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase mb-3 tracking-wide">Faixa Etária</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['5-11', '12-17', '18-30', '31-59', '60+'].map((age) => (
                          <label 
                              key={age}
                              className={`
                                  flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all font-bold text-xs uppercase tracking-wide shadow-sm
                                  ${ageGroup === age 
                                    ? 'bg-[var(--secondary-bg)] text-white border-[var(--secondary-bg)]' 
                                    : 'bg-[var(--primary-bg)] text-[var(--text-muted)] border-[var(--border-light)] hover:border-[var(--secondary-bg)]'}
                              `}
                          >
                              <input 
                                  type="radio" 
                                  name="ageGroup" 
                                  value={age} 
                                  checked={ageGroup === age} 
                                  onChange={() => setAgeGroup(age as AgeGroup)} 
                                  className="hidden"
                              />
                              {age}
                          </label>
                      ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[var(--text-dark)] px-2 bible-font flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Perguntas
            </h3>
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="bg-[var(--tertiary-bg)] p-6 rounded-[2rem] border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow">
                <label htmlFor={`question-${q.id}`} className="block mb-4">
                  <span className="inline-block bg-[var(--primary-bg)] text-[var(--text-muted)] text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-[var(--border-light)]">Questão {idx + 1}</span>
                  <span className="text-base font-bold text-[var(--text-dark)] block leading-snug">{q.text}</span>
                </label>
                <textarea 
                  id={`question-${q.id}`}
                  rows={3}
                  required
                  placeholder="Sua resposta..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] text-sm placeholder-[var(--text-muted)] resize-none transition-all font-medium"
                />
              </div>
            ))}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--secondary-bg)] text-[var(--text-light)] text-lg py-5 rounded-2xl font-bold shadow-xl hover:bg-[#3A2923] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
                <>
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   <span>Enviando...</span>
                </>
            ) : (
                <span>Enviar Respostas</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizView;
