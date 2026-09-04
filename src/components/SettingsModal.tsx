import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, CheckCircle2, Sliders, HardDrive, Palette, RefreshCw } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Storage } from '../plugins';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, saveAppSettings, triggerScan } = useLibrary();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [storageUri, setStorageUri] = useState<string>('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setStorageUri(settings.music_directory || '');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handlePickStorage = async () => {
    try {
      const result = await Storage.pickFolder();
      setStorageUri(result.uri);
      setFormData(prev => ({ ...prev, music_directory: result.uri }));
    } catch (e) {
      console.error('Failed to pick folder:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveAppSettings(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
      if (formData.music_directory) {
        triggerScan();
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const accents = [
    { name: 'Pyracube Emerald', color: '#00E599' },
    { name: 'Cyan Glow', color: '#00D8F6' },
    { name: 'Electric Purple', color: '#A855F7' },
    { name: 'Sunset Orange', color: '#F97316' },
    { name: 'Neon Rose', color: '#F43F5E' },
    { name: 'Cyber Gold', color: '#EAB308' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-xl bg-sonora-surface border border-sonora-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-sonora-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sonora-accent/15 flex items-center justify-center text-sonora-accent">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-sonora-light">Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sonora-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Library Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sonora-accent uppercase tracking-wider">
              <HardDrive className="w-4 h-4" />
              <span>Music Library & Storage</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sonora-muted mb-1.5">
                Music Library Folder Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={storageUri}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStorageUri(val);
                    setFormData(prev => ({ ...prev, music_directory: val }));
                  }}
                  className="flex-1 bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl px-4 py-2.5 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none"
                  readOnly
                />
                <button
                  type="button"
                  onClick={handlePickStorage}
                  className="px-4 py-2.5 bg-sonora-card hover:bg-sonora-elevated border border-sonora-border text-sonora-light rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose Folder</span>
                </button>
              </div>
              <p className="text-[11px] text-sonora-muted mt-1">
                Pyracube monitors this folder and auto-organizes music inside it.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sonora-base/60 border border-sonora-border/40">
              <div>
                <h5 className="text-xs font-semibold text-sonora-light">Auto-Scan on Startup</h5>
                <p className="text-[11px] text-sonora-muted">Automatically discover newly added tracks when opening Pyracube</p>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_scan === 'true'}
                onChange={(e) => setFormData({ ...formData, auto_scan: e.target.checked ? 'true' : 'false' })}
                className="w-4 h-4 accent-sonora-accent cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sonora-accent uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>Audio Quality & Format</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-sonora-muted mb-1.5">
                  Audio Format
                </label>
                <select
                  value={formData.audio_format || 'mp3'}
                  onChange={(e) => setFormData({ ...formData, audio_format: e.target.value })}
                  className="w-full bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl px-4 py-2.5 text-sm text-sonora-light focus:outline-none"
                >
                  <option value="mp3">MP3 (Universal)</option>
                  <option value="m4a">M4A (AAC)</option>
                  <option value="flac">FLAC (Lossless)</option>
                  <option value="wav">WAV (Uncompressed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sonora-muted mb-1.5">
                  Audio Quality
                </label>
                <select
                  value={formData.audio_quality || '320k'}
                  onChange={(e) => setFormData({ ...formData, audio_quality: e.target.value })}
                  className="w-full bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl px-4 py-2.5 text-sm text-sonora-light focus:outline-none"
                >
                  <option value="320k">320 kbps (Extreme Quality)</option>
                  <option value="256k">256 kbps (High Quality)</option>
                  <option value="192k">192 kbps (Standard Quality)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appearance & Accent */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sonora-accent uppercase tracking-wider">
              <Palette className="w-4 h-4" />
              <span>Accent Glow Color</span>
            </div>

            <div className="flex items-center gap-3">
              {accents.map((acc) => {
                const isSelected = (formData.theme_accent || '#00E599').toLowerCase() === acc.color.toLowerCase();
                return (
                  <button
                    key={acc.color}
                    type="button"
                    title={acc.name}
                    onClick={() => {
                      setFormData({ ...formData, theme_accent: acc.color });
                      document.documentElement.style.setProperty('--sonora-accent', acc.color);
                      document.documentElement.style.setProperty('--sonora-accent-glow', `${acc.color}66`);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: acc.color }}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-sonora-base" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sonora-accent uppercase tracking-wider">
              <HardDrive className="w-4 h-4" />
              <span>Storage Status</span>
            </div>

            <div className="p-3 rounded-xl bg-sonora-base/60 border border-sonora-border/40">
              {storageUri && (
                <button
                  type="button"
                  onClick={async () => {
                    const result = await Storage.getStorageStats({ uri: storageUri });
                    alert(`Total: ${(result.total / 1e9).toFixed(1)} GB\nFree: ${(result.free / 1e9).toFixed(1)} GB`);
                  }}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sonora-elevated flex items-center justify-center text-sonora-accent">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-sonora-light">Selected Storage</p>
                      <p className="text-[10px] text-sonora-muted truncate max-w-xs">{storageUri}</p>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-sonora-muted" />
                </button>
              )}
              {!storageUri && (
                <p className="text-xs text-sonora-muted">No storage location selected</p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-sonora-border/60 flex items-center justify-between bg-sonora-base/40">
          <div>
            {success && (
              <span className="text-xs text-sonora-accent flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:bg-white/10 text-sonora-muted hover:text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-sonora-accent/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};