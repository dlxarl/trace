import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Folder,
  FolderOpen,
  Download,
  RefreshCw,
  Trash2,
  Sliders,
  Layers,
  Keyboard,
  HardDrive,
  Check,
} from 'lucide-react';
import { Workspace } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace?: Workspace | null;
  activeProjectId?: string;
  isDesktop?: boolean;
  onSelectDirectory?: () => void;
  onOpenInExplorer?: (projectId?: string) => void;
  onExportZip: () => void;
  onRebuildIndex: () => void;
  onOpenShortcuts: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  activeProjectId,
  isDesktop = false,
  onSelectDirectory,
  onOpenInExplorer,
  onExportZip,
  onRebuildIndex,
  onOpenShortcuts,
}) => {
  const [physicsBounce, setPhysicsBounce] = useState<boolean>(() => {
    return localStorage.getItem('trace_settings_physics') !== 'false';
  });
  const [defaultLayout, setDefaultLayout] = useState<string>(() => {
    return localStorage.getItem('trace_settings_layout') || 'cose';
  });
  const [auraGlow, setAuraGlow] = useState<boolean>(() => {
    return localStorage.getItem('trace_settings_aura') !== 'false';
  });
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhysicsToggle = () => {
    const next = !physicsBounce;
    setPhysicsBounce(next);
    localStorage.setItem('trace_settings_physics', String(next));
  };

  const handleAuraToggle = () => {
    const next = !auraGlow;
    setAuraGlow(next);
    localStorage.setItem('trace_settings_aura', String(next));
  };

  const handleLayoutChange = (layout: string) => {
    setDefaultLayout(layout);
    localStorage.setItem('trace_settings_layout', layout);
  };

  const handleClearData = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#18181f] border border-obsidian-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-border bg-[#141419]/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Application Settings</h2>
              <p className="text-[11px] text-obsidian-dim">Configure graph physics, storage, and preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-obsidian-dim hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* File System & Explorer Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted flex items-center space-x-2">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace & File System</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white flex items-center space-x-2">
                    <span>{isDesktop ? 'Working Directory' : 'Browser Offline Storage'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      trace
                    </span>
                  </div>
                  <div
                    className="text-[11px] text-obsidian-dim mt-1 truncate font-mono bg-black/30 px-2 py-1 rounded border border-white/5 select-all"
                    title={workspace?.workspacePath || workspace?.name || 'Documents/trace'}
                  >
                    {workspace?.workspacePath || workspace?.name || '~/Documents/trace'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  {isDesktop && onSelectDirectory && (
                    <button
                      type="button"
                      onClick={onSelectDirectory}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center space-x-1.5 text-xs font-medium transition-all"
                      title="Choose working directory"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>Change Folder</span>
                    </button>
                  )}

                  {onOpenInExplorer && (
                    <button
                      type="button"
                      onClick={() => onOpenInExplorer(activeProjectId)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5 text-xs font-medium transition-all shadow-sm"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isDesktop ? 'Show in Finder' : 'Download Project ZIP'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={onExportZip}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center space-x-1.5 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full Project (.zip)</span>
                </button>

                <button
                  type="button"
                  onClick={onRebuildIndex}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center space-x-1.5 text-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rebuild SQLite FTS Index</span>
                </button>
              </div>
            </div>
          </div>

          {/* Graph Visualization & Physics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Graph & Physics</span>
            </h3>

            <div className="space-y-2">
              {/* Physics Bounce Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <div className="text-xs font-medium text-white">Interactive Repulsion Physics</div>
                  <div className="text-[11px] text-obsidian-dim">
                    Nearby nodes gently bounce and repel away when dragging an entity
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePhysicsToggle}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    physicsBounce ? 'bg-indigo-600 justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* Aura Glow Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <div className="text-xs font-medium text-white">Circular Glowing Aura on Hover</div>
                  <div className="text-[11px] text-obsidian-dim">
                    Soft circular glow highlighting nodes without square background boxes
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAuraToggle}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    auraGlow ? 'bg-indigo-600 justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* Default Layout */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <div className="text-xs font-medium text-white">Default Graph Layout</div>
                  <div className="text-[11px] text-obsidian-dim">Algorithm used when opening projects</div>
                </div>
                <div className="flex items-center space-x-1">
                  {['cose', 'concentric', 'breadthfirst'].map((layout) => (
                    <button
                      key={layout}
                      type="button"
                      onClick={() => handleLayoutChange(layout)}
                      className={`px-2 py-1 text-xs rounded-md uppercase font-mono transition-colors ${
                        defaultLayout === layout
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Productivity & Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted flex items-center space-x-2">
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span>Keyboard & Navigation</span>
            </h3>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Keyboard Shortcuts Cheat Sheet</div>
                <div className="text-[11px] text-obsidian-dim">View all hotkeys for quick access</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShortcuts();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center space-x-1.5 text-xs font-medium transition-colors"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>View Shortcuts (?)</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400/80 flex items-center space-x-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-rose-200">Reset Local Application Cache</div>
                <div className="text-[11px] text-rose-400/70">
                  Clears local storage and re-seeds default sample project
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearData}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  resetConfirm
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                }`}
              >
                {resetConfirm ? 'Click to Confirm Reset' : 'Reset Storage'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-obsidian-border bg-[#141419]/80 flex items-center justify-between">
          <div className="flex flex-col select-text min-w-0 pr-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-zinc-300">Trace</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {__APP_VERSION__}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center space-x-1 truncate max-w-sm sm:max-w-md">
              <span className="shrink-0">sha256:</span>
              <span
                className="text-zinc-400 select-all font-mono truncate"
                title={typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev-local'}
              >
                {typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev-local'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
