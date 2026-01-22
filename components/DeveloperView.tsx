"use client"

import React, { useRef, useState, useMemo } from 'react';
import { ImportedAudio, Quiz, QuizQuestion, CordelSegment } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { saveAudioFile, saveQuizDB, saveCordelSegmentsDB, deleteQuizDB } from '../services/db';
import { generateQuizQuestions, extractMusicAndCordelFromAudio } from '../services/geminiService';
import { sliceAudio } from '../services/audioUtils';

interface DeveloperViewProps {
  onBack: () => void;
  importedAudios: ImportedAudio[];
  onUpdateAudios: (audios: ImportedAudio[]) => void;
  onDeleteAudio: (file_name: string) => void;
  onAnalyze: (audio: ImportedAudio) => void; // Para histórias
  onAnalyzeCordel: (audio: ImportedAudio) => void; // Para cordéis/músicas
  processingFiles: Set<string>;
  quizzes: Quiz[];
  onUpdateQuizzes: (quizzes: Quiz[]) => void;
  cordelSegments: CordelSegment[]; // Recebe os segmentos de cordel
  onUpdateCordelSegments: (cordelSegments: CordelSegment[]) => void; // Handler para atualizar
  onGoHome: () => void; // Nova prop
}

const DeveloperView: React.FC<DeveloperViewProps> = ({ onBack, importedAudios, onUpdateAudios, onDeleteAudio, onAnalyze, onAnalyzeCordel, processingFiles, quizzes, onUpdateQuizzes, cordelSegments, onUpdateCordelSegments, onGoHome }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quizFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Quiz creation
  const [quizbook_name, setQuizbook_name] = useState('');
  const [quizChapter, setQuizChapter] = useState(0);
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedQuizAudio, setSelectedQuizAudio] = useState<ImportedAudio | null>(null); // Change from File to ImportedAudio for selection
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isUploadingQuizAudio, setIsUploadingQuizAudio] = useState(false);

  // Filter Main Library Audios (exclude quiz category)
  const libraryAudios = useMemo(() => {
    return importedAudios.filter(a => !a.category || a.category === 'library');
  }, [importedAudios]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAudios: ImportedAudio[] = [...importedAudios];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (newAudios.some(a => a.file_name === file.name)) continue;

      const match = file.name.match(/([a-zA-Z\sÀ-ÿ\d]+?)\s?(\d+)/);
      let book_name = 'Desconhecido';
      let chapter = 0;

      if (match) {
        const bookRaw = match[1].trim();
        chapter = parseInt(match[2]);
        const matchedBook = BIBLE_BOOKS.find(b =>
          b.name.toLowerCase().replace(/\s/g, '').includes(bookRaw.toLowerCase().replace(/\s/g, ''))
        );
        if (matchedBook) book_name = matchedBook.name;
      }

      const audioObj: ImportedAudio = {
        book_name,
        chapter,
        file_name: file.name,
        file: file,
        stories_identified: false,
        cordel_identified: false,
        category: 'library'
      };

      console.log(`Importando áudio: ${file.name} como ${book_name} capítulo ${chapter}`);

      newAudios.push(audioObj);
      await saveAudioFile(audioObj);
    }

    onUpdateAudios(newAudios);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // New handler specifically for uploading Quiz Audios
  const handleQuizAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingQuizAudio(true);
    const newAudios: ImportedAudio[] = [...importedAudios];
    let lastUploadedAudio: ImportedAudio | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (newAudios.some(a => a.file_name === file.name)) continue;

      const audioObj: ImportedAudio = {
        book_name: 'Quiz', // Default or parse
        chapter: 0,
        file_name: file.name,
        file: file,
        stories_identified: false,
        cordel_identified: false,
        category: 'quiz' // Marked as quiz
      };

      newAudios.push(audioObj);
      await saveAudioFile(audioObj);
      lastUploadedAudio = audioObj;
    }

    onUpdateAudios(newAudios);

    // AUTO-SELECT THE UPLOADED AUDIO
    if (lastUploadedAudio) {
      setSelectedQuizAudio(lastUploadedAudio);
    }

    setIsUploadingQuizAudio(false);
    if (quizFileInputRef.current) quizFileInputRef.current.value = '';
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta testagem?")) {
      try {
        await deleteQuizDB(quizId);
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
        onUpdateQuizzes(updatedQuizzes);
      } catch (error) {
        console.error("Erro ao excluir testagem:", error);
        alert("Erro ao excluir testagem.");
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateQuestions = async () => {
    if (!selectedQuizAudio || !selectedQuizAudio.file || !quizbook_name || !quizChapter) {
      alert("Por favor, selecione um áudio da lista, e preencha o livro e capítulo.");
      return;
    }

    setIsGeneratingQuestions(true);
    setGeneratedQuizQuestions([]);
    try {
      const base64Audio = await blobToBase64(selectedQuizAudio.file);
      const aiQuestionsRaw = await generateQuizQuestions(base64Audio, quizbook_name, quizChapter);

      const aiQuestions: QuizQuestion[] = (aiQuestionsRaw || []).map((q, idx) => ({
        id: `ai-q-${Date.now()}-${idx}`,
        text: q.text
      }));

      const fixedQuestions: QuizQuestion[] = [
        { id: `fixed-q-1-${Date.now()}`, text: 'Teve alguma palavra, expressão ou parte do áudio que você não entendeu? Qual ou quais?' },
        { id: `fixed-q-2-${Date.now() + 1}`, text: 'Você faria alguma mudança nesse áudio? Algum termo, palavra ou expressão? Quais?' },
      ];

      setGeneratedQuizQuestions([...aiQuestions, ...fixedQuestions]);

    } catch (error: any) {
      console.error("Erro ao gerar perguntas da IA:", error);
      if (error.message.startsWith('Quota Excedida')) {
        alert(`${error.message}\nPara mais informações sobre limites de taxa, acesse: https://ai.google.dev/gemini-api/docs/rate-limits.`);
      } else {
        alert(`Falha ao gerar perguntas da IA. Detalhes: ${error.message}`);
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim() || !quizbook_name || !quizChapter || !selectedQuizAudio || generatedQuizQuestions.length === 0) {
      alert("Por favor, preencha todos os campos e gere as perguntas.");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: quizTitle.trim(),
        book_name: quizbook_name,
        chapter: quizChapter,
        audio_file_name: selectedQuizAudio.file_name,
        questions: generatedQuizQuestions,
      };

      // Note: Audio is already saved in the new flow

      await saveQuizDB(newQuiz);
      onUpdateQuizzes([...quizzes, newQuiz]);

      // Clear form
      setQuizTitle('');
      setQuizbook_name('');
      setQuizChapter(0);
      setSelectedQuizAudio(null);
      setGeneratedQuizQuestions([]);

      alert("Testagem salva com sucesso!");

    } catch (error) {
      console.error("Erro ao salvar testagem:", error);
      alert("Falha ao salvar testagem. Tente novamente.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };


  const filteredLibraryAudios = useMemo(() => {
    return libraryAudios
      .filter(a => a.file_name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.book_name.localeCompare(b.book_name) || a.chapter - b.chapter);
  }, [libraryAudios, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-5xl mx-auto w-full text-[13px] bg-[var(--primary-bg)] min-h-screen pb-24">
      {/* HEADER REORGANIZADO */}
      <div className="mb-8">
        {/* Botão de Voltar Separado e no Topo */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-[var(--text-dark)] font-bold px-4 py-2 bg-white rounded-full shadow-sm hover:bg-[var(--tertiary-bg)] hover:shadow-md transition-all active:scale-95 border border-[var(--border-light)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>

          {/* Botão Home */}
          <button
            onClick={onGoHome}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors active:scale-90"
            aria-label="Voltar para a página inicial"
            title="Início"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3" />
            </svg>
          </button>
        </div>

        {/* Título com Melhor Contraste */}
        <div className="flex items-center space-x-3 px-1">
          <div className="w-10 h-10 bg-[var(--secondary-bg)] rounded-xl flex items-center justify-center text-[var(--text-light)] shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-dark)] bible-font">Biblioteca de Áudios</h1>
        </div>
        <p className="text-[var(--text-muted)] mt-2 ml-14 font-medium">Gerencie, corte e organize seus arquivos de áudio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white text-[var(--text-dark)] p-6 rounded-[2rem] shadow-md hover:shadow-lg hover:border-[var(--secondary-bg)] transition-all flex flex-col items-center text-center space-y-3 group active:scale-95 disabled:opacity-50 border border-[var(--border-light)] overflow-hidden relative"
          >
            <div className="w-16 h-16 bg-[var(--primary-bg)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner relative z-10">
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-[var(--secondary-bg)] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Onda de Eletrocardiograma (ECG) ao fundo */}
                  <svg viewBox="0 0 100 100" className="absolute w-full h-full text-[var(--secondary-bg)] opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M0 50 L20 50 L30 30 L40 70 L50 20 L60 80 L70 50 L100 50" />
                  </svg>

                  {/* Ícone de Upload */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--secondary-bg)] relative z-20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-[var(--text-dark)] z-10 relative">{isUploading ? 'Importando...' : 'Adicionar Novo Áudio'}</span>
            <input type="file" multiple accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </button>

          <div className="mt-4 p-5 bg-white rounded-2xl border border-[var(--border-light)] shadow-sm">
            <p className="font-bold text-[var(--text-dark)] mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Dica Rápida
            </p>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Clique em <strong>"Cortar Histórias"</strong> ou <strong>"Cortar Músicas"</strong>. A IA identificará e separará tudo automaticamente para você.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-sm border border-[var(--border-light)] flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-light)] flex items-center bg-[var(--primary-bg)]/30">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Pesquisar na biblioteca..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[var(--border-light)] rounded-xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] placeholder-[var(--text-muted)] font-medium shadow-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredLibraryAudios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p>Nenhum áudio encontrado</p>
              </div>
            ) : (
              filteredLibraryAudios.map(audio => (
                <div key={audio.file_name} className="flex flex-col p-5 bg-white rounded-2xl group border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-md transition-all">
                  {/* TOPO: Informações do Arquivo */}
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-[var(--text-dark)] truncate text-base">{audio.file_name}</span>
                      <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-black mt-1 flex items-center">
                        <span className="bg-[var(--primary-bg)] px-2 py-0.5 rounded-md border border-[var(--border-light)] mr-2">{audio.book_name}</span>
                        Capítulo {audio.chapter}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteAudio(audio.file_name, audio.file, audio.id)}
                      className="text-red-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      title="Excluir áudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* FUNDO: Ações de Corte */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-auto pt-3 border-t border-dashed border-[var(--border-light)]">
                    {processingFiles.has(audio.file_name) ? (
                      <div className="w-full flex items-center justify-center space-x-2 text-[var(--secondary-bg)] font-black uppercase text-[10px] bg-[var(--primary-bg)] px-4 py-3 rounded-xl border border-[var(--border-light)]">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando Áudio...</span>
                      </div>
                    ) : (
                      <>
                        {/* BOTÃO: CORTAR HISTÓRIAS */}
                        {audio.stories_identified ? (
                          <button
                            disabled
                            className="flex-1 bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold text-[11px] border border-green-200 flex items-center justify-center cursor-default"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Histórias Salvas
                          </button>
                        ) : (
                          <button
                            onClick={() => onAnalyze(audio)}
                            className="flex-1 bg-[var(--secondary-bg)] text-white hover:bg-[#3A2923] px-4 py-3 rounded-xl font-bold text-[11px] border border-[var(--secondary-bg)]/20 transition-all flex items-center justify-center shadow-sm active:scale-95"
                            title="Identificar e cortar histórias"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132A1 1 0 000-1.664z" />
                            </svg>
                            Cortar Histórias
                          </button>
                        )}

                        {/* BOTÃO: CORTAR MÚSICAS/CORDEL */}
                        {audio.cordel_identified ? (
                          <button
                            disabled
                            className="flex-1 bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold text-[11px] border border-green-200 flex items-center justify-center cursor-default"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Músicas Salvas
                          </button>
                        ) : (
                          <button
                            onClick={() => onAnalyzeCordel(audio)}
                            className="flex-1 bg-white text-[var(--secondary-bg)] hover:bg-[var(--secondary-bg)] hover:text-white px-4 py-3 rounded-xl font-bold text-[11px] border border-[var(--secondary-bg)] transition-all flex items-center justify-center shadow-sm active:scale-95"
                            title="Identificar e cortar músicas/cordéis"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V6M12 4V3L9 6M12 4c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V3M12 4l3-3M9 6v13m0 0H7" />
                            </svg>
                            Cortar Músicas
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <section className="mt-8 bg-white rounded-[2rem] shadow-sm border border-[var(--border-light)] p-8">
        <h2 className="text-xl font-bold text-[var(--text-dark)] bible-font mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Gerenciar Testagens de Áudio
        </h2>

        {/* New Quiz Audio Upload Section */}
        <div className="bg-[var(--primary-bg)] p-6 rounded-2xl border border-[var(--border-light)] mb-8">
          <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">1. Importar Áudio para Testagem</h3>
          <button
            onClick={() => quizFileInputRef.current?.click()}
            disabled={isUploadingQuizAudio}
            className="w-full bg-white border-2 border-dashed border-[var(--secondary-bg)] text-[var(--secondary-bg)] p-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-[var(--tertiary-bg)] transition-all active:scale-98"
          >
            {isUploadingQuizAudio ? (
              <span className="w-5 h-5 border-2 border-[var(--secondary-bg)] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            )}
            <span>{isUploadingQuizAudio ? 'Importando...' : 'Carregar Novo Arquivo de Testagem'}</span>
          </button>
          <input type="file" multiple accept="audio/*" className="hidden" ref={quizFileInputRef} onChange={handleQuizAudioUpload} />
          <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">* O áudio será selecionado automaticamente após a importação.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Título da Testagem</label>
              <input
                type="text"
                placeholder="Ex: A Parábola do Filho Pródigo"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] placeholder-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Livro Bíblico</label>
              <select
                value={quizbook_name}
                onChange={(e) => setQuizbook_name(e.target.value)}
                className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)]"
              >
                <option value="">Selecione um livro</option>
                {BIBLE_BOOKS.map(book => (
                  <option key={book.id} value={book.name}>{book.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Capítulo</label>
              <input
                type="number"
                min="1"
                placeholder="Número do capítulo"
                value={quizChapter || ''}
                onChange={(e) => setQuizChapter(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--secondary-bg)]/20 text-[var(--text-dark)] placeholder-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Áudio Selecionado</label>
              <div className="w-full bg-[var(--primary-bg)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-[var(--text-dark)] flex items-center justify-between">
                <span className="truncate text-sm font-medium">{selectedQuizAudio ? selectedQuizAudio.file_name : 'Importe um áudio acima'}</span>
                {selectedQuizAudio && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--border-light)] w-full my-6"></div>

          <div>
            <button
              onClick={handleGenerateQuestions}
              disabled={!selectedQuizAudio || !quizbook_name || !quizChapter || isGeneratingQuestions}
              className="w-full bg-[var(--secondary-bg)] text-[var(--text-light)] p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-[#3A2923] transition-all active:scale-[0.99] disabled:opacity-50 shadow-lg"
            >
              {isGeneratingQuestions ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              )}
              <span>{isGeneratingQuestions ? 'Analisando Áudio e Gerando Perguntas...' : 'Gerar Perguntas com IA'}</span>
            </button>
          </div>

          {generatedQuizQuestions.length > 0 && (
            <div className="space-y-4 bg-[var(--primary-bg)] p-5 rounded-2xl border border-[var(--border-light)]">
              <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Perguntas Geradas:</h3>
              <ul className="list-decimal list-inside space-y-2 text-[var(--text-dark)] text-sm">
                {generatedQuizQuestions.map((q, index) => (
                  <li key={q.id} className="leading-relaxed p-2 hover:bg-white rounded-lg transition-colors">{q.text}</li>
                ))}
              </ul>
            </div>
          )}

          {generatedQuizQuestions.length > 0 && (
            <button
              onClick={handleSaveQuiz}
              disabled={isGeneratingQuestions}
              className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-4 0V4a1 1 0 011-1h2a1 1 0 011 1v3m-4 0h0M5 7h0m-4 0a1 1 0 00-1 1v9a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1h-3M4 7h16" /></svg>
              <span>Salvar Testagem na Biblioteca</span>
            </button>
          )}

          {/* LIST OF SAVED QUIZZES */}
          <div className="mt-12 pt-8 border-t border-[var(--border-light)]">
            <h3 className="text-lg font-bold text-[var(--text-dark)] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Testagens Salvas (Prontas para Uso)
            </h3>

            <div className="space-y-3">
              {quizzes.length === 0 ? (
                <p className="text-[var(--text-muted)] italic text-sm">Nenhuma testagem salva ainda.</p>
              ) : (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="bg-white p-4 rounded-xl border border-[var(--border-light)] flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div>
                      <h4 className="font-bold text-[var(--text-dark)]">{quiz.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        <span className="font-bold uppercase tracking-wider">{quiz.book_name} • Cap. {quiz.chapter}</span>
                        <span className="mx-2">•</span>
                        <span className="italic">Áudio: {quiz.audiofile_name}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Excluir Testagem Completa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default DeveloperView;
