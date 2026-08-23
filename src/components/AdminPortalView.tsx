import React, { useState, useEffect } from 'react';
import { Mic, MicOff, CheckCircle2, Copy, Download, X, FileText, Database, Plus, Layers, Compass, Save } from 'lucide-react';
import { speechService } from '../services/speechService';
import { CAMPUS_LANDMARKS, CampusLandmark } from '../data/landmarksData';
import {
  loadMainDataMarkdownText,
  saveMainDataMarkdownText,
  appendEntryToMainDataMarkdown,
  parseMainDataMarkdown
} from '../data/maindataService';

interface AdminPortalViewProps {
  onClose: () => void;
  onRouteAdded?: (newRoute?: any) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose, onRouteAdded }) => {
  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  // Form State: Destination & Path Description
  const [destinationInput, setDestinationInput] = useState<string>('');
  const [pathInput, setPathInput] = useState<string>('');

  // Live maindata.md Text State
  const [mainDataMdText, setMainDataMdText] = useState<string>('');

  // Live Custom Gemini API Key State
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Selected Landmark per floor
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>('landmark_floor_1_main_entrance');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [synthesisResultMsg, setSynthesisResultMsg] = useState<string | null>(null);
  const [copiedDataset, setCopiedDataset] = useState<boolean>(false);

  // Load live maindata.md text and custom API key on mount
  useEffect(() => {
    setMainDataMdText(loadMainDataMarkdownText());
    try {
      const savedKey = localStorage.getItem('GEMINI_API_KEY_CUSTOM');
      if (savedKey) setCustomApiKey(savedKey);
    } catch (e) {
      console.warn('Notice reading custom API key:', e);
    }
  }, []);

  const handleSaveApiKey = () => {
    try {
      localStorage.setItem('GEMINI_API_KEY_CUSTOM', customApiKey.trim());
      setSynthesisResultMsg(customApiKey.trim() ? '✅ Saved Gemini API Key to website storage!' : 'Cleared custom Gemini API Key.');
      speechService.speak('Gemini API key updated!');
    } catch (e) {
      console.warn('Notice saving custom API key:', e);
    }
  };

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

  // Voice Recording STT into Path Description input
  const handleToggleRecording = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const success = speechService.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            setPathInput(prev => (prev + ' ' + transcript).trim());
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
  };

  // APPEND ROUTE TO maindata.md IN FORMAT: Landmark to Destination - Path
  const handleSaveRoute = () => {
    if (!destinationInput.trim()) {
      alert('Please enter a Destination name!');
      return;
    }
    if (!pathInput.trim()) {
      alert('Please write or record a Path description!');
      return;
    }

    const updatedMd = appendEntryToMainDataMarkdown(
      activeLandmark.name,
      destinationInput.trim(),
      pathInput.trim()
    );

    setMainDataMdText(updatedMd);
    setSynthesisResultMsg(`✅ Appended "${activeLandmark.name} to ${destinationInput.trim()} - Path" to maindata.md!`);
    speechService.speak(`Appended route to ${destinationInput.trim()} in main data markdown!`);

    if (onRouteAdded) {
      onRouteAdded();
    }

    // Reset form
    setDestinationInput('');
    setPathInput('');
  };

  // Direct manual save of maindata.md editor content
  const handleSaveEditorContent = () => {
    saveMainDataMarkdownText(mainDataMdText);
    setSynthesisResultMsg('✅ Saved updated `maindata.md` to website storage!');
    speechService.speak('Saved maindata.md to website storage!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mainDataMdText);
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([mainDataMdText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maindata_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parsedRoutes = parseMainDataMarkdown(mainDataMdText);

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
              Admin Portal — Live `maindata.md` Landmark Editor
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Format: <strong className="text-amber-400">Landmark to Destination (combined by 'or' / 'and') - Path</strong>
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
              Select Active Floor:
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

        {/* 2. LANDMARK SELECTION & ORIENTATION BANNER */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Starting Landmark for Floor {selectedFloor}:
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
                <span>Starting Position & Facing Orientation:</span>
              </div>
              <p className="text-xs font-bold text-amber-100">
                👉 <strong>{activeLandmark.name}</strong>: "{activeLandmark.facingOrientation}"
              </p>
            </div>
          )}
        </div>

        {/* 3. DESTINATION NAME INPUT & PATH DESCRIPTION INPUT FORM */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Append Landmark Route Entry to `maindata.md`:
          </span>

          {/* Destination Input Field */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Destination Name:
            </label>
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="e.g. Data Science Lab, Washroom, AI Research Center"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Path Description Input Field & Voice Recorder */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                Path Description from {activeLandmark.name}:
              </label>
              <button
                onClick={handleToggleRecording}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700'
                }`}
              >
                {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isRecording ? `Recording (${recordingTime}s)` : 'Record Voice'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="e.g. Move straight 15 steps. Move left. Move straight 14 steps. Move straight 10 steps. Destination reached."
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner leading-relaxed"
            />
          </div>

          {/* APPEND BUTTON */}
          <button
            onClick={handleSaveRoute}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Append Entry: "{activeLandmark.name} to {destinationInput || 'Destination'} - Path" ➔</span>
          </button>
        </div>

        {/* 3.5. LIVE GEMINI AI API KEY CONFIGURATION */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Live Gemini AI API Key (Saved in Browser Storage):
            </span>
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all"
            >
              <Save className="w-3 h-3" />
              <span>Save Key</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="Paste your Google Gemini AI API key here (AIzaSy...)"
              className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {customApiKey && (
              <button
                onClick={() => { setCustomApiKey(''); localStorage.removeItem('GEMINI_API_KEY_CUSTOM'); setSynthesisResultMsg('Cleared API key.'); }}
                className="px-2.5 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            💡 Enables live Gemini AI API intent reasoning directly on GitHub Pages! Your key stays saved in your own browser's <code className="text-emerald-400">localStorage</code>.
          </p>
        </div>

        {/* 4. LIVE maindata.md TEXT AREA EDITOR ON WEBSITE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Website Live `maindata.md` File Editor:
            </label>
            <button
              onClick={handleSaveEditorContent}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all"
            >
              <Save className="w-3 h-3" />
              <span>Save `maindata.md`</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={mainDataMdText}
            onChange={(e) => setMainDataMdText(e.target.value)}
            placeholder="# Smart Campus Main Landmark Data&#10;&#10;<!-- Format per line: Landmark to Destination - Path -->&#10;Main Entrance to Data Science Lab - Move straight 15 steps. Move left. Move straight 14 steps. Move straight 10 steps. Destination reached."
            className="w-full p-3.5 rounded-2xl border border-slate-700 font-mono text-xs text-amber-300 bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner leading-relaxed"
          />
        </div>

        {/* NOTIFICATION BANNER */}
        {synthesisResultMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{synthesisResultMsg}</span>
          </div>
        )}

        {/* 5. PARSED ROUTES STATS & LIST */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
            Parsed Routes in `maindata.md` ({parsedRoutes.length}):
          </span>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {parsedRoutes.map((route) => (
              <div key={route.id} className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>📍 {route.startLandmark} ➔ 🎯 {route.destination}</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-900 text-amber-200">
                    Floor {route.floor} • {route.atomicSteps.length} Atomic Steps
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Path: "{route.pathDescription}"
                </p>
              </div>
            ))}
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
          <span>{copiedDataset ? 'Copied Markdown!' : 'Copy Markdown'}</span>
        </button>

        <button
          onClick={handleDownloadMarkdown}
          className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Download `maindata.md`</span>
        </button>
      </div>
    </div>
  );
};
