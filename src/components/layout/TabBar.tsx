import React, { useState, useEffect } from 'react';
import { Tab, TabType } from '@/types';
import {
  Network,
  LayoutDashboard,
  Search,
  FileText,
  Share2,
  Link2,
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
  onReorderTabs?: (newTabs: Tab[]) => void;
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
  onReorderTabs,
}) => {
  const [tabContextMenu, setTabContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  // Drag and drop reordering state
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

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
        return <Network className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'overview':
        return <LayoutDashboard className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'entity':
        return <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'relationship':
        return <Share2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
      case 'source':
        return <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTabId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== targetId) {
      setDragOverTabId(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTabId;
    setDraggedTabId(null);
    setDragOverTabId(null);
    if (!sourceId || sourceId === targetId || !onReorderTabs) return;

    const fromIndex = tabs.findIndex((t) => t.id === sourceId);
    const toIndex = tabs.findIndex((t) => t.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const sourceTab = tabs[fromIndex];
    const newTabs = [...tabs];
    newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, sourceTab);

    // Keep pinned tabs grouped together before unpinned tabs
    const pinned = newTabs.filter((t) => t.isPinned);
    const unpinned = newTabs.filter((t) => !t.isPinned);
    onReorderTabs([...pinned, ...unpinned]);
  };

  const currentContextTab = tabs.find((t) => t.id === tabContextMenu?.tabId);

  return (
    <div
      className="h-full flex items-center space-x-1 select-none overflow-x-auto relative flex-1 min-w-0"
      style={{ WebkitAppRegion: 'drag' as any }}
      onAuxClick={(e) => {
        // Middle click on empty area opens a new tab!
        if (e.button === 1 && !(e.target as HTMLElement).closest('[data-tab-item]')) {
          e.preventDefault();
          onNewTab();
        }
      }}
      onDoubleClick={(e) => {
        // Double-click on empty area opens a new tab
        if (!(e.target as HTMLElement).closest('[data-tab-item]')) {
          onNewTab();
        }
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isPreview = tab.isPreview && !tab.isPinned;
        const isDragTarget = dragOverTabId === tab.id;
        const isBeingDragged = draggedTabId === tab.id;

        return (
          <div
            key={tab.id}
            data-tab-item="true"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={() => {
              if (dragOverTabId === tab.id) setDragOverTabId(null);
            }}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={() => {
              setDraggedTabId(null);
              setDragOverTabId(null);
            }}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onTogglePinTab?.(tab.id);
            }}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            onAuxClick={(e) => {
              // Middle-click on tab closes it!
              if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();
                onCloseTab(tab.id);
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault(); // prevent autoscroll cursor
              }
            }}
            style={{ WebkitAppRegion: 'no-drag' as any }}
            className={`group h-7 rounded-lg flex items-center text-xs cursor-pointer border transition-all duration-150 shrink-0 ${
              tab.isPinned ? 'px-2 space-x-1' : 'px-2.5 space-x-1.5 max-w-[210px]'
            } ${
              isActive
                ? 'bg-[#1e1e28] border-white/10 text-white font-medium shadow-xs'
                : 'border-transparent text-obsidian-dim hover:text-white hover:bg-white/5'
            } ${isPreview ? 'italic' : ''} ${
              isDragTarget ? 'ring-2 ring-indigo-500/80 scale-102' : ''
            } ${isBeingDragged ? 'opacity-40' : ''}`}
            title={`${tab.title}${isPreview ? ' (Preview - double-click to pin)' : tab.isPinned ? ' (Pinned)' : ''}`}
          >
            {tab.isPinned ? (
              // Pinned tab: only tab icon and pinned icon (no title text!)
              <>
                {getTabIcon(tab.type)}
                <Pin className="w-2.5 h-2.5 text-amber-400/90 shrink-0 rotate-45" />
              </>
            ) : (
              // Normal tab: icon + title + close/dirty indicator
              <>
                {getTabIcon(tab.type)}
                <span className="truncate flex-1 text-[11px]">{tab.title}</span>

                {/* Dirty indicator or Close button */}
                {tab.isDirty ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                ) : (
                  tabs.length > 1 && (
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
              </>
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
