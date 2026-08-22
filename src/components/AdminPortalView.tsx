import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Copy, Download, RefreshCw, X, FileText, Database, Plus, Layers } from 'lucide-react';
import { LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES, CAMPUS_EDGES } from '../data/campusGraphData';
import { synthesizeCampusCorpusWithGemini } from '../services/geminiCorpusSynthesizer';
import { speechService } from '../services/speechService';

interface AdminPortalViewProps {
  onClose: () => void;
  onRouteAdded?: (newRoute?: any) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose }) => {
  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [floorCorpusMap, setFloorCorpusMap] = useState<Record<number, string>>({
    1: 'Start from main entrance of building. Go 10 steps straight you will find a junction. We will turn left and walk 30 steps to get stairs. Climb stairs upward to second floor.',
    2: 'Arrived at second floor via stairs. Walk 10 steps ahead to reach Data Science Lab. Turn left and walk 20 steps to reach AI Research Center.'
  });

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
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

  // Robust Non-Glitching Voice Speech-to-Text STT using SpeechHandler
  const handleToggleRecording = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const success = speechService.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            setFloorCorpusMap(prev => {
              const currentText = prev[selectedFloor] || '';
              return {
                ...prev,
                [selectedFloor]: (currentText + ' ' + transcript).trim()
              };
            });
          }
        },
        (err) => {
          console.warn('STT Notice:', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (!success) {
        setIsRecording(false);
      }
    }
  };

  const handleAddFloor = () => {
    const nextFloor = Math.max(...floors, 0) + 1;
    setFloors(prev => [...prev, nextFloor]);
    setSelectedFloor(nextFloor);
    setFloorCorpusMap(prev => ({ ...prev, [nextFloor]: '' }));
  };

  // Synthesize Corpus for All Floors with Gemini AI
  const handleSynthesizeAllFloorsWithGemini = async () => {
    const combinedCorpus = Object.entries(floorCorpusMap)
      .map(([floor, corpus]) => `[FLOOR ${floor} CORPUS]: ${corpus}`)
      .join('\n\n');

    if (!combinedCorpus.trim()) return;
    setIsSynthesizing(true);
    setSynthesisResultMsg(null);

    const result = await synthesizeCampusCorpusWithGemini(combinedCorpus);

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
    speechService.speak('Floor-wise dataset synthesized successfully with Gemini AI!');
  };

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
      setFloorCorpusMap({ 1: '' });
      setSynthesisResultMsg('All datasets cleared! Ready for new floor-wise recordings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden font-l3">
      
      {/* FULL SCREEN HEADER */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-l2 text-base sm:text-lg font-black text-white leading-none">
              Admin Portal — Floor-Wise Voice Corpus Synthesizer
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Record spoken routes per floor & extract spatial graph JSON with Gemini AI
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      {/* FULL SCREEN BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 max-w-4xl mx-auto w-full">
        
        {/* FLOOR SELECTOR TABS & ADD FLOOR BUTTON */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              Select Active Building Floor:
            </span>
            <button
              onClick={handleAddFloor}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1 shadow active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Floor</span>
            </button>
          </div>

          {/* Floor Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {floors.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 ${
                  selectedFloor === f
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                Floor {f} {f === 0 ? '(Ground Floor)' : f === 1 ? '(1st Floor)' : f === 2 ? '(2nd Floor)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* SPOKEN VOICE AUDIO RECORDER CONTROLLER */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-blue-500" />
              Floor {selectedFloor} Voice Audio Recorder
            </span>
            {isRecording && (
              <span className="text-xs font-black text-rose-400 animate-pulse flex items-center gap-1">
                ● Recording Audio ({recordingTime}s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleRecording}
              className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : `🎙️ Record Voice for Floor ${selectedFloor}`}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition-all"
              title="Clear Corpus & Dataset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SPOKEN CORPUS TEXT AREA FOR SELECTED FLOOR */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              Floor {selectedFloor} Spoken Walk Corpus:
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Editable Transcript</span>
          </label>
          <textarea
            rows={5}
            value={floorCorpusMap[selectedFloor] || ''}
            onChange={(e) => setFloorCorpusMap({ ...floorCorpusMap, [selectedFloor]: e.target.value })}
            placeholder={`Speak or type Floor ${selectedFloor} walk description: Start from main entrance... go 10 steps straight... turn left... take stairs up...`}
            className="w-full p-3.5 rounded-2xl border border-slate-700 text-xs font-medium text-slate-100 bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
          />
        </div>

        {/* GEMINI AI SYNTHESIZE ALL FLOORS BUTTON */}
        <button
          disabled={isSynthesizing}
          onClick={handleSynthesizeAllFloorsWithGemini}
          className="w-full py-4 px-5 rounded-2xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span>{isSynthesizing ? 'Extracting Floor-Wise Graph with Gemini AI...' : '✨ Extract Floor Graph & Routes with Gemini AI'}</span>
        </button>

        {/* SYNTHESIS RESULT NOTIFICATION BANNER */}
        {synthesisResultMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{synthesisResultMsg}</span>
          </div>
        )}

        {/* LIVE DATASET STATS */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Atomic Nodes</span>
            <span className="text-xl font-black text-blue-400">{CAMPUS_NODES.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Graph Edges</span>
            <span className="text-xl font-black text-blue-400">{CAMPUS_EDGES.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">LLM Routes</span>
            <span className="text-xl font-black text-blue-400">{LLM_ROUTES_KNOWLEDGE.length}</span>
          </div>
        </div>
      </div>

      {/* FULL SCREEN FOOTER EXPORT ACTIONS */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
        <button
          onClick={handleCopyCode}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow border border-slate-700"
        >
          <Copy className="w-4 h-4 text-blue-400" />
          <span>{copiedDataset ? 'Copied to Clipboard!' : 'Copy TS Code'}</span>
        </button>

        <button
          onClick={handleDownloadJSON}
          className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Download .ts File</span>
        </button>
      </div>
    </div>
  );
};
