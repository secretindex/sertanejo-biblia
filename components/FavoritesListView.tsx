import React, { useMemo, useState } from 'react';
import { FavoriteItem, ImportedAudio, StorySegment, CordelSegment, FavoriteType } from '../types';
import { BIBLE_BOOKS } from '../constants';

interface FavoritesListViewProps {
  onBack: () => void;
  favorites: FavoriteItem[];
  importedAudios: ImportedAudio[];
  stories: StorySegment[];
  cordelSegments: CordelSegment[];
  onSelectFavorite: (favorite: FavoriteItem) => void;
  onToggleFavorite: (item: Omit<FavoriteItem, 'id'>) => Promise<void>;
  isFavorited: (type: FavoriteType, originalId: string) => boolean;
  onGoHome: () => void;
}

const FavoritesListView: React.FC<FavoritesListViewProps> = ({ onBack, favorites, importedAudios, stories, cordelSegments, onSelectFavorite, onToggleFavorite, isFavorited, onGoHome }) => {
  
  // Estado para controlar quais grupos de livros estão expandidos
  // Chave: string no formato "tipo-livro" (ex: "stories-Gênesis")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Lógica de agrupamento e ordenação
  const sections = useMemo(() => {
    const chapters: FavoriteItem[] = [];
    const storiesList: FavoriteItem[] = [];
    const musicAndCordels: FavoriteItem[] = [];

    favorites.forEach(fav => {
      if (fav.type === 'chapter') {
        chapters.push(fav);
      } else if (fav.type === 'story') {
        storiesList.push(fav);
      } else if (fav.type === 'music' || fav.type === 'cordel') {
        musicAndCordels.push(fav);
      }
    });

    // Função auxiliar para agrupar uma lista de favoritos por Livro
    const groupItemsByBook = (items: FavoriteItem[]) => {
      const grouped: Record<string, FavoriteItem[]> = {};
      items.forEach(item => {
        if (!grouped[item.bookName]) {
          grouped[item.bookName] = [];
        }
        grouped[item.bookName].push(item);
      });
      return grouped;
    };

    // Função para ordenar os itens dentro de um livro (por capítulo, depois título)
    const sortItemsInBook = (a: FavoriteItem, b: FavoriteItem) => {
      if (a.chapter !== b.chapter) {
        return a.chapter - b.chapter;
      }
      return (a.title || '').localeCompare(b.title || '');
    };

    // Função para ordenar os livros na ordem bíblica
    const sortBookKeys = (bookNameA: string, bookNameB: string) => {
      const indexA = BIBLE_BOOKS.findIndex(b => b.name === bookNameA);
      const indexB = BIBLE_BOOKS.findIndex(b => b.name === bookNameB);
      // Se não achar (index -1), joga pro final
      const validIndexA = indexA === -1 ? 999 : indexA;
      const validIndexB = indexB === -1 ? 999 : indexB;
      return validIndexA - validIndexB;
    };

    // Prepara os dados para as seções
    const processSection = (items: FavoriteItem[], id: string, title: string, icon: React.ReactNode) => {
      const grouped = groupItemsByBook(items);
      // Ordena os itens dentro de cada grupo
      Object.keys(grouped).forEach(key => {
        grouped[key].sort(sortItemsInBook);
      });
      
      // Retorna array de grupos ordenados por livro
      const sortedGroups = Object.keys(grouped)
        .sort(sortBookKeys)
        .map(bookName => ({
          bookName,
          items: grouped[bookName]
        }));

      return {
        id,
        title,
        icon,
        groups: sortedGroups,
        totalCount: items.length
      };
    };

    return [
      processSection(
        chapters,
        'chapters',
        'Livros e Capítulos',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      processSection(
        storiesList,
        'stories',
        'Histórias',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      processSection(
        musicAndCordels,
        'songs',
        'Músicas e Poemas',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V6M12 4V3L9 6M12 4c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V3M12 4l3-3M9 6v13m0 0H7" />
        </svg>
      )
    ];
  }, [favorites]);

  const FavoriteItemCard: React.FC<{ favorite: FavoriteItem }> = ({ favorite }) => {
    let titleDisplay = favorite.title || `Capítulo ${favorite.chapter}`;
    let subtitleDisplay = favorite.reference || `${favorite.bookName} ${favorite.chapter}`;
    let icon;
    let bgColorClass = 'bg-[var(--secondary-bg)]'; // Default color

    switch (favorite.type) {
      case 'chapter':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
        subtitleDisplay = `Áudio Integral`;
        break;
      case 'story':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
        bgColorClass = 'bg-[#8B5E3C]'; // Lighter brown for stories
        break;
      case 'music':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V6M12 4V3L9 6M12 4c-4.418 0-8 2-8 2s3.582 2 8 2 8-2 8-2V3M12 4l3-3M9 6v13m0 0H7" />
          </svg>
        );
        subtitleDisplay = `Música`;
        bgColorClass = 'bg-[#D97706]'; // Amber for music
        break;
      case 'cordel':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 5v14M17 5v14M7 12h10M9 9l6 6" />
          </svg>
        );
        subtitleDisplay = `Poema/Cordel`;
        bgColorClass = 'bg-[#D97706]'; // Amber for cordel
        break;
    }

    const isFav = isFavorited(favorite.type, favorite.originalId);

    return (
      <div 
        className="relative w-full bg-[var(--tertiary-bg)] p-3 rounded-2xl flex items-center justify-between border border-[var(--border-light)] hover:border-[var(--secondary-bg)] hover:shadow-md transition-all group mb-2"
      >
        <button
          onClick={() => onSelectFavorite(favorite)}
          className="flex items-center flex-1 pr-10 min-w-0"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 text-[var(--text-light)] shadow-sm transition-transform group-hover:scale-105 flex-shrink-0 ${bgColorClass}`}>
            {icon}
          </div>
          <div className="text-left flex-1 min-w-0">
            <span className="font-bold text-[var(--text-dark)] text-sm md:text-base truncate block">
              {titleDisplay}
            </span>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest truncate">
              {subtitleDisplay}
            </p>
          </div>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(favorite);
          }}
          className={`p-2 rounded-full transition-colors active:scale-90 absolute right-3 top-1/2 -translate-y-1/2 ${
            isFav ? 'text-amber-500 hover:bg-amber-100' : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
          }`}
          aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    );
  };

  const totalFavorites = favorites.length;

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-2xl mx-auto w-full pb-24">
      <header className="mb-10 relative">
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-black mb-6 hover:underline group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm uppercase tracking-widest">Início</span>
        </button>
        <h1 className="text-5xl font-bold text-[var(--text-dark)] bible-font leading-none mb-2">Meus Favoritos</h1>
        <p className="text-[10px] text-[var(--text-muted)] font-medium opacity-80 uppercase tracking-widest mt-1">
            Total de Favoritos: {totalFavorites}
        </p>
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

      {totalFavorites === 0 ? (
        <div className="text-center py-20 bg-[var(--tertiary-bg)]/50 rounded-[3rem] border-4 border-dashed border-[var(--border-light)]">
           <div className="bg-[var(--primary-bg)] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
           </div>
           <p className="text-[var(--text-muted)] font-bold italic">Nenhum item adicionado aos favoritos ainda.</p>
           <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-2">Navegue pelas Escrituras, Histórias ou Músicas/Cordéis e clique no coração!</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map(section => (
            section.groups.length > 0 && (
              <div key={section.id} className="animate-fade-in">
                {/* CABEÇALHO DA SEÇÃO PRINCIPAL (ex: Histórias) */}
                <div className="flex items-center mb-6">
                    <div className="bg-[var(--secondary-bg)] p-2 rounded-xl text-white mr-3 shadow-sm">
                        {section.icon}
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-dark)] bible-font">
                        {section.title}
                    </h2>
                    <span className="ml-3 text-[10px] bg-[var(--primary-bg)] px-2 py-1 rounded-full text-[var(--text-muted)] font-bold border border-[var(--border-light)]">
                        {section.totalCount}
                    </span>
                </div>

                {/* LISTA DE LIVROS (ACORDEÃO) */}
                <div className="space-y-3">
                  {section.groups.map(group => {
                    const groupKey = `${section.id}-${group.bookName}`;
                    const isExpanded = expandedGroups[groupKey];

                    return (
                      <div key={group.bookName} className="bg-white rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Botão do Livro */}
                        <button 
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full flex items-center justify-between p-4 bg-[var(--tertiary-bg)] hover:bg-[var(--primary-bg)] transition-colors text-left"
                        >
                          <div className="flex items-center">
                             <div className="w-8 h-8 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center mr-3 text-[var(--text-dark)] font-black text-xs border border-[var(--border-light)]">
                                {group.bookName.substring(0, 1)}
                             </div>
                             <span className="font-bold text-[var(--text-dark)] text-sm">{group.bookName}</span>
                             <span className="ml-2 text-[10px] text-[var(--text-muted)] bg-[var(--primary-bg)] px-1.5 rounded-md">
                               {group.items.length}
                             </span>
                          </div>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-[var(--text-muted)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Lista de Itens (Expandida) */}
                        {isExpanded && (
                          <div className="p-3 bg-[var(--primary-bg)]/50 border-t border-[var(--border-light)] animate-fade-in">
                            {group.items.map(favorite => (
                              <FavoriteItemCard key={favorite.id} favorite={favorite} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesListView;