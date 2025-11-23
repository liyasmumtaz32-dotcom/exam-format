import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question } from "../types";
import { parseQuestionsLocally } from "./localParser";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ParseResult {
  questions: Question[];
  source: 'ai' | 'local';
}

export const parseRawQuestions = async (rawText: string): Promise<ParseResult> => {
  // STRATEGY: Try AI first if Key exists. If error or no key, use Local Parser.
  
  if (!process.env.API_KEY) {
    console.log("API Key missing. Switching to Offline Mode.");
    return { questions: parseQuestionsLocally(rawText), source: 'local' };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const responseSchema: Schema = {
    type: Type.ARRAY,
    description: "List of exact exam questions extracted from text. Must preserve the exact count and content.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER, description: "The number of the question as found in the text." },
        text: { type: Type.STRING, description: "The content of the question. Keep it VERBATIM from input. Do not paraphrase or summarize." },
        type: { type: Type.STRING, enum: ["MULTIPLE_CHOICE", "ESSAY"], description: "Type of question" },
        options: {
          type: Type.ARRAY,
          description: "List of options (A-E). Ensure ALL options present in text are captured.",
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Option label (A, B, C, D, E)" },
              text: { type: Type.STRING, description: "The exact text of the option" }
            },
            required: ["label", "text"]
          }
        },
        answerKey: { type: Type.STRING, description: "The correct answer label if explicitly marked in text." },
        difficulty: { type: Type.STRING, enum: ["Mudah", "Sedang", "Sukar"], description: "Difficulty level" }
      },
      required: ["id", "text", "type", "options"]
    }
  };

  const prompt = `
    Anda adalah mesin pemroses dokumen ujian yang sangat presisi (High-Fidelity Parser).
    
    TUGAS UTAMA:
    Konversi teks soal mentah di bawah ini menjadi format JSON terstruktur.
    
    ATURAN KRUSIAL (WAJIB DIPATUHI):
    1. AKURASI MUTLAK: Jangan pernah mengubah makna, meringkas, atau membuang kata-kata penting dari soal. Salin teks apa adanya.
    2. JUMLAH SOAL: Jika input memiliki 40 nomor, output HARUS 40 nomor. Cek kembali jumlahnya.
    3. PILIHAN GANDA: Ambil semua opsi jawaban (A, B, C, D, E) dengan lengkap. Jangan ada opsi yang tertinggal.
    4. STRUKTUR: 
       - Jika opsi jawaban tertulis menyamping (misal: "a. Satu b. Dua"), pisahkan menjadi array options yang rapi.
       - Jika tidak ada opsi (A, B...), tandai sebagai ESSAY.
    5. PERBAIKAN: Hanya perbaiki typo fatal (salah ketik parah) dan spasi yang berantakan. Jangan ubah gaya bahasa guru.

    Input Raw Text:
    =========================================
    ${rawText}
    =========================================
  `;

  let attempts = 0;
  const maxAttempts = 3;
  let delay = 2000;

  try {
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No data returned from AI");

        return { questions: JSON.parse(jsonText) as Question[], source: 'ai' };

      } catch (error: any) {
        
        const errorCode = error?.code || error?.error?.code || error?.status;
        const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
        const errorStatus = error?.status || error?.error?.status;

        const isQuotaError = 
            errorCode === 429 || 
            errorStatus === 'RESOURCE_EXHAUSTED' ||
            (typeof errorMessage === 'string' && (
                errorMessage.includes('429') || 
                errorMessage.includes('quota') || 
                errorMessage.includes('RESOURCE_EXHAUSTED')
            ));

        if (isQuotaError && attempts < maxAttempts) {
          console.warn(`Quota limit hit (Attempt ${attempts}). Retrying in ${delay}ms...`);
          await wait(delay);
          delay *= 2;
          continue;
        }

        throw error;
      }
    }
  } catch (finalError) {
    console.warn("AI Generation unavailable. Switching to Local Fallback.");
    return { questions: parseQuestionsLocally(rawText), source: 'local' };
  }

  return { questions: parseQuestionsLocally(rawText), source: 'local' };
};