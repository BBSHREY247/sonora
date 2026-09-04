import React, { useState } from 'react';
import { X, ListMusic, Plus } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Library } from '../plugins';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose }) => {
  const { createNewPlaylist, openPlaylistDetail } = useLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const plId = await createNewPlaylist(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
      // Refresh playlists and open the newly created one
      const updated = await Library.getPlaylistSongs({ playlistId: plId });
      openPlaylistDetail(updated);
    } catch (e) {
      console.error('Error creating playlist:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-sonora-surface border border-sonora-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sonora-accent/15 flex items-center justify-center text-sonora-accent">
              <ListMusic className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-sonora-light">New Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sonora-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sonora-muted mb-1.5">
              Playlist Name
            </label>
            <input
              type="text"
              placeholder="e.g. Chill Beats, Late Night Vibes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl px-4 py-2.5 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sonora-muted mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Give your playlist a cool description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-sonora-base border border-sonora-border focus:border-sonora-accent rounded-xl px-4 py-2.5 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:bg-white/10 text-sonora-muted hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-sonora-accent text-sonora-base font-bold text-xs hover:bg-sonora-accentHover disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-sonora-accent/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
