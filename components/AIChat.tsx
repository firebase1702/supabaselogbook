import React, { useState } from 'react';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { SOP, LogEntry } from '../types';
import { askOperatorAssistant } from '../services/gemini';

interface AIChatProps {
  sops: SOP[];
  logs: LogEntry[];
}

const AIChat: React.FC<AIChatProps> = ({ sops, logs }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setAnswer(null);

    const response = await askOperatorAssistant(query, sops, logs);
    
    setAnswer(response);
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg text-white p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
             <Bot className="w-8 h-8 text-blue-100" />
          </div>
          <h2 className="text-2xl font-bold">AI Operator Assistant</h2>
        </div>
        <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
          Tanyakan tentang prosedur SOP, troubleshooting, atau analisa data log terakhir. AI akan membantu memberikan referensi teknis.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleAsk} className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: Bagaimana langkah menangani trip turbin? atau Apakah ada anomali pada log terakhir?"
            className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900 placeholder:text-slate-400 min-h-[100px]"
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        {answer && (
          <div className="mt-8 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-slate-800">Jawaban AI</h3>
            </div>
            <div className="prose prose-slate bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 text-slate-700 leading-relaxed whitespace-pre-line">
              {answer}
            </div>
          </div>
        )}

        <div className="mt-8">
           <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contoh Pertanyaan</h4>
           <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuery("Jelaskan prosedur Cold Start untuk turbin.")} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-600 transition-colors">
                Start Turbin Dingin
              </button>
              <button onClick={() => setQuery("Apa penyebab temperatur boiler naik pada log terakhir?")} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-600 transition-colors">
                Analisa Log Terakhir
              </button>
              <button onClick={() => setQuery("Apa langkah safety untuk penggantian filter oli?")} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-600 transition-colors">
                Safety Filter Oli
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
