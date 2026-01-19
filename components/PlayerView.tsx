
import React, { useState, useRef, useEffect } from 'react';
import { ChapterContent, AudioState } from '../types';
import { generateStoryIllustration } from '../services/geminiService';
import { getImageDB, saveImageDB } from '../services/db';

interface PlayerViewProps {
  content: ChapterContent | null;
  isLoading: boolean;
  onBack: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onNext: () => void;
  onPrev: () => void;
  onGoHome: () => void; // Nova prop
}

const PlayerView: React.FC<PlayerViewProps> = ({ content, isLoading, onBack, audioRef, onNext, onPrev, onGoHome }) => {
  const [audioState, setAudioState] = useState<AudioState>(AudioState.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0); // Estado para velocidade
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loadIllustration = async () => {
      if (!content) return;
      
      const cacheKey = content.storyTitle 
        ? `story_${content.book}_${content.chapter}_${content.storyTitle}`
        : `chapter_${content.book}_${content.chapter}`;

      const cachedImg = await getImageDB(cacheKey);
      if (cachedImg) {
        setIllustrationUrl(cachedImg);
        return;
      }

      setIllustrationUrl(null);
      const desc = content.storyTitle || `${content.book} ${content.chapter}`;
      const ref = content.reference || `${content.book} ${content.chapter}`;
      
      const url = await generateStoryIllustration(desc, ref);
      if (url) {
        setIllustrationUrl(url);
        await saveImageDB(cacheKey, url);
      }
    };

    loadIllustration();
  }, [content?.storyTitle, content?.book, content?.chapter]);

  // Sincronizar velocidade do áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioRef]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play().catch(console.error);
    else audioRef.current.pause();
  };

  const cycleSpeed = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const syncTime = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
      // Garante que a velocidade visual esteja sincronizada caso mude externamente
      if (audio.playbackRate !== playbackRate) {
         // Opcional: forçar state se necessário, mas o useEffect cuida disso
      }
    }
    rafRef.current = requestAnimationFrame(syncTime);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(syncTime);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setAudioState(AudioState.PLAYING);
    const onPause = () => setAudioState(AudioState.PAUSED);
    const onEnd = () => setAudioState(AudioState.IDLE);
    
    // Aplicar velocidade inicial ao montar
    audio.playbackRate = playbackRate;

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (isLoading || !content) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--primary-bg)] animate-fade-in relative overflow-hidden">
      {/* HEADER - Compacto */}
      <header className="flex-shrink-0 px-4 py-4 flex items-center justify-between z-30">
        <button onClick={onBack} className="p-2 text-[var(--text-dark)] hover:bg-[var(--tertiary-bg)] rounded-full transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center flex-1 mx-2 overflow-hidden">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-dark)] bible-font leading-tight truncate">
            {content.storyTitle || `${content.book} ${content.chapter}`}
          </h2>
          <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] block mt-0.5 opacity-80 italic truncate">
            {content.reference || `${content.book} ${content.chapter}`}
          </span>
        </div>
        {/* Botão Home */}
        <button 
          onClick={onGoHome} 
          className="p-2 text-[var(--text-dark)] hover:bg-[var(--tertiary-bg)] rounded-full transition-all active:scale-90"
          aria-label="Voltar para a página inicial"
          title="Início"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3" />
          </svg>
        </button>
      </header>

      {/* ÁREA DA ARTE - Flexível e Aumentada - Centralizada */}
      <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden min-h-0 py-2">
        {/* Container da imagem com mx-auto e flexbox de centralização */}
        <div className="relative w-full h-full max-w-6xl mx-auto px-4 flex items-center justify-center max-h-[65vh]">
            {illustrationUrl ? (
              <img 
                src={illustrationUrl} 
                alt="Ilustração" 
                className={`w-full h-full object-contain object-center mix-blend-multiply opacity-80 transition-all duration-[60s] ease-linear select-none ${audioState === AudioState.PLAYING ? 'scale-105' : 'scale-100'}`}
              />
            ) : (
              <div className="opacity-[0.05] select-none pointer-events-none flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48 text-[var(--text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                 </svg>
              </div>
            )}
        </div>
      </div>

      {/* CONTROLES - Compacto e ancorado no fundo */}
      <div className="flex-shrink-0 w-full max-w-md mx-auto px-6 pb-8 pt-2 z-20 space-y-4">
          <div className="space-y-2">
            <input 
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[var(--border-light)] rounded-lg appearance-none cursor-pointer accent-[var(--secondary-bg)] hover:accent-[var(--secondary-bg)] transition-all"
            />
            <div className="flex justify-between text-[11px] font-black text-[var(--text-muted)] tracking-widest font-mono opacity-80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between relative">
              
              {/* Botão de Velocidade */}
              <button 
                onClick={cycleSpeed}
                className="absolute -left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--border-light)] transition-all p-2 rounded-lg font-bold text-xs w-12 text-center active:scale-90"
                title="Velocidade de Reprodução"
              >
                {playbackRate}x
              </button>

              <button onClick={() => skip(-15)} className="text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors p-3 active:scale-90 ml-8 sm:ml-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 3.2A1 1 0 0019 15.2V8.8a1 1 0 00-1.6-.8l-5.334 3.2zM2.066 11.2a1 1 0 000 1.6l5.334 3.2A1 1 0 009 15.2V8.8a1 1 0 00-1.6-.8l-5.334 3.2z" />
                </svg>
              </button>

              <button onClick={onPrev} className="text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors p-3 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63a1 1 0 001.555-.832V5.998a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              <button 
                onClick={togglePlayback}
                className="w-20 h-20 border-4 border-[var(--secondary-bg)] text-[var(--secondary-bg)] rounded-full flex items-center justify-center hover:bg-[var(--secondary-bg)] hover:text-[var(--text-light)] active:scale-95 transition-all shadow-xl group"
                style={{ aspectRatio: '1 / 1' }}
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

              <button onClick={onNext} className="text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors p-3 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
                </svg>
              </button>

              <button onClick={() => skip(15)} className="text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors p-3 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.934 12.8a1 1 0 000-1.6L6.6 8a1 1 0 00-1.6.8v6.4a1 1 0 001.6.8l5.334-3.2zM21.934 12.8a1 1 0 000-1.6L16.6 8a1 1 0 00-1.6.8v6.4a1 1 0 001.6.8l5.334-3.2z" />
                </svg>
              </button>
          </div>
      </div>
      
      <style>{`
        input[type='range'] {
          -webkit-appearance: none;
          background: var(--border-light);
          height: 6px;
          border-radius: 3px;
        }
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--secondary-bg);
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid var(--primary-bg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          margin-top: -7px;
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: var(--secondary-bg);
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid var(--primary-bg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default PlayerView;
