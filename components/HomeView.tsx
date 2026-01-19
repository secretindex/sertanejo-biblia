
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserSettings, AppThemeId } from '../types';

interface HomeViewProps {
  onStart: () => void;
  onStories: () => void;
  onQuizzes: () => void;
  onMusicAndCordel: () => void;
  onDevAccess: () => void;
  onViewQuizResults: () => void;
  onViewFavorites: () => void;
  userSettings?: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  onStart, onStories, onQuizzes, onMusicAndCordel, onDevAccess, onViewQuizResults, onViewFavorites,
  userSettings, onUpdateSettings
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista de versículos curtos em dialeto sertanejo para rotação diária
  const VERSES_SERTANEJOS = useMemo(() => [
    "O Sinhô é meu pastô, pr'essas banda nada vai fartá.",
    "Lâmpada pros meus pé é a Tua palavra, luz no meu carrêro.",
    "Tudo eu guento Naquele que me dá um fôlego danado.",
    "Amar o próximo como a si memo, é a lei da roça e do céu.",
    "Buscai primêro o Reino de Deus, e o resto Ele ajeita.",
    "A alegria do Sinhô é o que nos sustenta na lida.",
    "Fé é crê no que a gente ainda num tá vendo no horizonte.",
    "Quem planta bondade, colhe a paz no terreiro da vida.",
    "Deus num desampara quem acorda cedo pra lutar com fé.",
    "O amor de Deus é mais vasto que todo o sertão.",
    "Vigia o coração, que é de lá que sai as coisa boa da vida.",
    "Quem tem Deus no peito, num teme nem assombração.",
    "A palavra do Homem lá de cima é sustento pra alma cansada.",
    "Seja manso de coração, que a terra é herança dos pequeno.",
    "Bote sua vida nas mão do Sinhô e confie no que Ele faz."
  ], []);

