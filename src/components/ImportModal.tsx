import React, { useState } from 'react';
import { X, Search, Download, CheckSquare, Square, AlertCircle, Sparkles, Loader2, Music } from 'lucide-react';
import { api } from '../services/api';
import { useLibrary } from '../context/LibraryContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { setActiveView, refreshDownloads } = useLibrary();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isQueueing, setIsQueueing] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await api.analyzeImportUrl(url.trim());
      setAnalysisResult(data);
      // Select all by default
      const allIds = new Set<string>(data.items.map((i: any) => i.id));
      setSelectedItemIds(allIds);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze URL. Please check the link.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelectAll = () => {
    if (!analysisResult) return;
    if (selectedItemIds.size === analysisResult.items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(analysisResult.items.map((i: any) => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!analysisResult || selectedItemIds.size === 0) return;

    setIsQueueing(true);
    try {
      const selectedItems = analysisResult.items.filter((i: any) => selectedItemIds.has(i.id));
      await api.queueDownloads(selectedItems);
      await refreshDownloads();
      onClose();
      setActiveView('downloads');
    } catch (err: any) {
      setError(err.message || 'Failed to queue downloads');
    } finally {
      setIsQueueing(false);
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-sonora-surface border border-sonora-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-sonora-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sonora-accent/15 flex items-center justify-center text-sonora-accent">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-sonora-light">Import Audio</h3>
              <p className="text-xs text-sonora-muted">
                Extract high-quality audio & metadata from authorized media
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sonora-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* URL Input Form */}
          <form onSubmit={handleAnalyze} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-sonora-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste YouTube video or playlist link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                className="w-full bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !url.trim()}
              className="px-5 py-2.5 rounded-xl bg-sonora-accent text-sonora-base font-bold text-sm hover:bg-sonora-accentHover disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-sonora-accent/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results View */}
          {analysisResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between bg-sonora-card p-3 rounded-xl border border-sonora-border/60">
                <div>
                  <h4 className="text-sm font-semibold text-sonora-light">
                    {analysisResult.title}
                  </h4>
                  <p className="text-xs text-sonora-muted">
                    {analysisResult.is_playlist ? 'Playlist detected' : 'Single video detected'} • {analysisResult.count} {analysisResult.count === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
                {analysisResult.is_playlist && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs text-sonora-accent font-medium hover:underline"
                  >
                    {selectedItemIds.size === analysisResult.items.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {analysisResult.items.map((item: any) => {
                  const isSelected = selectedItemIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-sonora-accent/10 border-sonora-accent/30 text-sonora-light'
                          : 'bg-sonora-base/60 border-sonora-border/40 text-sonora-muted hover:bg-sonora-base'
                      }`}
                    >
                      <button className="text-sonora-accent flex-shrink-0">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>

                      <div className="w-12 h-8 rounded-lg overflow-hidden bg-sonora-elevated flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                            <Music className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-sonora-light">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-sonora-muted truncate">
                          {item.artist}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono text-sonora-muted">
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-sonora-border/60 flex items-center justify-between bg-sonora-base/40">
          <p className="text-[11px] text-sonora-muted">
            Files are automatically tagged and saved to your local library
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:bg-white/10 text-sonora-muted hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!analysisResult || selectedItemIds.size === 0 || isQueueing}
              className="px-5 py-2 rounded-xl bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-sonora-accent/20"
            >
              {isQueueing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Import Selected ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
