import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Copy, Download, RefreshCw, X, FileText, Database } from 'lucide-react';
import { LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES, CAMPUS_EDGES } from '../data/campusGraphData';
import { synthesizeCampusCorpusWithGemini } from '../services/geminiCorpusSynthesizer';
import { speechService } from '../services/speechService';

interface AdminPortalViewProps {
  onClose: () => void;
  onRouteAdded?: (newRoute?: any) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [corpusText, setCorpusText] = useState<string>(
    'Start from main entrance of building. Go 10 steps straight you will find a junction. We will turn left and walk 30 steps to get stairs. Climb stairs upward to second floor. Walk 10 steps ahead to reach Data Science Lab. Turn left and walk 20 steps to reach AI Research Center.'
  );
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisResultMsg, setSynthesisResultMsg] = useState<string | null>(null);
  const [copiedDataset, setCopiedDataset] = useState<boolean>(false);

  // Live Recording Timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Voice Speech-to-Text Recording Engine
  const handleToggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. You can type or paste the spoken transcript text directly below!');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        if (transcript.trim()) {
          setCorpusText(prev => prev + ' ' + transcript.trim());
        }
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    }
  };

  // Synthesize Corpus with Gemini AI
  const handleSynthesizeWithGemini = async () => {
    if (!corpusText.trim()) return;
    setIsSynthesizing(true);
    setSynthesisResultMsg(null);

    const result = await synthesizeCampusCorpusWithGemini(corpusText);

    // Merge generated nodes, edges, and routes into live dataset arrays
    result.nodes.forEach(node => {
      if (!CAMPUS_NODES.some(n => n.id === node.id)) {
        CAMPUS_NODES.push(node);
      }
    });

    result.edges.forEach(edge => {
      if (!CAMPUS_EDGES.some(e => e.id === edge.id)) {
        CAMPUS_EDGES.push(edge);
      }
    });

    result.routes.forEach(route => {
      if (!LLM_ROUTES_KNOWLEDGE.some(r => r.id === route.id)) {
        LLM_ROUTES_KNOWLEDGE.push(route);
      }
    });

    setIsSynthesizing(false);
    setSynthesisResultMsg(result.summaryText);
    speechService.speak('Dataset synthesized successfully with Gemini AI!');
  };

  // Generate Export Code for dataset schema rules
  const generateExportCode = () => {
    return `// =================================================================
// SMART AI CAMPUS NAVIGATION - LIVE FIELD DATASET EXPORT
// Generated on: ${new Date().toISOString()}
// =================================================================

export const EXTRACTED_NODES = ${JSON.stringify(CAMPUS_NODES, null, 2)};

export const EXTRACTED_EDGES = ${JSON.stringify(CAMPUS_EDGES, null, 2)};

export const EXTRACTED_ROUTES = ${JSON.stringify(LLM_ROUTES_KNOWLEDGE, null, 2)};
`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateExportCode());
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2500);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([generateExportCode()], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus_field_dataset_${Date.now()}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (confirm('Clear all recorded nodes, edges, and routes?')) {
      CAMPUS_NODES.length = 0;
      CAMPUS_EDGES.length = 0;
      LLM_ROUTES_KNOWLEDGE.length = 0;
      setCorpusText('');
      setSynthesisResultMsg('All datasets cleared! Ready for new spoken campus recording.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-l3">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-l2 text-base sm:text-lg font-black leading-none text-white">
                Admin Panel — Voice Corpus & Gemini AI Synthesizer
              </h3>
              <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                Record natural spoken walks & generate floor-wise spatial graphs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* VOICE AUDIO RECORDER CONTROL */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-blue-600" />
                Spoken Walk Voice Recorder
              </span>
              {isRecording && (
                <span className="text-xs font-black text-rose-600 animate-pulse flex items-center gap-1">
                  ● Recording Audio ({recordingTime}s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleRecording}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Stop Recording' : '🎙️ Record Spoken Campus Route'}</span>
              </button>

              <button
                onClick={handleClearAll}
                className="p-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold active:scale-95 transition-all"
                title="Clear Corpus & Dataset"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SPOKEN CORPUS TEXT AREA */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Spoken Campus Walk Corpus Text:
              </span>
              <span className="text-[10px] font-semibold text-slate-600">Editable Transcript</span>
            </label>
            <textarea
              rows={4}
              value={corpusText}
              onChange={(e) => setCorpusText(e.target.value)}
              placeholder="Speak or type campus walk description: Start from main entrance... go 10 steps straight... turn left... take stairs up to 2nd floor..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
            />
          </div>

          {/* GEMINI AI SYNTHESIZE BUTTON */}
          <button
            disabled={isSynthesizing || !corpusText.trim()}
            onClick={handleSynthesizeWithGemini}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{isSynthesizing ? 'Synthesizing Spatial Graph with Gemini AI...' : '✨ Synthesize Floor-Wise Dataset with Gemini AI'}</span>
          </button>

          {/* SYNTHESIS RESULT NOTIFICATION BANNER */}
          {synthesisResultMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{synthesisResultMsg}</span>
            </div>
          )}

          {/* LIVE DATASET STATS */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">Atomic Nodes</span>
              <span className="text-lg font-black text-[#1d4ed8]">{CAMPUS_NODES.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">Graph Edges</span>
              <span className="text-lg font-black text-[#1d4ed8]">{CAMPUS_EDGES.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">LLM Routes</span>
              <span className="text-lg font-black text-[#1d4ed8]">{LLM_ROUTES_KNOWLEDGE.length}</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER EXPORT ACTION CONTROLS */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={handleCopyCode}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>{copiedDataset ? 'Copied to Clipboard!' : 'Copy TS Code'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download .ts File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
