
import { GoogleGenAI } from "@google/genai";
import { SOP, LogEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askOperatorAssistant = async (
  query: string,
  contextSOPS: SOP[],
  recentLogs: LogEntry[]
): Promise<string> => {
  try {
    const sopsText = contextSOPS.map(s => {
      let contentText = '';
      // Safely handle content based on type
      if (s.type === 'text' && Array.isArray(s.content)) {
        contentText = s.content.join(' ');
      } else if (s.type === 'pdf') {
        contentText = `(Dokumen PDF: ${s.fileName || 'Terlampir'})`;
      } else if (s.type === 'url') {
        contentText = `(Link Eksternal: ${s.linkUrl || 'Tautan'})`;
      } else {
        contentText = '(Konten tidak tersedia)';
      }
      return `[${s.category}] ${s.title}: ${contentText}`;
    }).join('\n');
    
    // Updated log formatter for new Unit structure
    const logsText = recentLogs.slice(0, 3).map(l => {
        const unitsInfo = l.units ? Object.entries(l.units).map(([uName, data]) => 
            `${uName}: ${data.loadMW}MW, ${data.voltageKV}kV, ${data.steamInletBar}Bar (${data.status})`
        ).join(' | ') : 'Data Unit Tidak Tersedia';
        return `[${l.timestamp}] Shift ${l.shift} by ${l.groupName}: ${unitsInfo}. Note: ${l.notes}`;
    }).join('\n');

    const prompt = `
      Anda adalah Asisten Senior Operator Pembangkit Listrik yang cerdas dan berpengalaman.
      
      Konteks SOP (Standard Operating Procedures):
      ${sopsText}

      Laporan Log Terakhir:
      ${logsText}

      Pertanyaan User: "${query}"

      Jawablah dengan ringkas, teknis, dan profesional dalam Bahasa Indonesia. Jika pertanyaan berkaitan dengan prosedur, rujuk ke SOP yang tersedia. Jika berkaitan dengan analisa, gunakan data log terakhir.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Maaf, saya tidak dapat memproses permintaan saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungi server AI. Pastikan API Key valid.";
  }
};
