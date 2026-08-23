import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Copy, Download, RefreshCw, X, FileText, Database, Plus, Layers, Compass, MapPin } from 'lucide-react';
import { LLM_ROUTES_KNOWLEDGE, saveLLMRoutesToStorage } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES, CAMPUS_EDGES, saveCampusGraphToStorage } from '../data/campusGraphData';
import { synthesizeCampusCorpusWithGemini } from '../services/geminiCorpusSynthesizer';
import { speechService } from '../services/speechService';
import { GROUND_FLOOR_CORPUS, FIRST_FLOOR_CORPUS } from '../data/corpuses';
import { CAMPUS_LANDMARKS, CampusLandmark } from '../data/landmarksData';
import { getNodesForFloor } from '../data/nodes';

interface AdminPortalViewProps {
  onClose: () => void;
  onRouteAdded?: (newRoute?: any) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose }) => {
  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [floorCorpusMap, setFloorCorpusMap] = useState<Record<number, string>>({
    1: GROUND_FLOOR_CORPUS.trim(),
    2: FIRST_FLOOR_CORPUS.trim()
  });

  // Selected Landmark per floor
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>('landmark_floor_1_main_entrance');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisResultMsg, setSynthesisResultMsg] = useState<string | null>(null);
  const [copiedDataset, setCopiedDataset] = useState<boolean>(false);

  // Filter landmarks available for the selected floor
  const floorLandmarks: CampusLandmark[] = CAMPUS_LANDMARKS.filter(l => l.floor === selectedFloor);

  // Active landmark selected
  const activeLandmark: CampusLandmark =
    floorLandmarks.find(l => l.id === selectedLandmarkId) ||
    floorLandmarks[0] ||
    CAMPUS_LANDMARKS[0];

  // Update active landmark when floor changes
  useEffect(() => {
    const defaultForFloor = CAMPUS_LANDMARKS.find(l => l.floor === selectedFloor);
    if (defaultForFloor) {
      setSelectedLandmarkId(defaultForFloor.id);
    }
  }, [selectedFloor]);

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

  // Voice Recording STT
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

  // Synthesize Corpus for All Floors directly with Gemini AI & Save Automatically
  const handleSynthesizeAllFloorsWithGemini = async () => {
    const combinedCorpus = Object.entries(floorCorpusMap)
      .map(([floor, corpus]) => `[${floor === '1' ? 'GROUND FLOOR' : floor === '2' ? 'FIRST FLOOR' : 'FLOOR ' + floor} CORPUS]: ${corpus}`)
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

    saveCampusGraphToStorage();
    saveLLMRoutesToStorage();

    setIsSynthesizing(false);
    setSynthesisResultMsg(result.summaryText + ' 💾 Saved automatically to your device!');
    speechService.speak('Floor-wise dataset synthesized directly from raw corpuses and saved!');
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
      saveCampusGraphToStorage();
      saveLLMRoutesToStorage();
      setFloorCorpusMap({ 1: GROUND_FLOOR_CORPUS.trim(), 2: FIRST_FLOOR_CORPUS.trim() });
      setSynthesisResultMsg('All datasets reset to default floor corpuses.');
    }
  };

  const mappedFloorNodes = getNodesForFloor(selectedFloor);

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
              Admin Portal — Landmark-Anchored Data Collection
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Floor Selection • Landmark Position Mapping • Spoken Walk Corpuses
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
        
        {/* 1. FLOOR SELECTOR TABS & ADD FLOOR BUTTON */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              Select Floor for Data Collection:
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
                {f === 1 ? 'Ground Floor (Floor 1)' : f === 2 ? 'First Floor (Floor 2)' : `Floor ${f}`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. FETCH FLOOR LANDMARKS & STARTING LANDMARK SELECTOR */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Floor {selectedFloor} Available Landmarks (from landmarks.json):
            </span>
          </div>

          {/* Landmark Dropdown Selector */}
          <select
            value={selectedLandmarkId}
            onChange={(e) => setSelectedLandmarkId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {floorLandmarks.map((l) => (
              <option key={l.id} value={l.id}>
                📍 {l.name} ({l.building} • Floor {l.floor})
              </option>
            ))}
          </select>

          {/* Selected Landmark Facing Orientation Instructions */}
          {activeLandmark && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                <Compass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Starting Position & Facing Orientation Rule:</span>
              </div>
              <p className="text-xs font-bold text-amber-100">
                👉 <strong>{activeLandmark.name}</strong>: "{activeLandmark.facingOrientation}"
              </p>
            </div>
          )}
        </div>

        {/* 3. SPOKEN VOICE AUDIO RECORDER CONTROLLER */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-blue-500" />
              Record Spoken Walk Corpus from {activeLandmark.name}
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
              <span>{isRecording ? 'Stop Recording' : `🎙️ Record Walk from ${activeLandmark.name}`}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition-all"
              title="Reset to Default Corpuses"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. SPOKEN CORPUS TEXT AREA FOR SELECTED FLOOR */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              {selectedFloor === 1 ? 'Ground Floor' : selectedFloor === 2 ? 'First Floor' : `Floor ${selectedFloor}`} Walk Corpus Text (from {activeLandmark.name}):
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Editable Raw Corpus</span>
          </label>
          <textarea
            rows={5}
            value={floorCorpusMap[selectedFloor] || ''}
            onChange={(e) => setFloorCorpusMap({ ...floorCorpusMap, [selectedFloor]: e.target.value })}
            placeholder={`Speak or type ${selectedFloor === 1 ? 'Ground Floor' : selectedFloor === 2 ? 'First Floor' : 'Floor ' + selectedFloor} walk description starting from ${activeLandmark.name}...`}
            className="w-full p-3.5 rounded-2xl border border-slate-700 text-xs font-medium text-slate-100 bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner leading-relaxed"
          />
        </div>

        {/* 5. MAPPED POSITIONS FROM LANDMARK (floorNodes) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Mapped Positions for Floor {selectedFloor} (from {activeLandmark.name}):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mappedFloorNodes.map(node => (
              <div key={node.id} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center justify-between">
                <span className="truncate">{node.name}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">{node.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GEMINI AI SYNTHESIZE DIRECTLY FROM CORPUSES BUTTON */}
        <button
          disabled={isSynthesizing}
          onClick={handleSynthesizeAllFloorsWithGemini}
          className="w-full py-4 px-5 rounded-2xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span>{isSynthesizing ? 'Extracting Step-by-Step Navigation from Corpuses...' : '✨ Synthesize Direct Navigation Routes from Corpuses with Gemini AI'}</span>
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
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Anchor Landmarks</span>
            <span className="text-xl font-black text-amber-400">{CAMPUS_LANDMARKS.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Mapped Nodes</span>
            <span className="text-xl font-black text-blue-400">{mappedFloorNodes.length}</span>
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
