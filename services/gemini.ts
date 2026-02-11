import { GoogleGenerativeAI } from "@google/generative-ai"; //
import { SOP, LogEntry } from "../types"; //

// Menggunakan API_KEY yang sudah didefinisikan di vite.config.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); 

export const askOperatorAssistant = async (
  query: string,
  contextSOPs: SOP[], // Perbaikan penulisan variabel agar konsisten
  recentLogs: LogEntry[]
): Promise<string> => {
  try {
    const sopsText = contextSOPs.map(s => `[${s.category}] ${s.title}: ${s.content.join(' ')}`).join('\n'); //
    
    const logsText = recentLogs.slice(0, 3).map(l => {
        const unitsInfo = Object.entries(l.units).map(([uName, data]) => 
            `${uName}: ${data.loadMW}MW, ${data.voltageKV}kV, ${data.steamInletBar}Bar (${data.status})`
        ).join(' | '); //
        return `[${l.timestamp}] Shift ${l.shift} by ${l.groupName}: ${unitsInfo}. Note: ${l.notes}`;
    }).join('\n'); //

    const prompt = `
      Anda adalah Asisten Senior Operator Pembangkit Listrik yang cerdas dan berpengalaman.
      
      Konteks SOP (Standard Operating Procedures):
      ${sopsText}

      Laporan Log Terakhir:
      ${logsText}

      Pertanyaan User: "${query}"

      Jawablah dengan ringkas, teknis, dan profesional dalam Bahasa Indonesia. Jika pertanyaan berkaitan dengan prosedur, rujuk ke SOP yang tersedia. Jika berkaitan dengan analisa, gunakan data log terakhir.
    `; //

    // Menggunakan model gemini-1.5-flash yang lebih stabil dan tersedia
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Maaf, saya tidak dapat memproses permintaan saat ini."; //
  } catch (error) {
    console.error("Gemini API Error:", error); //
    return "Terjadi kesalahan saat menghubungi server AI. Pastikan API Key valid."; //
  }
};