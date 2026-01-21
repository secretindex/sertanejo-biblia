import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithChaplain } from '../services/geminiService';

interface ChatProps {
  currentContext: string;
}

const Chat: React.FC<ChatProps> = ({ currentContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Olá! Sou seu Capelão Digital. Como posso te ajudar hoje com a Palavra?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await chatWithChaplain(userMessage, currentContext);
      setMessages(prev => [...prev, { role: 'model', content: response || 'Desculpe, não consegui processar isso no momento.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: 'Houve um erro na conexão.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-96 flex flex-col h-full bg-white border-l border-stone-200">
      <div className="p-6 border-b border-stone-100 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-stone-800">Capelão Digital</h2>
          <span className="flex items-center text-[10px] text-green-500 font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Online agora
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-amber-600 text-white rounded-tr-none shadow-md' 
                : 'bg-stone-100 text-stone-700 rounded-tl-none border border-stone-200'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 p-3 rounded-2xl rounded-tl-none border border-stone-200">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            placeholder="Pergunte sobre a Palavra..."
            className="w-full pr-12 pl-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-inner"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 p-1.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-stone-400 text-center mt-3">IA baseada em princípios bíblicos.</p>
      </div>
    </div>
  );
};

export default Chat;
