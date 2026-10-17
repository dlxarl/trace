import React, { useState, useEffect, useRef } from 'react';
import {
  Entity,
  EntityType,
  ENTITY_TYPES,
  ProjectData,
} from '@/types';
import { EntityIcon, getEntityTypeColor } from '@/components/common/EntityIcon';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MapModal } from '@/components/modals/MapModal';
import {
  Save,
  Trash2,
  Plus,
  X,
  ArrowRight,
  Layers,
  MapPin,
  Upload,
  Image as ImageIcon,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

interface EntityEditorProps {
  entity: Entity;
  projectData: ProjectData;
  onSave: (entity: Entity) => void;
  onDelete: (entityId: string) => void;
  onOpenEntity: (entityId: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
  onCreateRelationship: (sourceId: string) => void;
  onShowInGraph: (entityId: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface AttributePreset {
  key: string;
  label: string;
  placeholder: string;
  category: string;
}

const ATTRIBUTE_PRESETS: AttributePreset[] = [
  { key: 'phone', label: 'Phone Number', placeholder: '+1 (555) 000-0000', category: 'Contact' },
  { key: 'email', label: 'Email Address', placeholder: 'subject@domain.com', category: 'Contact' },
  { key: 'address', label: 'Physical Address', placeholder: '123 Main St, City, Country', category: 'Location' },
  { key: 'location', label: 'City / Region', placeholder: 'London, United Kingdom', category: 'Location' },
  { key: 'coordinates', label: 'GPS Coordinates', placeholder: '51.5074° N, 0.1278° W', category: 'Location' },
  { key: 'website', label: 'Website URL', placeholder: 'https://example.com', category: 'Online' },
  { key: 'telegram', label: 'Telegram Handle', placeholder: '@username or channel', category: 'Social' },
  { key: 'twitter', label: 'Twitter / X', placeholder: '@handle', category: 'Social' },
  { key: 'ip', label: 'IP Address', placeholder: '192.168.1.1', category: 'Network' },
  { key: 'asn', label: 'Autonomous System', placeholder: 'AS12345', category: 'Network' },
  { key: 'passport', label: 'Passport / ID', placeholder: 'AB1234567', category: 'Identity' },
  { key: 'tax_id', label: 'Tax / Company Reg', placeholder: 'REG-98765432', category: 'Identity' },
  { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD', category: 'Identity' },
  { key: 'employer', label: 'Employer / Organization', placeholder: 'Acme Corp', category: 'Work' },
  { key: 'job_title', label: 'Role / Job Title', placeholder: 'Lead Engineer / Director', category: 'Work' },
  { key: 'crypto_wallet', label: 'Crypto Wallet', placeholder: '0x... or bc1...', category: 'Finance' },
  { key: 'iban', label: 'IBAN / Bank Account', placeholder: 'GB29 XXXXX...', category: 'Finance' },
];

export const EntityEditor: React.FC<EntityEditorProps> = ({
  entity,
  projectData,
  onSave,
  onDelete,
  onOpenEntity,
  onOpenRelationship,
  onCreateRelationship,
  onShowInGraph,
  onDirtyChange,
}) => {
  const [draft, setDraft] = useState<Entity>({ ...entity });
  const [aliasInput, setAliasInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [newAttrKey, setNewAttrKey] = useState<string>('');
  const [newAttrVal, setNewAttrVal] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Photo & Map modal state
  const [photoUrlInputOpen, setPhotoUrlInputOpen] = useState<boolean>(false);
  const [photoUrlValue, setPhotoUrlValue] = useState<string>('');
  const [mapModalOpen, setMapModalOpen] = useState<boolean>(false);
  const [mapLocationQuery, setMapLocationQuery] = useState<string>('');

  // Autocomplete dropdown state
  const [attrDropdownOpen, setAttrDropdownOpen] = useState<boolean>(false);
  const attrInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft({ ...entity });
    setIsDirty(false);
    onDirtyChange?.(false);
  }, [entity]);

  const updateDraft = (updates: Partial<Entity>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
    onDirtyChange?.(true);
  };

  const handleSave = () => {
    onSave(draft);
    setIsDirty(false);
    onDirtyChange?.(false);
  };

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateDraft({
        attributes: {
          ...draft.attributes,
          photo: result,
        },
      });
    };
    reader.readAsDataURL(file);
    if (photoFileInputRef.current) photoFileInputRef.current.value = '';
  };

  const handleApplyPhotoUrl = () => {
    if (!photoUrlValue.trim()) return;
    updateDraft({
      attributes: {
        ...draft.attributes,
        photo: photoUrlValue.trim(),
      },
    });
    setPhotoUrlValue('');
    setPhotoUrlInputOpen(false);
  };

  const handleRemovePhoto = () => {
    const nextAttrs = { ...draft.attributes };
    delete nextAttrs.photo;
    delete nextAttrs.image;
    delete nextAttrs.avatar;
    updateDraft({ attributes: nextAttrs });
  };

  const entityPhoto = draft.attributes.photo || draft.attributes.image || draft.attributes.avatar;

  // Aliases & Tags
  const addAlias = () => {
    if (!aliasInput.trim()) return;
    if (!draft.aliases.includes(aliasInput.trim())) {
      updateDraft({ aliases: [...draft.aliases, aliasInput.trim()] });
    }
    setAliasInput('');
  };

  const removeAlias = (alias: string) => {
    updateDraft({ aliases: draft.aliases.filter((a) => a !== alias) });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (!draft.tags.includes(tagInput.trim())) {
      updateDraft({ tags: [...draft.tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateDraft({ tags: draft.tags.filter((t) => t !== tag) });
  };

  // Attributes
  const addAttribute = () => {
    if (!newAttrKey.trim()) return;
    updateDraft({
      attributes: {
        ...draft.attributes,
        [newAttrKey.trim()]: newAttrVal.trim(),
      },
    });
    setNewAttrKey('');
    setNewAttrVal('');
    setAttrDropdownOpen(false);
  };

  const selectAttrPreset = (preset: AttributePreset) => {
    setNewAttrKey(preset.key);
    setAttrDropdownOpen(false);
    if (!newAttrVal) {
      setNewAttrVal('');
    }
  };

  const removeAttribute = (key: string) => {
    const nextAttrs = { ...draft.attributes };
    delete nextAttrs[key];
    updateDraft({ attributes: nextAttrs });
  };

  const updateAttributeVal = (key: string, val: string) => {
    updateDraft({
      attributes: {
        ...draft.attributes,
        [key]: val,
      },
    });
  };

  // Filter attribute presets for Google-like dropdown
  const filteredPresets = ATTRIBUTE_PRESETS.filter((p) => {
    const query = newAttrKey.toLowerCase().trim();
    if (!query) return true;
    return (
      p.key.toLowerCase().includes(query) ||
      p.label.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  // Check if an attribute is a location/address
  const isLocationAttribute = (key: string) => {
    const lk = key.toLowerCase();
    return (
      lk.includes('address') ||
      lk.includes('location') ||
      lk.includes('city') ||
      lk.includes('country') ||
      lk.includes('coord') ||
      lk.includes('geo')
    );
  };

  const openMapForLocation = (locationQuery: string) => {
    setMapLocationQuery(locationQuery);
    setMapModalOpen(true);
  };

  // Connected relationships
  const outgoingRels = projectData.relationships.filter((r) => r.source_entity === entity.id);
  const incomingRels = projectData.relationships.filter((r) => r.target_entity === entity.id);

  const getEntityName = (id: string) => {
    const found = projectData.entities.find((e) => e.id === id);
    return found ? found.name : id;
  };

  const color = getEntityTypeColor(draft.type);

  return (
    <div className="h-full flex flex-col bg-obsidian-panel overflow-y-auto">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 bg-obsidian-panel/95 backdrop-blur border-b border-obsidian-border">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Avatar / Photo or Type Icon */}
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border shadow-sm shrink-0 relative group"
            style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, color }}
          >
            {entityPhoto ? (
              <img src={entityPhoto} alt={draft.name} className="w-full h-full object-cover" />
            ) : (
              <EntityIcon type={draft.type} size={22} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-obsidian-dim truncate">{draft.id}</span>
              {isDirty && (
                <span className="text-[10px] bg-amber-950/80 border border-amber-800 text-amber-300 px-1.5 py-0.2 rounded font-medium shrink-0">
                  Unsaved changes
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold text-obsidian-text leading-tight truncate">{draft.name}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => onShowInGraph(draft.id)}
            className="px-2.5 py-1.5 flex items-center space-x-1.5 text-xs bg-obsidian-hover hover:bg-[#2c2c36] text-obsidian-text border border-obsidian-border rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Show in Graph</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-3 py-1.5 flex items-center space-x-1.5 text-xs rounded-lg font-medium transition-colors ${
              isDirty
                ? 'bg-obsidian-accent hover:bg-obsidian-accentHover text-white shadow-sm'
                : 'bg-obsidian-card text-obsidian-dim cursor-not-allowed border border-obsidian-border'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Entity</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(draft.id)}
            className="p-1.5 text-obsidian-dim hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete Entity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Core Properties Card */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-xl p-5 space-y-4 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">Core Properties & Photo</h2>
              <p className="text-xs text-obsidian-dim">Essential identity and avatar metadata</p>
            </div>

            {/* Photo Actions */}
            <div className="flex items-center gap-2">
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs bg-[#1f1f26] hover:bg-[#282832] text-zinc-200 border border-obsidian-border rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoUrlInputOpen(!photoUrlInputOpen)}
                className="px-2.5 py-1 text-xs bg-[#1f1f26] hover:bg-[#282832] text-zinc-200 border border-obsidian-border rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Photo URL</span>
              </button>

              {entityPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/30 border border-rose-800/40 rounded-lg transition-colors"
                  title="Remove photo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Photo URL Input Bar */}
          {photoUrlInputOpen && (
            <div className="flex items-center gap-2 p-2 bg-[#16161c] border border-obsidian-border rounded-lg animate-in fade-in duration-100">
              <input
                type="text"
                value={photoUrlValue}
                onChange={(e) => setPhotoUrlValue(e.target.value)}
                placeholder="Paste image URL (https://...)..."
                className="flex-1 px-3 py-1 bg-[#101014] border border-obsidian-border rounded text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleApplyPhotoUrl}
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setPhotoUrlInputOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
            </div>

            {/* Entity Type */}
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1.5">
                Entity Type *
              </label>
              <select
                value={draft.type}
                onChange={(e) => updateDraft({ type: e.target.value as EntityType })}
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent cursor-pointer"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.type} value={t.type} className="bg-[#18181c]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {draft.type === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1.5">
                Custom Type Label
              </label>
              <input
                type="text"
                value={draft.custom_type || ''}
                onChange={(e) => updateDraft({ custom_type: e.target.value })}
                placeholder="e.g. Crypto Wallet, Vehicle, Weapon..."
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
            </div>
          )}

          {/* Quick Map Button if type is location */}
          {draft.type === 'location' && (
            <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-300 text-xs">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>This entity is a Location. View on interactive map:</span>
              </div>
              <button
                type="button"
                onClick={() => openMapForLocation(draft.name)}
                className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-md transition-colors"
              >
                Open Map
              </button>
            </div>
          )}

          {/* Aliases */}
          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1.5">
              Aliases & Known Handles
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {draft.aliases.map((alias) => (
                <span
                  key={alias}
                  className="px-2 py-0.5 rounded-full text-xs bg-[#1f1f26] border border-obsidian-border text-obsidian-text flex items-center space-x-1"
                >
                  <span>{alias}</span>
                  <button
                    type="button"
                    onClick={() => removeAlias(alias)}
                    className="hover:text-rose-400 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {draft.aliases.length === 0 && (
                <span className="text-xs text-obsidian-dim italic">No aliases defined yet</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add alias (e.g. handle, username, former name)..."
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                className="flex-1 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
              <button
                type="button"
                onClick={addAlias}
                className="px-3 py-1.5 text-xs bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1.5">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-purple-950/60 border border-purple-800 text-purple-300 flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-400 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {draft.tags.length === 0 && (
                <span className="text-xs text-obsidian-dim italic">No tags defined yet</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add tag (e.g. priority, unverified, suspect)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-1.5 text-xs bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Structured Attributes Section with Autocomplete & Map Integration */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-xl p-5 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-obsidian-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">Structured Attributes</h2>
              <p className="text-xs text-obsidian-dim">
                Key-value metadata fields with autocomplete suggestions & map coordinates
              </p>
            </div>
          </div>

          {/* Attribute rows */}
          <div className="space-y-2.5">
            {Object.entries(draft.attributes).map(([k, v]) => {
              if (k === 'photo' || k === 'image' || k === 'avatar') return null;
              const hasMap = isLocationAttribute(k);

              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-1/3 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg font-mono text-xs text-obsidian-muted truncate">
                    {k}
                  </span>
                  <input
                    type="text"
                    value={String(v)}
                    onChange={(e) => updateAttributeVal(k, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
                  />
                  {hasMap && String(v).trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => openMapForLocation(String(v))}
                      className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg flex items-center space-x-1 text-xs transition-colors shrink-0"
                      title="View on Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttribute(k)}
                    className="p-1.5 text-obsidian-dim hover:text-rose-400 rounded-lg transition-colors shrink-0"
                    title="Remove attribute"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {Object.keys(draft.attributes).filter((k) => k !== 'photo' && k !== 'image' && k !== 'avatar').length === 0 && (
              <p className="text-xs text-obsidian-dim italic py-1">No custom attributes added yet.</p>
            )}
          </div>

          {/* Add attribute row with Google-search-like Autocomplete Dropdown */}
          <div className="relative pt-3 border-t border-obsidian-borderSubtle">
            <div className="flex items-center gap-2">
              <div className="relative w-1/3">
                <input
                  ref={attrInputRef}
                  type="text"
                  placeholder="Key (e.g. phone, address)..."
                  value={newAttrKey}
                  onFocus={() => setAttrDropdownOpen(true)}
                  onChange={(e) => {
                    setNewAttrKey(e.target.value);
                    setAttrDropdownOpen(true);
                  }}
                  className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
                />

                {/* Floating Autocomplete Dropdown */}
                {attrDropdownOpen && filteredPresets.length > 0 && (
                  <div className="absolute top-9 left-0 right-0 z-30 bg-[#191922] border border-[#2e2e3f] rounded-xl shadow-2xl p-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Attribute Presets</span>
                      <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                    </div>
                    {filteredPresets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => selectAttrPreset(preset)}
                        className="w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-white/10 transition-colors text-xs group"
                      >
                        <div className="truncate">
                          <span className="font-mono text-purple-300 font-medium">{preset.key}</span>
                          <span className="text-zinc-400 text-[11px] ml-1.5 truncate">({preset.label})</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono group-hover:text-zinc-300">
                          {preset.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Value..."
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                className="flex-1 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />

              <button
                type="button"
                onClick={addAttribute}
                className="px-3.5 py-1.5 flex items-center space-x-1.5 text-xs bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded-lg transition-colors font-medium shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Markdown Findings & Evidence Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">Markdown Findings & Analysis</h2>
              <p className="text-xs text-obsidian-dim">
                Investigation notes, findings, and wikilink references for this entity
              </p>
            </div>
          </div>
          <MarkdownEditor
            value={draft.markdownBody}
            onChange={(val) => updateDraft({ markdownBody: val })}
            onWikilinkClick={(target) => {
              const match = projectData.entities.find((e) => e.id === target || e.name === target);
              if (match) onOpenEntity(match.id);
            }}
          />
        </div>

        {/* Connected Relationships Section */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-xl p-5 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-obsidian-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">Connected Relationships</h2>
              <p className="text-xs text-obsidian-dim">
                Explicit graph relationships involving {draft.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateRelationship(draft.id)}
              className="px-3 py-1.5 flex items-center space-x-1.5 text-xs bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Relationship</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outgoing */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-obsidian-muted uppercase flex items-center space-x-1.5">
                <ArrowRight className="w-3 h-3 text-sky-400" />
                <span>Outgoing Claims ({outgoingRels.length})</span>
              </span>
              {outgoingRels.length > 0 ? (
                <div className="space-y-1.5">
                  {outgoingRels.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onOpenRelationship(rel.id)}
                      className="p-2.5 bg-[#141416] hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-xs text-purple-300 font-medium">
                          {rel.type}
                        </span>{' '}
                        <span className="text-xs text-obsidian-muted">→</span>{' '}
                        <span className="text-xs text-obsidian-text font-medium">
                          {getEntityName(rel.target_entity)}
                        </span>
                      </div>
                      <StatusBadge status={rel.status} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-obsidian-dim italic py-2">No outgoing claims</div>
              )}
            </div>

            {/* Incoming */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-obsidian-muted uppercase flex items-center space-x-1.5">
                <ArrowRight className="w-3 h-3 text-emerald-400 rotate-180" />
                <span>Incoming Claims ({incomingRels.length})</span>
              </span>
              {incomingRels.length > 0 ? (
                <div className="space-y-1.5">
                  {incomingRels.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onOpenRelationship(rel.id)}
                      className="p-2.5 bg-[#141416] hover:bg-obsidian-hover border border-obsidian-border rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="text-xs text-obsidian-text font-medium">
                          {getEntityName(rel.source_entity)}
                        </span>{' '}
                        <span className="text-xs text-obsidian-muted">→</span>{' '}
                        <span className="font-mono text-xs text-purple-300 font-medium">
                          {rel.type}
                        </span>
                      </div>
                      <StatusBadge status={rel.status} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-obsidian-dim italic py-2">No incoming claims</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Intelligence Modal */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        locationQuery={mapLocationQuery}
        title={draft.name}
      />
    </div>
  );
};
