import React, { useState, useEffect } from 'react';
import { SearchResult } from '@/types';
import { EntityIcon } from '@/components/common/EntityIcon';
import {
  Search,
  Layers,
  Share2,
  Globe,
  FileText,
  FolderKanban,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';

interface SearchViewProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelectResult: (result: SearchResult) => void;
  initialQuery?: string;
}

export const SearchView: React.FC<SearchViewProps> = ({
  onSearch,
  onSelectResult,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await onSearch(query);
        if (active) setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  // Group by type
  const entityResults = results.filter((r) => r.type === 'entity');
  const relResults = results.filter((r) => r.type === 'relationship');
  const sourceResults = results.filter((r) => r.type === 'source');
  const noteResults = results.filter((r) => r.type === 'note');
  const projectResults = results.filter((r) => r.type === 'project');

  return (
    <div className="h-full flex flex-col bg-obsidian-panel overflow-y-auto">
      {/* Header Search Box */}
      <div className="sticky top-0 z-10 px-8 py-5 bg-obsidian-panel/95 backdrop-blur border-b border-obsidian-border">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#141416] border border-obsidian-border rounded-lg shadow-subtle px-3 py-2.5">
            <Search className="w-5 h-5 text-obsidian-muted mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across entities, aliases, attributes, evidence, notes..."
              className="bg-transparent flex-1 text-sm text-obsidian-text focus:outline-none placeholder:text-obsidian-dim"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-obsidian-dim hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-obsidian-dim mt-2 px-1">
            <span>Powered by local SQLite full-text index</span>
            <span>{results.length} total matches</span>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="p-8 max-w-3xl w-full mx-auto space-y-6">
        {isLoading && (
          <div className="text-center py-8 text-xs text-obsidian-muted animate-pulse">
            Querying local SQLite database...
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12 text-sm text-obsidian-dim space-y-2">
            <div>No matching records found for "{query}".</div>
            <div className="text-xs">Try searching by entity alias, IP address, tag, or domain.</div>
          </div>
        )}

        {/* Entities Group */}
        {entityResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-obsidian-muted tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Entities ({entityResults.length})</span>
            </div>
            <div className="space-y-1.5">
              {entityResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectResult(item)}
                  className="p-3 bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors shadow-subtle flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-obsidian-text">{item.title}</span>
                      <span className="text-[11px] font-mono text-obsidian-dim">{item.id}</span>
                    </div>
                    <div className="text-xs text-obsidian-muted">{item.subtitle}</div>
                    {item.snippet && (
                      <div className="text-xs text-obsidian-dim font-mono bg-[#141416] p-1.5 rounded border border-obsidian-borderSubtle">
                        {item.snippet}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-obsidian-dim" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships Group */}
        {relResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-obsidian-muted tracking-wider flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Relationships ({relResults.length})</span>
            </div>
            <div className="space-y-1.5">
              {relResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectResult(item)}
                  className="p-3 bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors shadow-subtle flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-obsidian-text">{item.title}</span>
                      <span className="text-[11px] font-mono text-obsidian-dim">{item.id}</span>
                    </div>
                    <div className="text-xs text-obsidian-muted">{item.subtitle}</div>
                    {item.snippet && (
                      <div className="text-xs text-obsidian-dim font-mono bg-[#141416] p-1.5 rounded border border-obsidian-borderSubtle">
                        {item.snippet}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-obsidian-dim" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Group */}
        {sourceResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-obsidian-muted tracking-wider flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sources & Evidence ({sourceResults.length})</span>
            </div>
            <div className="space-y-1.5">
              {sourceResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectResult(item)}
                  className="p-3 bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors shadow-subtle flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-obsidian-text">{item.title}</span>
                      <span className="text-[11px] font-mono text-obsidian-dim">{item.id}</span>
                    </div>
                    <div className="text-xs text-obsidian-muted">{item.subtitle}</div>
                    {item.snippet && (
                      <div className="text-xs text-obsidian-dim font-mono bg-[#141416] p-1.5 rounded border border-obsidian-borderSubtle">
                        {item.snippet}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-obsidian-dim" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Group */}
        {noteResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-obsidian-muted tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Notes ({noteResults.length})</span>
            </div>
            <div className="space-y-1.5">
              {noteResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectResult(item)}
                  className="p-3 bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors shadow-subtle flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-obsidian-text">{item.title}</span>
                      <span className="text-[11px] font-mono text-obsidian-dim">{item.id}</span>
                    </div>
                    <div className="text-xs text-obsidian-muted">{item.subtitle}</div>
                    {item.snippet && (
                      <div className="text-xs text-obsidian-dim font-mono bg-[#141416] p-1.5 rounded border border-obsidian-borderSubtle">
                        {item.snippet}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-obsidian-dim" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
