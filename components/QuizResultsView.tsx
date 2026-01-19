
import React, { useState, useMemo, useRef } from 'react';
import { QuizSubmission, Quiz } from '../types';
import { jsPDF } from 'jspdf';

interface QuizResultsViewProps {
  onBack: () => void;
  quizzes: Quiz[];
  submissions: QuizSubmission[];
  onGoHome: () => void;
}

const QuizResultsView: React.FC<QuizResultsViewProps> = ({ onBack, quizzes, submissions, onGoHome }) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Referência mantida apenas para compatibilidade
  const reportRef = useRef<HTMLDivElement>(null);

  const quizzesMap = useMemo(() => {
    return new Map(quizzes.map(q => [q.id, q]));
  }, [quizzes]);

  // Agrupar submissões por Quiz
  const submissionsByQuiz = useMemo(() => {
    const groups: Record<string, QuizSubmission[]> = {};
    submissions.forEach(s => {
      if (!groups[s.quizId]) groups[s.quizId] = [];
      groups[s.quizId].push(s);
    });
    return groups;
  }, [submissions]);

  // Lista de Quizzes que têm submissões (ou todos, se quiser incluir os vazios no relatório geral)
  const activeQuizzes = useMemo(() => {
    // Filtra apenas quizzes que existem no mapa e ordena por livro/capítulo
    return quizzes
      .filter(q => true) // Pode ajustar para filtrar apenas os que tem resposta se desejar: submissionsByQuiz[q.id]?.length > 0
      .sort((a, b) => a.bookName.localeCompare(b.bookName) || a.chapter - b.chapter);
  }, [quizzes]);

  const handleDownloadGeneralPDF = () => {
    if (activeQuizzes.length === 0) {
      alert("Não há dados para gerar o relatório.");
      return;
    }

    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      
      // Configurações Globais
      const leftMargin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (leftMargin * 2);
      let yPos = 20;

      // Função auxiliar para verificar quebra de página
      const checkPageBreak = (spaceNeeded: number) => {
        if (yPos + spaceNeeded >= pageHeight - 15) {
          doc.addPage();
          yPos = 20;
          return true; // Indicador de que houve quebra
        }
        return false;
      };

      // Função para escrever texto com quebra de linha automática
      const writeWrappedText = (text: string, fontSize: number = 10, isBold: boolean = false, indent: number = 0, color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        const heightNeeded = lines.length * (fontSize * 0.45); // Ajuste fino de altura
        
        checkPageBreak(heightNeeded + 2);
        doc.text(lines, leftMargin + indent, yPos);
        yPos += heightNeeded + 2;
      };

      // --- PÁGINA DE CAPA / RESUMO GLOBAL ---
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Geral de Testagens", pageWidth / 2, 40, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Bíblia do Sertanejo - A Palavra em Áudio", pageWidth / 2, 50, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.line(leftMargin, 60, pageWidth - leftMargin, 60);

      const totalSubmissions = submissions.length;
      const totalQuizzes = activeQuizzes.length;
      const reportDate = new Date().toLocaleDateString('pt-BR');

      yPos = 80;
      writeWrappedText(`Data de Emissão: ${reportDate}`, 12, false);
      writeWrappedText(`Total de Testagens Cadastradas: ${totalQuizzes}`, 12, true);
      writeWrappedText(`Total Geral de Participações: ${totalSubmissions}`, 12, true);

      // --- LOOP POR CADA TESTAGEM (QUIZ) ---
      activeQuizzes.forEach((quiz, index) => {
        // Nova página para cada testagem (exceto se for a primeira e quisermos logo após a capa, mas melhor separar)
        doc.addPage();
        yPos = 20;

        const quizSubmissions = submissionsByQuiz[quiz.id] || [];
        const total = quizSubmissions.length;

        // Cabeçalho da Testagem
        doc.setFillColor(240, 240, 240); // Fundo cinza claro para o cabeçalho
        doc.rect(leftMargin - 2, yPos - 6, contentWidth + 4, 24, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Testagem ${index + 1}: ${quiz.title}`, leftMargin, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`${quiz.bookName} - Capítulo ${quiz.chapter}`, leftMargin, yPos);
        yPos += 6;
        doc.setFont("helvetica", "bold");
        doc.text(`Participações: ${total}`, leftMargin, yPos);
        yPos += 15;

        // Seção: Análise Consolidada das Perguntas
        if (total > 0) {
            writeWrappedText("ANÁLISE CONSOLIDADA DAS RESPOSTAS", 12, true, 0, [74, 53, 47]); // Marrom secundário
            yPos += 2;
            
            quiz.questions.forEach((question, qIdx) => {
                checkPageBreak(30);
                writeWrappedText(`Q${qIdx + 1}: ${question.text}`, 10, true);
                
                const uniqueAnswers = Array.from(new Set(
                    quizSubmissions
                    .map(s => s.answers.find(a => a.questionId === question.id)?.answerText)
                    .filter((a): a is string => !!a && a.trim().length > 0)
                ));

                if (uniqueAnswers.length > 0) {
                    uniqueAnswers.forEach(ans => {
                        writeWrappedText(`• ${ans}`, 9, false, 5, [80, 80, 80]);
                    });
                } else {
                    writeWrappedText("• Nenhuma resposta registrada.", 9, false, 5, [150, 150, 150]);
                }
                yPos += 4;
            });

            yPos += 5;
            doc.setLineWidth(0.2);
            doc.setDrawColor(200, 200, 200);
            doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
            yPos += 10;

            // Seção: Detalhamento Individual
            checkPageBreak(30);
            writeWrappedText("PARTICIPAÇÕES INDIVIDUAIS", 12, true, 0, [74, 53, 47]);
            yPos += 2;

            quizSubmissions.forEach((sub, subIdx) => {
                checkPageBreak(40);
                
                // Cabeçalho do Participante
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text(`${subIdx + 1}. ${sub.userName} (${sub.ageGroup})`, leftMargin, yPos);
                
                // Local e Data à direita na mesma linha
                const metaInfo = `${sub.city}/${sub.state} em ${sub.submissionDate}`;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                const metaWidth = doc.getTextWidth(metaInfo);
                doc.text(metaInfo, pageWidth - leftMargin - metaWidth, yPos);
                
                yPos += 5;

                // Respostas do Participante
                quiz.questions.forEach((q, qIdx) => {
                    const ans = sub.answers.find(a => a.questionId === q.id)?.answerText || "-";
                    // Tenta manter pergunta e resposta juntas
                    if (checkPageBreak(15)) {
                         // Se quebrou a página, repete o nome do participante para contexto
                         writeWrappedText(`${sub.userName} (cont.)`, 9, true, 0, [150, 150, 150]);
                    }

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.setTextColor(60, 60, 60);
                    doc.text(`R${qIdx + 1}:`, leftMargin + 4, yPos);
                    
                    // Resposta
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(0, 0, 0);
                    const splitAns = doc.splitTextToSize(ans, contentWidth - 18);
                    doc.text(splitAns, leftMargin + 12, yPos);
                    
                    yPos += (splitAns.length * 3.5) + 2;
                });
                
                yPos += 4; // Espaço entre participantes
            });

        } else {
             writeWrappedText("Ainda não há participações registradas para esta testagem.", 10, false, 0, [100, 100, 100]);
        }
      });

      // Numeração de Páginas
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Relatório Geral Bíblia do Sertanejo`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save("Relatorio_Geral_Completo.pdf");

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o arquivo PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderQuizReport = (quiz: Quiz) => {
    const quizSubmissions = submissionsByQuiz[quiz.id] || [];
    const total = quizSubmissions.length;

    // Estatísticas de Idade
    const ageStats = quizSubmissions.reduce((acc, curr) => {
      acc[curr.ageGroup] = (acc[curr.ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Estatísticas de Cidade
    const cityStats = quizSubmissions.reduce((acc, curr) => {
      const city = curr.city.trim() || 'Não informado';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar respostas por Pergunta (TODAS as perguntas)
    const answersByQuestion = quiz.questions.map(question => {
      const answers = quizSubmissions
        .map(s => s.answers.find(a => a.questionId === question.id)?.answerText)
        .filter((a): a is string => !!a && a.trim().length > 0);
      return { question: question.text, answers };
    });

    return (
      <div ref={reportRef} className="bg-[var(--tertiary-bg)] rounded-[2rem] p-8 shadow-sm border border-[var(--border-light)] animate-fade-in mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-dashed border-[var(--border-light)] pb-4 gap-4">
          <div>
             <h2 className="text-2xl font-bold text-[var(--text-dark)] bible-font leading-tight">{quiz.title}</h2>
             <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">{quiz.bookName} • Cap. {quiz.chapter}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="text-right block">
                <span className="block text-4xl font-black text-[var(--secondary-bg)]">{total}</span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Participações</span>
             </div>
          </div>
        </div>

        {total === 0 ? (
          <p className="text-center italic text-[var(--text-muted)] py-8 font-medium">Ainda não há participações para esta testagem.</p>
        ) : (
          <div className="space-y-8">
            {/* GRÁFICOS SIMPLES DE BARRAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[var(--primary-bg)] p-5 rounded-2xl border border-[var(--border-light)]">
                  <h3 className="text-xs font-black uppercase text-[var(--text-muted)] mb-4 tracking-widest">Faixa Etária</h3>
                  <div className="space-y-3">
                    {Object.entries(ageStats).map(([age, count]) => (
                      <div key={age} className="flex items-center text-xs">
                        <span className="w-16 font-bold text-[var(--text-dark)]">{age}</span>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden mx-2 border border-[var(--border-light)]">
                           <div className="h-full bg-[var(--secondary-bg)]" style={{ width: `${(Number(count)/total)*100}%` }}></div>
                        </div>
                        <span className="font-mono text-[var(--text-muted)] font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-[var(--primary-bg)] p-5 rounded-2xl border border-[var(--border-light)]">
                  <h3 className="text-xs font-black uppercase text-[var(--text-muted)] mb-4 tracking-widest">Top Cidades</h3>
                  <div className="space-y-3">
                    {Object.entries(cityStats).sort((a,b) => Number(b[1]) - Number(a[1])).slice(0, 5).map(([city, count]) => (
                      <div key={city} className="flex items-center text-xs">
                        <span className="flex-1 truncate font-bold text-[var(--text-dark)] pr-2">{city}</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded text-[var(--secondary-bg)] border border-[var(--border-light)] font-bold text-[10px]">{count}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* ANÁLISE DE PERGUNTAS (TODAS) */}
            <div className="break-inside-avoid">
               <h3 className="text-lg font-bold text-[var(--text-dark)] mb-4 flex items-center bible-font">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 Análise das Respostas
               </h3>
               <div className="space-y-4">
                 {answersByQuestion.map((item, idx) => (
                   <div key={idx} className="bg-white border border-[var(--border-light)] rounded-2xl overflow-hidden shadow-sm break-inside-avoid">
                     <div className="bg-[var(--primary-bg)] text-[var(--text-dark)] px-4 py-3 text-sm font-bold border-b border-[var(--border-light)]">
                       <span className="text-[var(--secondary-bg)] mr-2">#{idx + 1}</span> {item.question}
                     </div>
                     <div className="p-4">
                        {item.answers.length > 0 ? (
                          <ul className="list-disc list-inside space-y-2 text-xs text-[var(--text-muted)]">
                            {item.answers.map((ans, i) => (
                              <li key={i} className="leading-relaxed border-b border-[var(--border-light)] last:border-0 pb-1">{ans}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] italic">Nenhuma resposta registrada.</p>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* LISTA DE SUBMISSÕES INDIVIDUAIS */}
            <div className="break-before-page">
               <h3 className="text-lg font-bold text-[var(--text-dark)] mb-4 flex items-center bible-font mt-8 border-t border-[var(--border-light)] pt-8">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[var(--secondary-bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 Participações Individuais
               </h3>
               <div className="space-y-2">
                 {quizSubmissions.map(sub => (
                   <div key={sub.id} className="border border-[var(--border-light)] rounded-xl bg-white overflow-hidden transition-all hover:border-[var(--secondary-bg)] break-inside-avoid">
                     {/* Accordion interativo na tela */}
                     <button 
                       onClick={() => setExpandedSubmissionId(expandedSubmissionId === sub.id ? null : sub.id)}
                       className="w-full flex justify-between items-center p-3 hover:bg-[var(--primary-bg)] transition-colors text-left"
                     >
                        <div>
                          <p className="font-bold text-sm text-[var(--text-dark)]">{sub.userName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{sub.city}/{sub.state} • {sub.ageGroup}</p>
                        </div>
                        <div className={`transform transition-transform ${expandedSubmissionId === sub.id ? 'rotate-180' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-muted)]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                     </button>
                     
                     <div className={`p-4 bg-[var(--primary-bg)] border-t border-[var(--border-light)] space-y-4 ${expandedSubmissionId === sub.id ? 'block' : 'hidden'}`}>
                         {quiz.questions.map((q, qIdx) => {
                           const ans = sub.answers.find(a => a.questionId === q.id)?.answerText || "Não respondeu";
                           return (
                             <div key={q.id}>
                               <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-1">Questão {qIdx + 1}</p>
                               <p className="text-xs font-bold text-[var(--text-dark)] mb-1 leading-snug">{q.text}</p>
                               <div className="text-sm text-[var(--text-dark)] bg-white p-3 rounded-lg border border-[var(--border-light)] shadow-sm">
                                   {ans}
                               </div>
                             </div>
                           )
                         })}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in max-w-5xl mx-auto w-full pb-24 text-[13px] bg-[var(--primary-bg)] min-h-screen">
      <header className="mb-8 relative"> 
        <button onClick={onBack} className="flex items-center text-[var(--text-dark)] font-bold mb-4 hover:underline group px-4 py-2 bg-white rounded-full shadow-sm border border-[var(--border-light)] w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
            <div className="flex items-center space-x-3">
                <div className="bg-[var(--secondary-bg)] p-3 rounded-2xl text-white shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-dark)] bible-font leading-none">Relatórios</h1>
                    <p className="text-[var(--text-muted)] mt-1 font-medium">Resultados das testagens de compreensão.</p>
                </div>
            </div>

            {/* BOTÃO DE DOWNLOAD GERAL (MOVIDO PARA CÁ) */}
            <button
               onClick={handleDownloadGeneralPDF}
               disabled={isDownloading || activeQuizzes.length === 0}
               className="flex items-center justify-center bg-[var(--secondary-bg)] text-white px-5 py-3 rounded-xl shadow-md hover:bg-[#3A2923] active:scale-95 transition-all disabled:opacity-50 group border border-white/20"
               title="Baixar Relatório Geral com Todas as Testagens"
             >
               {isDownloading ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   <span className="font-bold text-sm">Baixar Relatório Geral (PDF)</span>
                 </>
               )}
            </button>
        </div>
        
        <button 
          onClick={onGoHome} 
          className="absolute top-0 right-0 p-3 text-[var(--text-muted)] hover:text-[var(--text-dark)] bg-white rounded-xl shadow-sm border border-[var(--border-light)] transition-all active:scale-90"
          title="Início"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3" />
          </svg>
        </button>
      </header>

      {activeQuizzes.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-[2.5rem] border border-[var(--border-light)] shadow-sm mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--border-light)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[var(--text-muted)] font-bold italic">Nenhuma testagem criada ou respondida ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* SIDEBAR: Lista de Testagens */}
            <div className="lg:col-span-4 space-y-4">
               <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest pl-2 mb-2">Testagens Disponíveis</h3>
               {activeQuizzes.map(quiz => {
                   const count = (submissionsByQuiz[quiz.id] || []).length;
                   const isSelected = selectedQuizId === quiz.id;
                   
                   return (
                       <button
                         key={quiz.id}
                         onClick={() => setSelectedQuizId(quiz.id)}
                         className={`w-full text-left p-4 rounded-2xl border transition-all shadow-sm flex items-center justify-between group ${
                             isSelected 
                             ? 'bg-[var(--secondary-bg)] border-[var(--secondary-bg)] text-white ring-2 ring-offset-2 ring-[var(--secondary-bg)]' 
                             : 'bg-white border-[var(--border-light)] text-[var(--text-dark)] hover:border-[var(--secondary-bg)]'
                         }`}
                       >
                         <div className="min-w-0">
                           <h4 className={`font-bold truncate ${isSelected ? 'text-white' : 'text-[var(--text-dark)]'}`}>{quiz.title}</h4>
                           <p className={`text-[10px] uppercase font-bold mt-1 ${isSelected ? 'text-[var(--accent-dark)]' : 'text-[var(--text-muted)]'}`}>
                               {quiz.bookName} • {count} Resposta(s)
                           </p>
                         </div>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-[var(--border-light)] group-hover:text-[var(--secondary-bg)]'}`} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                   );
               })}
            </div>

            {/* MAIN: Relatório Detalhado */}
            <div className="lg:col-span-8">
                {selectedQuizId ? (
                    renderQuizReport(quizzesMap.get(selectedQuizId)!)
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-[var(--border-light)] text-[var(--text-muted)] p-10 text-center">
                        <div className="w-20 h-20 bg-[var(--primary-bg)] rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2">Selecione uma Testagem</h3>
                        <p className="max-w-xs">Clique em uma das opções ao lado para visualizar os gráficos na tela, ou clique no botão acima para baixar o relatório completo.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultsView;
