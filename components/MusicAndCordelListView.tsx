
import React, { useMemo } from 'react';
import { CordelSegment, ImportedAudio, FavoriteType } from '../types';

interface MusicAndCordelListViewProps {
  onBack: () => void;
  cordelSegments: CordelSegment[];
  importedAudios: ImportedAudio[];
  onSelectCordel: (segment: CordelSegment) => void;
  onGoHome: () => void;
  onToggleFavorite: (item: { originalId: string; type: FavoriteType; bookName: string; chapter: number; title: string; reference: string; timestamp: number }) => void;
  isFavorited: (type: FavoriteType, originalId: string) => boolean;
}

const MusicAndCordelListView: React.FC<MusicAndCordelListViewProps> = ({ onBack, cordelSegments, importedAudios, onSelectCordel, onGoHome, onToggleFavorite, isFavorited }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const groupedCordelSegments = useMemo(() => {
    const filtered = cordelSegments.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.segmentType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups: Record<string, CordelSegment[]> = {}; // Group by bookName
    filtered.forEach(s => {
      if (!groups[s.bookName]) groups[s.bookName] = [];
      groups[s.bookName].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [cordelSegments, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative">
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Início</span>
        </button>
        <h1 className="text-5xl font-bold text-[var(--text-dark)] bible-font leading-none mb-2">Músicas e Cordéis</h1>
        <p className="text-[var(--text-muted)] font-medium opacity-80 italic">A cultura sertaneja na Palavra de Deus</p>
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
          placeholder="Buscar músicas ou cordéis..."
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-light)] rounded-2xl px-5 py-3 pr-12 shadow-sm focus:ring-4 focus:ring-[var(--text-muted)]/50 outline-none transition-all font-medium text-[var(--text-dark)] placeholder-[var(--text-muted)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-10">
        {groupedCordelSegments.length === 0 ? (
          <div className="text-center py-20 bg-[var(--tertiary-bg)]/50 rounded-[2.5rem] border-2 border-dashed border-[var(--border-light)]">
             <p className="text-[var(--text-muted)] italic font-bold">Nenhuma música ou cordel encontrado ainda.</p>
             <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-2">Vá em Configurações para adicionar e cortar áudios.</p>
          </div>
        ) : (
          groupedCordelSegments.map(([bookName, segments]) => (
            <div key={bookName}>
              <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center">
                <span className="w-10 h-0.5 bg-[var(--border-light)] mr-3"></span>
                {bookName}
              </h2>
              <div className="space-y-3">
                {segments.map(segment => {
                  const isFav = isFavorited(segment.segmentType as FavoriteType, segment.id);
                  return (
                    <div key={segment.id} className="relative group">
                      <button
                        onClick={() => onSelectCordel(segment)}
                        className="w-full bg-[var(--tertiary-bg)] p-5 rounded-3xl flex items-center justify-between border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-xl transition-all pr-12 h-auto"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 group-hover:text-[var(--text-light)] transition-colors flex-shrink-0 ${
                            segment.segmentType === 'music' ? 'bg-[var(--secondary-bg)]' : 'bg-[var(--secondary-bg)]'
                          }`}>
                            {segment.segmentType === 'music' ? (
                                // Ícone de Violão para Música
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-light)] transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a2 2 0 012 2v6.5c2 0 4 2 4 4.5S15 19 12 19s-6-4-6-6.5c0-2.5 2-4.5 4-4.5V4a2 2 0 012-2z" />
                                    <circle cx="12" cy="14" r="2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4h3" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 5v14M17 5v14M7 12h10M9 9l6 6" />
                                </svg>
                            )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            {/* whitespace-normal e break-words adicionados para evitar corte de texto */}
                            <h4 className="font-bold text-[var(--text-dark)] leading-tight group-hover:text-[var(--secondary-bg)] whitespace-normal break-words">{segment.title}</h4>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{segment.reference}</span>
                          </div>
                        </div>
                      </button>
                      <button 
                        onClick={() => onToggleFavorite({
                          originalId: segment.id,
                          type: segment.segmentType as FavoriteType,
                          bookName: segment.bookName,
                          chapter: segment.chapter,
                          title: segment.title,
                          reference: segment.reference,
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
          ))
        )}
      </div>
    </div>
  );
};

export default MusicAndCordelListView;
