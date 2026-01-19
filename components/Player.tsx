
import React, { useState, useEffect, useRef } from 'react';
import { ChapterContent, AudioState } from '../types';
import { generateBibleAudio, decodeBase64, decodeAudioData } from '../services/geminiService';

interface PlayerProps {
  content: ChapterContent | null;
  isLoading: boolean;
}

const Player: React.FC<PlayerProps> = ({ content, isLoading }) => {
  const [audioState, setAudioState] = useState<AudioState>(AudioState.IDLE);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setAudioState(AudioState.IDLE);
  };

  const playFullChapter = async () => {
    if (!content) return;
    if (audioState === AudioState.PLAYING) {
      stopAudio();
      return;
    }

    setAudioState(AudioState.LOADING);
    const fullText = content.verses.map(v => v.text).join(' ');
    
    try {
      const base64 = await generateBibleAudio(fullText);
      if (!base64) throw new Error("Audio generation failed");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const audioBytes = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioBytes, ctx);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setAudioState(AudioState.IDLE);
      source.start();
      
      audioSourceRef.current = source;
      setAudioState(AudioState.PLAYING);
    } catch (err) {
      console.error(err);
      setAudioState(AudioState.IDLE);
      alert("Houve um problema ao gerar o áudio. Tente novamente.");
    }
  };

  const playSingleVerse = async (vNum: number, text: string) => {
    stopAudio();
    setActiveVerse(vNum);
    setAudioState(AudioState.LOADING);

    try {
      const base64 = await generateBibleAudio(text);
      if (!base64) throw new Error("Audio generation failed");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const audioBytes = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioBytes, ctx);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setAudioState(AudioState.IDLE);
        setActiveVerse(null);
      };
      source.start();
      
      audioSourceRef.current = source;
      setAudioState(AudioState.PLAYING);
    } catch (err) {
      console.error(err);
      setAudioState(AudioState.IDLE);
      setActiveVerse(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-stone-500 font-medium italic">Preparando as escrituras...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-amber-50 p-8 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-amber-900 bible-font mb-2">Bem-vindo à Bíblia de Voz</h2>
        <p className="text-stone-500 max-w-md">Escolha um livro e capítulo ao lado para iniciar sua jornada de fé através do som da Palavra.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/30 overflow-hidden">
      {/* Header Player */}
      <div className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-amber-900 bible-font uppercase tracking-wide">
            {content.book} {content.chapter}
          </h2>
          <span className="text-xs text-stone-400 font-medium">Versão NVI</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={playFullChapter}
            disabled={audioState === AudioState.LOADING}
            className={`flex items-center px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg ${
              audioState === AudioState.PLAYING 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            {audioState === AudioState.LOADING ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            ) : audioState === AudioState.PLAYING ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1-1H7a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1V7zM14 7a1 1 0 00-1-1h-1a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1V7z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{audioState === AudioState.PLAYING ? 'Parar' : 'Ouvir Capítulo'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {content.verses.map((v) => (
            <div 
              key={v.number} 
              className={`group relative p-4 rounded-xl transition-all cursor-pointer ${
                activeVerse === v.number ? 'bg-amber-100/50 shadow-sm border border-amber-200' : 'hover:bg-white'
              }`}
              onClick={() => playSingleVerse(v.number, v.text)}
            >
              <div className="absolute -left-12 top-6 flex items-center justify-center w-8 h-8 rounded-full text-stone-300 font-bold bible-font text-lg transition-colors group-hover:text-amber-400">
                {v.number}
              </div>
              <p className={`text-xl leading-relaxed transition-colors ${
                activeVerse === v.number ? 'text-amber-900 font-medium' : 'text-stone-700'
              }`}>
                {v.text}
              </p>
              <div className={`absolute right-4 top-4 transition-opacity ${
                activeVerse === v.number ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {activeVerse === v.number && audioState === AudioState.PLAYING ? (
                  <div className="flex space-x-1">
                    <div className="w-1 bg-amber-600 h-3 animate-bounce"></div>
                    <div className="w-1 bg-amber-600 h-4 animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 bg-amber-600 h-2 animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Player;
