import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, XCircle, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { DownloadJob } from '../plugins';
import { Download as DownloadPlugin } from '../plugins';

export const DownloadsView: React.FC = () => {
  const { downloads, refreshDownloads } = useLibrary();
  const [localDownloads, setLocalDownloads] = useState<DownloadJob[]>(downloads);

  useEffect(() => {
    setLocalDownloads(downloads);
  }, [downloads]);

  useEffect(() => {
    const loadDownloads = async () => {
      const result = await DownloadPlugin.getDownloads();
      setLocalDownloads(result.downloads);
    };
    loadDownloads();
  }, []);

  const handleCancel = async (id: number) => {
    await DownloadPlugin.cancelDownload({ id });
    refreshDownloads();
  };

  const handleRetry = async (id: number) => {
    await DownloadPlugin.retryDownload({ id });
    refreshDownloads();
  };

  const handleClearCompleted = async () => {
    await DownloadPlugin.clearCompleted();
    refreshDownloads();
  };

  const activeDownloads = localDownloads.filter(d => 
    ['queued', 'downloading', 'converting', 'tagging', 'processing'].includes(d.status)
  );

  const completedDownloads = localDownloads.filter(d => 
    ['completed', 'failed', 'cancelled'].includes(d.status)
  );

  const getStatusBadge = (job: DownloadJob) => {
    switch (job.status) {
      case 'queued':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold text-[10px] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Queued</span>
          </span>
        );
      case 'downloading':
        return (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 font-semibold text-[10px] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Downloading {job.progress}%</span>
          </span>
        );
      case 'converting':
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 font-semibold text-[10px] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'tagging':
        return (
          <span className="px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-400 font-semibold text-[10px] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Tagging</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Complete</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 font-semibold text-[10px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 font-semibold text-[10px]">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-sonora-border/40">
        <div>
          <p className="text-[11px] font-bold text-sonora-accent uppercase tracking-widest">
            DOWNLOAD MANAGER
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Downloads
          </h1>
          <p className="text-xs text-sonora-muted mt-1">
            {activeDownloads.length} active • {completedDownloads.length} history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedDownloads.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sonora-card hover:bg-sonora-elevated border border-sonora-border/60 text-xs font-semibold text-sonora-muted hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sonora-card hover:bg-sonora-elevated border border-sonora-border/60 text-xs font-semibold text-sonora-muted hover:text-white transition-colors"
            disabled
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>New Import (M11)</span>
          </button>
        </div>
      </div>

      {/* Active Downloads Section */}
      {activeDownloads.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
            In Progress ({activeDownloads.length})
          </h3>

          <div className="space-y-2.5">
            {activeDownloads.map((job: DownloadJob) => (
              <div
                key={job.id}
                className="p-3.5 rounded-2xl bg-sonora-card border border-sonora-border/80 shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-sonora-elevated flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-sonora-muted truncate">
                        {job.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(job)}
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="p-1.5 text-sonora-muted hover:text-rose-400 transition-colors"
                      title="Cancel download"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-sonora-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sonora-accent to-teal-300 transition-all duration-300"
                      style={{ width: `${Math.max(5, job.progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-sonora-muted font-mono">
                    <span>Speed: {job.speed || '--'}</span>
                    <span>ETA: {job.eta || '--'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed / History Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
          Completed & Past Imports
        </h3>

        <div className="space-y-2">
          {completedDownloads.map((job: DownloadJob) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-3 rounded-xl bg-sonora-card/60 border border-sonora-border/40 hover:bg-sonora-card transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-sonora-elevated flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-sonora-light truncate">
                    {job.title}
                  </h4>
                  <p className="text-[11px] text-sonora-muted truncate">
                    {job.artist} {job.errorMessage ? `• Error: ${job.errorMessage}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(job)}
                {job.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(job.id)}
                    className="p-1.5 text-sonora-muted hover:text-sonora-accent transition-colors"
                    title="Retry download"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {localDownloads.length === 0 && (
            <div className="py-16 text-center text-sonora-muted space-y-3 bg-sonora-card/30 rounded-2xl border border-sonora-border/30 p-8">
              <Download className="w-12 h-12 mx-auto text-sonora-muted/30" />
              <p className="text-sm font-semibold text-sonora-light">No downloads yet</p>
              <p className="text-xs text-sonora-muted">Import feature coming in M11</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};