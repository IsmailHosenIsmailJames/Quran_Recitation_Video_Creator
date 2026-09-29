import React, { useState } from 'react';
import { X, Film, CheckCircle2, AlertCircle, Folder, Download } from 'lucide-react';
import { RenderProgress } from '../types';
import { save } from '@tauri-apps/plugin-dialog';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExport: (resolution: string, fps: number, outputPath: string) => void;
  renderProgress: RenderProgress | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onStartExport,
  renderProgress,
}) => {
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [outputPath, setOutputPath] = useState('quran_recitation_video.mp4');

  if (!isOpen) return null;

  const handleBrowseOutputPath = async () => {
    try {
      const selected = await save({
        defaultPath: 'quran_recitation_video.mp4',
        filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
      });
      if (selected) {
        setOutputPath(selected);
      }
    } catch (e) {
      console.warn('Save dialog error:', e);
    }
  };

  const isRendering = renderProgress?.status === 'rendering' || renderProgress?.status === 'preparing';
  const isCompleted = renderProgress?.status === 'completed';
  const isError = renderProgress?.status === 'error';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Film className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Export Quran Video</h3>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!isRendering && !isCompleted && (
            <>
              {/* Resolution */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  Export Resolution
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: '1080p', label: '1080p Full HD', desc: 'Recommended' },
                    { id: '4k', label: '4K Ultra HD', desc: 'High Bitrate' },
                    { id: '720p', label: '720p HD', desc: 'Smaller File' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setResolution(res.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        resolution === res.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{res.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{res.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  Framerate (FPS)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: 30, label: '30 FPS', desc: 'Standard' },
                    { val: 24, label: '24 FPS', desc: 'Cinematic' },
                    { val: 60, label: '60 FPS', desc: 'Smooth' },
                  ].map((f) => (
                    <button
                      key={f.val}
                      onClick={() => setFps(f.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        fps === f.val
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{f.label}</p>
                      <p className="text-[10px] text-slate-500">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Path */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Save Destination
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleBrowseOutputPath}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Progress State */}
          {isRendering && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Rendering Video...</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {renderProgress?.message || 'Processing frames...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-200"
                  style={{ width: `${renderProgress?.percent || 0}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono px-1">
                <span>{renderProgress?.fps ? `${renderProgress.fps.toFixed(1)} FPS` : ''}</span>
                <span>{Math.round(renderProgress?.percent || 0)}%</span>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Export Successful!</h4>
              <p className="text-xs text-slate-400">
                Your recitation video has been rendered and saved.
              </p>
              <p className="text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-300 break-all">
                {renderProgress?.outputPath || outputPath}
              </p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="py-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Rendering Error</h4>
              <p className="text-xs text-rose-300 font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
                {renderProgress?.message || 'FFmpeg failed to encode video.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex justify-end space-x-3">
          {!isRendering && !isCompleted && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onStartExport(resolution, fps, outputPath)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Start Render</span>
              </button>
            </>
          )}

          {isCompleted && (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
            >
              Done
            </button>
          )}

          {isError && (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
