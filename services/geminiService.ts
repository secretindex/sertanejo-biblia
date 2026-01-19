
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CordelSegment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getBibleChapter = async (book: string, chapter: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Forneça o conteúdo do livro ${book}, capítulo ${chapter} da Bíblia (versão NVI).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          book: { type: Type.STRING },
          chapter: { type: Type.NUMBER },
          verses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.NUMBER },
                text: { type: Type.STRING }
              },
              required: ["number", "text"]
            }
          }
        },
        required: ["book", "chapter", "verses"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Erro ao processar JSON da Bíblia", e);
    return null;
  }
};

export const generateStoryIllustration = async (description: string, reference: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Bible Project "Story of the Bible" style. Single static illustration representing: ${description} (${reference}).
            
            STRICT VISUAL RULES:
            - PURE LINE ART: Black ink lines on a flat white background only.
            - NO BORDERS OR FRAMES: The image must extend to the edges without any containing box, line, or frame.
            - NO BLACK BARS: Do NOT add cinematic letterboxing or black bars at the top/bottom.
            - OPEN COMPOSITION: The subject should be centered with white space fading out to the edges.
            - GROUNDED & NATURAL: Depict realistic biblical scenes, landscapes, or historical items.
            - NO ABSTRACT SYMBOLS: Strictly avoid floating eyes, surrealist shapes, or occult icons.
            - NO SENSELESS OBJECTS: No floating geometry or exaggerated anatomy.
            - SIMPLICITY: Use minimal lines to convey a powerful theological scene.
            - THEMATIC: If it's about a mountain, show a simple mountain. If it's a character, show them in a natural pose.
            - NO TEXT, NO COLORS.`
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9" 
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Erro ao gerar ilustração:", err);
    return null;
  }
};

export const generateBibleAudio = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Leia este trecho bíblico: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};

export const extractStoriesFromAudio = async (base64Audio: string, book: string, chapter: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'audio/mpeg',
            data: base64Audio,
          },
        },
        {
          text: `Analise este áudio de ${book} ${chapter} e identifique histórias, parábolas ou milagres distintos.
          
          OBJETIVO: Identificar o momento exato onde a história começa e termina.
          
          REGRAS DE TIMESTAMPS:
          - 'startTime': O exato segundo onde a narração da história começa. Seja preciso.
          - 'endTime': O exato segundo onde a narração da história termina.
          - O sistema adicionará automaticamente uma pequena margem de segurança antes e depois, então foque em encontrar o início REAL da fala/história.
          
          Responda SOMENTE em JSON.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            reference: { type: Type.STRING },
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
          },
          required: ["title", "reference", "startTime", "endTime"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return [];
  }
};

export const extractMusicAndCordelFromAudio = async (base64Audio: string, book: string, chapter: number): Promise<Omit<CordelSegment, 'id' | 'fileName' | 'audioBlob'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/mpeg',
              data: base64Audio,
            },
          },
          {
            text: `Analise este áudio do livro ${book}, capítulo ${chapter}. Sua tarefa é ISOLAR estritamente MÚSICAS e POEMAS (CORDÉIS).

            REGRAS DE EXCLUSÃO (CRÍTICO):
            - PROIBIDO incluir histórias narradas, parábolas faladas, ou conversas.
            - PROIBIDO incluir a leitura simples do texto bíblico.
            - Se for apenas alguém falando/contando um caso: NÃO INCLUA.
            - Esta seção é APENAS para Arte Sonora (Música) e Arte Poética (Rima).

            REGRAS DE TÍTULOS (CRÍTICO):
            - GERE O TÍTULO COMPLETO. Não corte palavras.
            - Se a música canta "O Senhor é meu pastor e nada me faltará", o título deve ser "O Senhor é meu pastor e nada me faltará".
            - Não use "..." no final do título. Escreva a frase inteira que define o tema.
            - Corrija erros gramaticais óbvios no título se necessário para clareza.

            CRITÉRIOS DE ACEITAÇÃO:
            1. MÚSICA ('music'): Deve haver melodia cantada clara ou instrumental proeminente.
            2. CORDEL ('cordel'): Deve haver estrutura de rima (AABB, ABAB) e ritmo poético declamado (estilo repente/nordestino).

            TIMESTAMPS:
            - 'startTime': O segundo exato onde a música/poema começa (ignore introduções de fala como "Vamos ouvir agora...").
            - 'endTime': O segundo exato onde termina.

            Retorne uma lista vazia se não houver música ou cordel genuíno.

            Responda SOMENTE em formato JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título completo e descritivo da música ou poema, sem abreviações.' },
              reference: { type: Type.STRING, description: 'Tema associado.' },
              startTime: { type: Type.NUMBER, description: 'Início exato da música/poema em segundos.' },
              endTime: { type: Type.NUMBER, description: 'Fim exato da música/poema em segundos.' },
              segmentType: { type: Type.STRING, enum: ['music', 'cordel'], description: 'Tipo: "music" (melodia) ou "cordel" (rima/poema).' },
            },
            required: ["title", "reference", "startTime", "endTime", "segmentType"],
          },
        },
      },
    });

    const parsedResponse = JSON.parse(response.text.trim());
    return parsedResponse as Array<Omit<CordelSegment, 'id' | 'fileName' | 'audioBlob'>>;
  } catch (error: any) {
    console.error("Erro ao gerar análise de música/cordel:", error);
    if (error.status === 'RESOURCE_EXHAUSTED' || error.code === 429) {
      throw new Error(`Quota Excedida: ${error.message || 'Por favor, verifique seu plano e detalhes de faturamento.'}`);
    }
    throw new Error(`Falha ao extrair músicas e cordéis: ${error.message || 'Erro desconhecido.'}`);
  }
};


export const generateQuizQuestions = async (base64Audio: string, bookName: string, chapter: number): Promise<Array<{ text: string }> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/mpeg', 
              data: base64Audio,
            },
          },
          {
            text: `Baseado no conteúdo deste áudio do livro ${bookName}, capítulo ${chapter}, gere três (3) perguntas curtas, básicas e diretas, adequadas para uma testagem de compreensão. As perguntas devem ser do tipo "o que era isso?", "o que significa essa palavra/termo?", ou "o que aconteceu em determinada parte?". Responda SOMENTE em formato JSON, com um array de objetos, onde cada objeto tem uma chave 'text' contendo a pergunta.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
            },
            required: ["text"],
          },
        },
      },
    });

    const parsedResponse = JSON.parse(response.text.trim());
    return parsedResponse as Array<{ text: string }>;
  } catch (error: any) {
    console.error("Erro bruto ao gerar perguntas do quiz:", error);
    // Check for RESOURCE_EXHAUSTED error
    if (error.status === 'RESOURCE_EXHAUSTED' || error.code === 429) {
      throw new Error(`Quota Excedida: ${error.message || 'Por favor, verifique seu plano e detalhes de faturamento.'}`);
    }
    // Generic error
    throw new Error(`Falha ao gerar perguntas do quiz: ${error.message || 'Erro desconhecido.'}`);
  }
};

export const chatWithChaplain = async (message: string, context: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: `Contexto: ${context}` },
        { text: `Usuário: ${message}` }
      ]
    },
    config: {
      systemInstruction: `Você é um capelão sábio e gentil.`,
    }
  });
  return response.text;
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
