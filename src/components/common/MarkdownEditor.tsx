import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Code,
  List,
  Quote,
  Eye,
  Edit3,
  Columns,
  Link as LinkIcon,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onWikilinkClick?: (targetId: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write notes in Markdown...',
  minHeight = '250px',
  onWikilinkClick,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');

  const insertSnippet = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end);
    const replacement = `${prefix}${selection || 'text'}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
    }, 10);
  };

  // Convert wikilinks [[id]] into custom link or text for rendering
  const processedMarkdown = value.replace(/\[\[(.*?)\]\]/g, (_, target) => {
    return `[${target}](#wikilink:${target})`;
  });

  return (
    <div className="flex flex-col border border-obsidian-border rounded-md bg-obsidian-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#17171a] border-b border-obsidian-border text-xs text-obsidian-muted select-none">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => insertSnippet('**', '**')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('*', '*')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('`', '`')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-3 bg-obsidian-border mx-1" />
          <button
            type="button"
            onClick={() => insertSnippet('\n- ')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Unordered list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('\n> ')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Quote block"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('![Image](', ')')}
            className="p-1 hover:text-white hover:bg-obsidian-hover rounded transition-colors"
            title="Insert image (![Image](url))"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('[[', ']]')}
            className="px-1.5 py-0.5 font-mono text-[11px] text-purple-400 hover:text-purple-300 hover:bg-obsidian-hover rounded transition-colors"
            title="Insert Obsidian Wikilink [[entity-id]]"
          >
            [[wikilink]]
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-0.5 bg-[#121214] p-0.5 rounded border border-obsidian-borderSubtle">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-2 py-0.5 flex items-center space-x-1 rounded text-[11px] transition-colors ${
              mode === 'edit' ? 'bg-obsidian-accent text-white font-medium' : 'hover:text-white'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-2 py-0.5 flex items-center space-x-1 rounded text-[11px] transition-colors ${
              mode === 'split' ? 'bg-obsidian-accent text-white font-medium' : 'hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2 py-0.5 flex items-center space-x-1 rounded text-[11px] transition-colors ${
              mode === 'preview' ? 'bg-obsidian-accent text-white font-medium' : 'hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight }}>
        {/* Textarea */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`flex-1 flex flex-col ${mode === 'split' ? 'border-r border-obsidian-border' : ''}`}>
            <textarea
              id="markdown-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full flex-1 p-3 bg-transparent font-mono text-[13px] text-obsidian-text focus:outline-none resize-none leading-relaxed placeholder:text-obsidian-dim"
              style={{ minHeight }}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className="flex-1 p-4 overflow-y-auto bg-[#151518] markdown-body select-text"
            style={{ minHeight }}
          >
            {value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    if (href?.startsWith('#wikilink:')) {
                      const target = href.replace('#wikilink:', '');
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onWikilinkClick) onWikilinkClick(target);
                          }}
                          className="inline-flex items-center text-purple-400 hover:text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded text-xs border border-purple-800/60 font-mono no-underline"
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {processedMarkdown}
              </ReactMarkdown>
            ) : (
              <p className="text-obsidian-dim italic text-xs">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