  // Seleciona o versículo com base no dia do ano
  const dailyVerse = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return VERSES_SERTANEJOS[dayOfYear % VERSES_SERTANEJOS.length];
  }, [VERSES_SERTANEJOS]);

  // --- ARTES DO SERTÃO (Estilo Minimalista Line-Art de Alta Qualidade) ---
  const SERTANEJO_ARTS = [
    {
      id: 'pastor',
      title: 'O Pastor',
      svg: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Chão */}
          <path d="M40 160 Q 100 155 160 160" opacity="0.4" />
          {/* Cajado */}
          <path d="M120 160 V 60 C 120 60 135 60 135 75" strokeWidth="2" />
          {/* Pastor Simplificado */}
          <path d="M90 160 L 95 110" /> {/* Perna */}
          <path d="M105 160 L 100 110" /> {/* Perna */}
          <path d="M97 110 V 80" strokeWidth="2" /> {/* Tronco */}
          <path d="M97 85 L 80 100" /> {/* Braço */}
          <path d="M97 85 L 120 90" /> {/* Braço segurando cajado */}
          <circle cx="97" cy="70" r="8" strokeWidth="2" /> {/* Cabeça */}
          {/* Chapéu de Couro (Aba larga) */}
          <path d="M80 70 Q 97 60 114 70" fill="none" />
          
          {/* Ovelha Minimalista */}
          <path d="M60 160 Q 55 145 65 145 Q 75 145 80 155" />
          <path d="M60 160 V 155 M 75 160 V 155" />
        </g>
      )
    },
    {
      id: 'mulher',
      title: 'Água Viva',
      svg: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
           {/* Mulher */}
           <path d="M100 160 L 90 120 H 110 L 100 160" /> {/* Saia */}
           <path d="M100 120 V 90" /> {/* Tronco */}
           <path d="M100 95 L 85 110" /> {/* Braço */}
           <path d="M100 95 L 115 80" /> {/* Braço levantado segurando pote */}
           <circle cx="100" cy="82" r="7" /> {/* Cabeça */}
           
           {/* Pote na Cabeça */}
           <rect x="94" y="65" width="12" height="10" rx="2" />
           <path d="M94 70 H 106" opacity="0.5"/>

           {/* Poço */}
           <path d="M140 160 V 130 H 160 V 160" />
           <path d="M140 130 L 145 120 H 155 L 160 130" />
           
           {/* Sol */}
           <circle cx="50" cy="60" r="10" strokeDasharray="2 2" opacity="0.6"/>
        </g>
      )
    },
    {
      id: 'cruz',
      title: 'Fé no Sertão',
      svg: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
           {/* Colina */}
           <path d="M30 160 Q 100 130 170 160" strokeWidth="1" />
           
           {/* Cruz */}
           <path d="M100 150 V 60" strokeWidth="2" />
           <path d="M85 80 H 115" strokeWidth="2" />
           
           {/* Mandacaru */}
           <path d="M140 150 V 100" />
           <path d="M140 120 Q 155 110 155 100" />
           <path d="M140 130 Q 125 120 125 110" />
        </g>
      )
    },
    {
      id: 'semeador',
      title: 'O Semeador',
      svg: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
           {/* Semeador */}
           <path d="M90 160 L 95 120" /> {/* Perna */}
           <path d="M110 160 L 105 120" /> {/* Perna */}
           <path d="M100 120 V 85" /> {/* Tronco */}
           <circle cx="100" cy="75" r="7" />
           <path d="M100 90 L 130 80" /> {/* Braço jogando */}
           <path d="M100 90 L 80 100" /> {/* Braço saco */}
           
           {/* Sementes */}
           <circle cx="135" cy="85" r="0.5" fill="currentColor" />
           <circle cx="140" cy="75" r="0.5" fill="currentColor" />
           <circle cx="145" cy="90" r="0.5" fill="currentColor" />

           {/* Chapéu de Palha */}
           <path d="M90 75 H 110 L 105 65 H 95 Z" />
           
           {/* Terra */}
           <path d="M40 160 H 160" strokeDasharray="4 4" opacity="0.5"/>
        </g>
      )
    },
    {
      id: 'pescador',
      title: 'Pescador de Homens',
      svg: (
        <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
           {/* Barco / Jangada */}
           <path d="M60 140 H 140 L 130 160 H 70 Z" />
           
           {/* Vela */}
           <path d="M100 140 V 50 L 135 130 L 100 140" />
           
           {/* Pescador Sentado */}
           <path d="M80 140 L 80 125" />
           <circle cx="80" cy="118" r="6" />
           
           {/* Água */}
           <path d="M40 165 Q 60 160 80 165 T 120 165 T 160 165" opacity="0.5" />
        </g>
      )
    }
  ];

  // Estado para armazenar a arte selecionada
  const [currentArt, setCurrentArt] = useState(SERTANEJO_ARTS[0]);
  const [fadeKey, setFadeKey] = useState(0);

  // Efeito para escolher uma arte aleatória ao montar
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SERTANEJO_ARTS.length);
    setCurrentArt(SERTANEJO_ARTS[randomIndex]);
    setFadeKey(prev => prev + 1);
  }, []); 

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateSettings && userSettings) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...userSettings, avatarImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTintToggle = () => {
    if (onUpdateSettings && userSettings) {
        onUpdateSettings({ ...userSettings, tintAvatar: !userSettings.tintAvatar });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-10 p-6 text-center animate-fade-in relative min-h-screen">
      
      {/* MODAL DE CONFIGURAÇÕES / TEMA */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--primary-bg)] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[var(--border-light)] relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-dark)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-xl font-bold text-[var(--text-dark)] mb-6 bible-font">Personalização</h3>

            {/* UPLOAD DE FOTO ARTÍSTICA */}
            <div>
              <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 text-left">Sua Arte no Sertão</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--tertiary-bg)] transition-colors group mb-3"
              >
                 {userSettings?.avatarImage ? (
                   <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2">
                      {/* PREVIEW DA FOTO NAS CONFIGURAÇÕES */}
                      <img 
                        src={userSettings.avatarImage} 
                        className="w-full h-full object-cover" 
                        style={userSettings.tintAvatar ? { filter: 'grayscale(100%) contrast(120%)' } : {}}
                        alt="Preview" 
                      />
                      {userSettings.tintAvatar && (
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            backgroundColor: 'var(--secondary-bg)', 
                            mixBlendMode: 'color', 
                            opacity: 0.8 
                          }}
                        ></div>
                      )}
                   </div>
                 ) : (
                   <div className="w-12 h-12 bg-[var(--tertiary-bg)] rounded-full flex items-center justify-center mb-2 text-[var(--text-muted)] group-hover:text-[var(--secondary-bg)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                 )}
                 <span className="text-xs font-bold text-[var(--text-dark)]">
                   {userSettings?.avatarImage ? 'Trocar Imagem' : 'Adicionar Foto'}
                 </span>
                 <p className="text-[10px] text-[var(--text-muted)] mt-1">Sua foto aparecerá na tela inicial.</p>
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* TOGGLE PARA COLORIR A FOTO */}
              {userSettings?.avatarImage && (
                 <div className="flex items-center justify-between bg-[var(--tertiary-bg)] p-3 rounded-xl border border-[var(--border-light)] mb-3">
                    <span className="text-xs font-bold text-[var(--text-dark)]">Colorir foto com o tema</span>
                    <button 
                        onClick={handleTintToggle}
                        className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${userSettings.tintAvatar ? 'bg-[var(--secondary-bg)]' : 'bg-[var(--border-light)]'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${userSettings.tintAvatar ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                 </div>
              )}

              {userSettings?.avatarImage && (
                <button 
                  onClick={() => onUpdateSettings && onUpdateSettings({ ...userSettings, avatarImage: undefined })}
                  className="mt-3 text-xs text-red-400 font-bold hover:underline w-full text-center"
                >
                  Remover Foto e Usar Arte Padrão
                </button>
              )}
            </div>

          </div>
        </div>
      )}


      {/* ÍCONES DE AÇÃO NO CANTO SUPERIOR DIREITO */}
      <div className="absolute top-8 right-8 z-[100] flex flex-col space-y-2">
        <button 
          onClick={(e) => {
            e.preventDefault();
            onDevAccess();
          }}
          className="p-2 text-[var(--text-muted)] opacity-50 hover:opacity-100 transition-all active:scale-90"
          aria-label="Configurações"
          title="Configurações de Desenvolvedor"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l-.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onViewQuizResults();
          }}
          className="p-2 text-[var(--text-muted)] opacity-50 hover:opacity-100 transition-all active:scale-90"
          aria-label="Resultados das Testagens"
          title="Ver resultados das testagens"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20V10M18 20V4M6 20v-4" />
            <path d="M12 20h9a2 2 0 002-2V4a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2h7" />
          </svg>
        </button>
        {/* Botão de Favoritos */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            onViewFavorites();
          }}
          className="p-2 text-[var(--text-muted)] opacity-50 hover:opacity-100 transition-all active:scale-90"
          aria-label="Favoritos"
          title="Meus Favoritos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* NOVO: Botão de Tema (Abaixo do Coração) */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsSettingsOpen(true);
          }}
          className="p-2 text-[var(--text-muted)] opacity-50 hover:opacity-100 transition-all active:scale-90"
          aria-label="Personalizar Tema"
          title="Personalizar Tema"
        >
          {/* Ícone de Paleta de Pintura (agora usado para mudar foto) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* ÁREA DA ARTE DINÂMICA (SUBSTITUI O ÍCONE ESTÁTICO) */}
      <div className="mb-6 group cursor-pointer relative" onClick={onStart} key={fadeKey}>
        <div className="w-64 h-64 flex items-center justify-center mx-auto transition-transform duration-700 transform group-hover:scale-105">
           
           {/* Se o usuário tiver uma imagem personalizada */}
           {userSettings?.avatarImage ? (
             <div className="w-full h-full rounded-full overflow-hidden opacity-90 drop-shadow-xl relative bg-white">
                 {/* Imagem do Usuário */}
                 <img 
                    src={userSettings.avatarImage} 
                    alt="User Art" 
                    className="w-full h-full object-cover"
                    style={userSettings.tintAvatar ? { filter: 'grayscale(100%) contrast(120%)' } : {}}
                 />
                 
                 {/* Overlay de Cor do Tema (Se tintAvatar estiver ativo) */}
                 {userSettings.tintAvatar && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundColor: 'var(--secondary-bg)',
                            mixBlendMode: 'color', // Tinge os tons de cinza
                            opacity: 0.8
                        }}
                    ></div>
                 )}
                 
                 {/* Overlay de Textura (Opcional, para estilo) */}
                 {userSettings.tintAvatar && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--secondary-bg)] to-transparent opacity-30 pointer-events-none mix-blend-multiply"></div>
                 )}
             </div>
           ) : (
             /* Caso contrário, mostra a arte SVG padrão */
             <div className="w-full h-full text-[var(--text-dark)] opacity-90">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                    {/* Círculo Fino ao Redor da Arte */}
                    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                    {currentArt.svg}
                </svg>
             </div>
           )}

        </div>
      </div>

      <div className="space-y-1 mb-8 text-center">
        {/* TÍTULO EM UMA ÚNICA LINHA */}
        <h1 className="text-4xl font-bold text-[var(--text-dark)] bible-font tracking-tight drop-shadow-sm">
          Bíblia do Sertanejo
        </h1>
        <p className="text-[var(--text-muted)] text-sm md:text-base font-medium opacity-80 italic">
          {userSettings?.avatarImage ? 'Sua Jornada no Sertão' : currentArt.title}
        </p>
      </div>

      {/* BOTÕES RESTAURADOS PARA O FORMATO ANTERIOR (LISTA VERTICAL) */}
      <div className="w-full max-w-[280px] px-0 space-y-3">
        
        {/* BOTÃO 1: OUÇA A BÍBLIA */}
        <button 
          onClick={onStart}
          className="w-full bg-[var(--secondary-bg)] text-[var(--text-light)] py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-2xl hover:brightness-110 border-b-4 border-[var(--text-dark)] transform hover:-translate-y-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span className="font-bold text-base uppercase tracking-wider">Ouça a Bíblia</span>
        </button>

        {/* BOTÃO 2: HISTÓRIAS SELECIONADAS */}
        <button 
          onClick={onStories}
          className="w-full bg-[var(--tertiary-bg)] text-[var(--text-dark)] py-3 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-md hover:bg-[var(--border-light)] border-b-2 border-[var(--border-light)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="font-semibold text-sm">Histórias selecionadas</span>
        </button>

        {/* BOTÃO 3: MÚSICAS E CORDÉIS */}
        <button 
          onClick={onMusicAndCordel}
          className="w-full bg-[var(--tertiary-bg)] text-[var(--text-dark)] py-3 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-md hover:bg-[var(--border-light)] border-b-2 border-[var(--border-light)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a2 2 0 012 2v6.5c2 0 4 2 4 4.5S15 19 12 19s-6-4-6-6.5c0-2.5 2-4.5 4-4.5V4a2 2 0 012-2z" />
            <circle cx="12" cy="14" r="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4h3" />
          </svg>
          <span className="font-semibold text-sm">Músicas e cordeis</span>
        </button>

        {/* BOTÃO 4: TESTAGEM DE ÁUDIOS */}
        <button 
          onClick={onQuizzes}
          className="w-full bg-[var(--tertiary-bg)] text-[var(--text-dark)] py-3 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-md hover:bg-[var(--border-light)] border-b-2 border-[var(--border-light)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-semibold text-sm">Testagem de áudios</span>
        </button>
      </div>

      {/* RODAPÉ: VERSÍCULO DIÁRIO */}
      <div className="absolute bottom-10 px-6 text-center w-full max-w-sm">
        <p className="text-[var(--text-muted)] italic text-base font-medium leading-relaxed">
          "{dailyVerse}"
        </p>
      </div>
    </div>
  );
};

export default HomeView;
