import React, { useState, useEffect } from 'react';
import { Tab, TabType } from '@/types';
import {
  Layers,
  Compass,
  Search,
  FileText,
  Share2,
  Globe,
  Plus,
  X,
  User,
  Pin,
  PinOff,
} from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onTogglePinTab?: (tabId: string) => void;
  onCloseOtherTabs?: (tabId: string) => void;
  onCloseTabsToRight?: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTogglePinTab,
  onCloseOtherTabs,
  onCloseTabsToRight,
}) => {
  const [tabContextMenu, setTabContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-tab-context-menu]')) {
        setTabContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTabContextMenu(null);
    };
    window.addEventListener('pointerdown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getTabIcon = (type: TabType) => {
    switch (type) {
      case 'graph':
        return <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'overview':
        return <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'entity':
        return <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'relationship':
        return <Share2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
      case 'source':
        return <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setTabContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  const currentContextTab = tabs.find((t) => t.id === tabContextMenu?.tabId);

  return (
    <div
      className="h-full flex items-center space-x-1 select-none overflow-x-auto relative flex-1 min-w-0"
      style={{ WebkitAppRegion: 'drag' as any }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isPreview = tab.isPreview && !tab.isPinned;

        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={() => onTogglePinTab?.(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            style={{ WebkitAppRegion: 'no-drag' as any }}
            className={`group h-7 px-2.5 rounded-lg flex items-center space-x-1.5 text-xs cursor-pointer border transition-all duration-150 shrink-0 ${
              tab.isPinned ? 'max-w-[140px]' : 'max-w-[210px]'
            } ${
              isActive
                ? 'bg-[#1e1e28] border-white/10 text-white font-medium shadow-xs'
                : 'border-transparent text-obsidian-dim hover:text-white hover:bg-white/5'
            } ${isPreview ? 'italic' : ''}`}
            title={`${tab.title}${isPreview ? ' (Preview - double-click to pin)' : tab.isPinned ? ' (Pinned)' : ''}`}
          >
            {getTabIcon(tab.type)}
            <span className="truncate flex-1 text-[11px]">{tab.title}</span>

            {/* Pin indicator */}
            {tab.isPinned && (
              <Pin className="w-2.5 h-2.5 text-amber-400/80 shrink-0 rotate-45" />
            )}

            {/* Dirty indicator or Close button */}
            {tab.isDirty ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
            ) : (
              tabs.length > 1 && !tab.isPinned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-white hover:bg-obsidian-hover p-0.5 rounded text-obsidian-dim transition-opacity duration-150"
                >
                  <X className="w-3 h-3" />
                </button>
              )
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewTab}
        style={{ WebkitAppRegion: 'no-drag' as any }}
        className="p-1 text-obsidian-dim hover:text-white hover:bg-[#18181c] rounded transition-colors duration-150"
        title="Open New Tab (Graph)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Tab Context Menu */}
      {tabContextMenu && tabContextMenu.visible && currentContextTab && (
        <div
          data-tab-context-menu
          className="fixed z-50 w-48 bg-[#141419]/95 backdrop-blur-xl border border-[#2e2e3d] rounded-xl shadow-2xl p-1 text-xs text-obsidian-text ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${Math.min(tabContextMenu.y, window.innerHeight - 180)}px`,
            left: `${Math.min(tabContextMenu.x, window.innerWidth - 200)}px`,
            WebkitAppRegion: 'no-drag' as any,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onTogglePinTab?.(tabContextMenu.tabId);
              setTabContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
          >
            {currentContextTab.isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Unpin Tab</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Pin Tab</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onCloseTab(tabContextMenu.tabId);
              setTabContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
            <span>Close Tab</span>
          </button>

          {onCloseOtherTabs && tabs.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onCloseOtherTabs(tabContextMenu.tabId);
                setTabContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <span>Close Other Tabs</span>
            </button>
          )}

          {onCloseTabsToRight && (
            <button
              type="button"
              onClick={() => {
                onCloseTabsToRight(tabContextMenu.tabId);
                setTabContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <span>Close Tabs to the Right</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
