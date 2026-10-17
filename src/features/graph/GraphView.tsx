import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  Entity,
  EntityType,
  ENTITY_TYPES,
  ProjectData,
  Relationship,
  RelationshipStatus,
  RELATIONSHIP_STATUSES,
} from '@/types';
import { EntityIcon, getEntityTypeColor, getEntityTypeLabel } from '@/components/common/EntityIcon';
import {
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Crosshair,
  Plus,
  Share2,
  Trash2,
  ExternalLink,
  Layers,
  Save,
  Copy,
  Hash,
  Sparkles,
  FileText,
  StickyNote,
  X,
} from 'lucide-react';

interface GraphViewProps {
  projectData: ProjectData;
  selectedEntityId?: string;
  selectedRelationshipId?: string;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onOpenEntity: (entityId: string) => void;
  onOpenRelationship: (relationshipId: string) => void;
  onOpenNote?: (noteId: string) => void;
  onCreateEntity: () => void;
  onCreateRelationshipFromEntity: (sourceEntityId: string) => void;
  onDeleteEntity: (entityId: string) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  initialPositions?: Record<string, { x: number; y: number }>;
  onSavePositions?: (positions: Record<string, { x: number; y: number }>) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetType: 'background' | 'node' | 'edge';
  targetId?: string;
  isNote?: boolean;
}

interface HoveredNodeState {
  id: string;
  x: number;
  y: number;
  isNote?: boolean;
}

export const GraphView: React.FC<GraphViewProps> = ({
  projectData,
  selectedEntityId,
  selectedRelationshipId,
  onSelectEntity,
  onSelectRelationship,
  onOpenEntity,
  onOpenRelationship,
  onOpenNote,
  onCreateEntity,
  onCreateRelationshipFromEntity,
  onDeleteEntity,
  onDeleteRelationship,
  onDeleteNote,
  initialPositions,
  onSavePositions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const activeLayoutRef = useRef<cytoscape.Layouts | null>(null);

  // Graph Controls State
  const [layoutName, setLayoutName] = useState<string>('cose');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const [showNotesOnGraph, setShowNotesOnGraph] = useState<boolean>(true);

  // Entity Type and Status Filters
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<EntityType>>(
    new Set(ENTITY_TYPES.map((t) => t.type))
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<RelationshipStatus>>(
    new Set(RELATIONSHIP_STATUSES.map((s) => s.status))
  );

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetType: 'background',
  });

  // Hover State & Toast
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Memoized entities/notes for context menu and hover card
  const selectedNodeEntity = useMemo(() => {
    if (contextMenu.targetType !== 'node' || !contextMenu.targetId || contextMenu.isNote) return null;
    return projectData.entities.find((e) => e.id === contextMenu.targetId) || null;
  }, [contextMenu.targetType, contextMenu.targetId, contextMenu.isNote, projectData.entities]);

  const selectedNodeNote = useMemo(() => {
    if (contextMenu.targetType !== 'node' || !contextMenu.targetId || !contextMenu.isNote) return null;
    return (projectData.notes || []).find((n) => n.id === contextMenu.targetId) || null;
  }, [contextMenu.targetType, contextMenu.targetId, contextMenu.isNote, projectData.notes]);

  const selectedEdge = useMemo(() => {
    if (contextMenu.targetType !== 'edge' || !contextMenu.targetId) return null;
    return projectData.relationships.find((r) => r.id === contextMenu.targetId) || null;
  }, [contextMenu.targetType, contextMenu.targetId, projectData.relationships]);

  const edgeSourceEntity = useMemo(() => {
    if (!selectedEdge) return null;
    const s = selectedEdge.source_entity || (selectedEdge as any).source;
    return projectData.entities.find((e) => e.id === s);
  }, [selectedEdge, projectData.entities]);

  const edgeTargetEntity = useMemo(() => {
    if (!selectedEdge) return null;
    const t = selectedEdge.target_entity || (selectedEdge as any).target;
    return projectData.entities.find((e) => e.id === t);
  }, [selectedEdge, projectData.entities]);

  const hoveredEntity = useMemo(() => {
    if (!hoveredNode || hoveredNode.isNote) return null;
    return projectData.entities.find((e) => e.id === hoveredNode.id) || null;
  }, [hoveredNode, projectData.entities]);

  const hoveredNote = useMemo(() => {
    if (!hoveredNode || !hoveredNode.isNote) return null;
    return (projectData.notes || []).find((n) => n.id === hoveredNode.id) || null;
  }, [hoveredNode, projectData.notes]);

  const hoveredEntityRelations = useMemo(() => {
    if (!hoveredEntity) return [];
    return projectData.relationships.filter(
      (r) =>
        (r.source_entity || (r as any).source) === hoveredEntity.id ||
        (r.target_entity || (r as any).target) === hoveredEntity.id
    );
  }, [hoveredEntity, projectData.relationships]);

  const hoveredEntityNotesPreview = useMemo(() => {
    if (!hoveredEntity || !hoveredEntity.markdownBody) return null;
    const cleaned = hoveredEntity.markdownBody
      .replace(/^---[\s\S]*?---\s*/, '')
      .replace(/^[#*>\-\s]+/gm, '')
      .trim();
    if (!cleaned) return null;
    return cleaned.slice(0, 110) + (cleaned.length > 110 ? '...' : '');
  }, [hoveredEntity]);

  // Global escape and outside click handlers for custom context menu
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        setHoveredNode(null);
      }
    };
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-context-menu]')) {
        setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('pointerdown', handleGlobalClick);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('pointerdown', handleGlobalClick);
    };
  }, []);

  // Build Cytoscape Elements (Entities + Notes + Relationships)
  const elements = useMemo(() => {
    // Entity nodes (with photo support)
    const entityNodes = projectData.entities
      .filter((e) => selectedEntityTypes.has(e.type) && !hiddenNodeIds.has(e.id))
      .map((entity) => {
        const color = getEntityTypeColor(entity.type);
        const savedPos = initialPositions?.[entity.id];
        const photo =
          entity.attributes?.photo || entity.attributes?.image || entity.attributes?.avatar;

        return {
          group: 'nodes' as const,
          data: {
            id: entity.id,
            label: entity.name,
            type: entity.type,
            color,
            imageUrl: photo || undefined,
            aliases: entity.aliases ? entity.aliases.join(', ') : '',
            isNote: false,
          },
          position: savedPos ? { x: savedPos.x, y: savedPos.y } : undefined,
        };
      });

    // Note nodes (if toggled on)
    const noteNodes =
      showNotesOnGraph && projectData.notes
        ? projectData.notes
            .filter((n) => !hiddenNodeIds.has(n.id))
            .map((note) => {
              const savedPos = initialPositions?.[note.id];
              return {
                group: 'nodes' as const,
                data: {
                  id: note.id,
                  label: note.title,
                  type: 'note',
                  color: '#f59e0b',
                  isNote: true,
                  aliases: '',
                },
                position: savedPos ? { x: savedPos.x, y: savedPos.y } : undefined,
              };
            })
        : [];

    const allNodes = [...entityNodes, ...noteNodes];
    const activeNodeIds = new Set(allNodes.map((n) => n.data.id));

    // Entity-to-Entity Relationships
    const entityEdges = (projectData.relationships || [])
      .filter((rel) => {
        const s = rel.source_entity || (rel as any).source;
        const t = rel.target_entity || (rel as any).target;
        return (
          activeNodeIds.has(s) &&
          activeNodeIds.has(t) &&
          (!rel.status || selectedStatuses.has(rel.status))
        );
      })
      .map((rel) => {
        const s = rel.source_entity || (rel as any).source;
        const t = rel.target_entity || (rel as any).target;
        const statusConfig = RELATIONSHIP_STATUSES.find((st) => st.status === rel.status);
        const lineColor = statusConfig ? statusConfig.color : '#38bdf8';
        const lineStyle = statusConfig ? statusConfig.borderStyle : 'solid';

        return {
          group: 'edges' as const,
          data: {
            id: rel.id,
            source: s,
            target: t,
            label: rel.type || '',
            status: rel.status || 'confirmed',
            color: lineColor,
            lineStyle,
            directed: rel.directed !== false,
            confidence: rel.confidence,
          },
        };
      });

    // Note Wikilink Mentions Edges
    const noteEdges: any[] = [];
    if (showNotesOnGraph && projectData.notes) {
      projectData.notes.forEach((note) => {
        if (!activeNodeIds.has(note.id)) return;
        const noteBody = note.markdownBody || (note as any).raw || '';
        const matches = Array.from(noteBody.matchAll(/\[\[(.*?)\]\]/g));
        matches.forEach((m: any, idx) => {
          const targetNameOrId = m[1].trim();
          const targetEntity = projectData.entities.find(
            (e) => e.id === targetNameOrId || e.name.toLowerCase() === targetNameOrId.toLowerCase()
          );
          if (targetEntity && activeNodeIds.has(targetEntity.id)) {
            noteEdges.push({
              group: 'edges' as const,
              data: {
                id: `rel-note-${note.id}-${targetEntity.id}-${idx}`,
                source: note.id,
                target: targetEntity.id,
                label: 'mentions',
                status: 'confirmed',
                color: '#f59e0b',
                lineStyle: 'dashed',
                directed: true,
              },
            });
          }
        });
      });
    }

    return [...allNodes, ...entityEdges, ...noteEdges];
  }, [
    projectData.entities,
    projectData.relationships,
    projectData.notes,
    selectedEntityTypes,
    selectedStatuses,
    hiddenNodeIds,
    showNotesOnGraph,
    initialPositions,
  ]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'ellipse',
            'background-color': '#16171d',
            'background-opacity': 0.9,
            'border-width': 2,
            'border-color': 'data(color)',
            'border-opacity': 0.6,
            'label': 'data(label)',
            'color': '#94a3b8',
            'font-size': '10px',
            'font-family': 'Inter, system-ui, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-outline-color': '#0f0f13',
            'text-outline-width': 2,
            'text-outline-opacity': 0.85,
            'width': 26,
            'height': 26,
            'overlay-opacity': 0,
            'underlay-shape': 'ellipse',
            'underlay-opacity': 0,
            'transition-property':
              'background-color, background-opacity, border-color, border-width, border-opacity, width, height, color, font-size, text-outline-width, text-outline-color',
            'transition-duration': 0.18,
          },
        },
        // Entities with photos / avatars
        {
          selector: 'node[imageUrl]',
          style: {
            'background-image': 'data(imageUrl)',
            'background-fit': 'cover',
            'background-clip': 'node',
            'background-opacity': 1,
            'border-width': 2.5,
            'border-color': 'data(color)',
            'border-opacity': 1,
            'width': 30,
            'height': 30,
          },
        },
        // Note nodes
        {
          selector: 'node[?isNote]',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#221a0e',
            'background-opacity': 0.95,
            'border-width': 2,
            'border-color': '#f59e0b',
            'border-opacity': 0.85,
            'width': 28,
            'height': 24,
            'color': '#fde68a',
            'font-size': '10px',
          },
        },
        // Hover state (pure circular glow without square box)
        {
          selector: 'node.hovered',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 1,
            'border-width': 3.5,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'width': 34,
            'height': 34,
            'color': '#ffffff',
            'font-size': '12px',
            'font-weight': 'bold',
            'text-outline-color': '#09090b',
            'text-outline-width': 3,
            'text-outline-opacity': 1,
            'underlay-shape': 'ellipse',
            'underlay-color': 'data(color)',
            'underlay-padding': 6,
            'underlay-opacity': 0.4,
            'z-index': 9999,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 1,
            'border-width': 3.5,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'width': 36,
            'height': 36,
            'underlay-shape': 'ellipse',
            'underlay-color': '#a855f7',
            'underlay-padding': 6,
            'underlay-opacity': 0.45,
            'color': '#ffffff',
            'font-weight': 'bold',
            'z-index': 1000,
          },
        },
        {
          selector: 'node.hovered-neighbor',
          style: {
            'border-width': 2.5,
            'border-color': 'data(color)',
            'border-opacity': 1,
            'background-opacity': 0.95,
            'color': '#f4f4f5',
            'font-weight': 'bold',
            'font-size': '11px',
            'z-index': 500,
          },
        },
        // Edge styles with explicit line styles (fixed)
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'data(color)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'data(color)',
            'arrow-scale': 1.1,
            'label': 'data(label)',
            'font-size': '10px',
            'font-family': 'Inter, system-ui, sans-serif',
            'color': '#cbd5e1',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.88,
            'text-background-color': '#121216',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'opacity': 0.85,
            'z-index': 10,
          },
        },
        {
          selector: 'edge[lineStyle = "dashed"]',
          style: {
            'line-style': 'dashed',
          },
        },
        {
          selector: 'edge[lineStyle = "dotted"]',
          style: {
            'line-style': 'dotted',
          },
        },
        {
          selector: 'edge[lineStyle = "solid"]',
          style: {
            'line-style': 'solid',
          },
        },
        {
          selector: 'edge[!directed]',
          style: {
            'target-arrow-shape': 'none',
          },
        },
        {
          selector: 'edge.hovered-connected',
          style: {
            'width': 3,
            'opacity': 1,
            'color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-color': '#181820',
            'font-weight': 'bold',
            'z-index': 800,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3.5,
            'opacity': 1,
            'color': '#ffffff',
            'underlay-color': '#7c3aed',
            'underlay-padding': 3,
            'underlay-opacity': 0.4,
            'z-index': 900,
          },
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.12,
            'text-opacity': 0.08,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'text-opacity': 1,
            'border-width': 3,
            'border-color': '#a855f7',
            'border-opacity': 1,
          },
        },
      ],
      layout: {
        name: 'preset',
      },
      minZoom: 0.15,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
    });

    cyRef.current = cy;

    // Interactive physics simulation on node drag (nodes bounce and repel each other)
    cy.on('drag', 'node', (evt: EventObject) => {
      const draggedNode = evt.target;
      const dpos = draggedNode.position();
      const repulsionRadius = 90;

      // Apply soft repulsive push to nearby nodes
      cy.nodes().forEach((other) => {
        if (other.id() === draggedNode.id()) return;
        const opos = other.position();
        const dx = opos.x - dpos.x;
        const dy = opos.y - dpos.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < repulsionRadius * repulsionRadius) {
          const dist = Math.sqrt(distSq);
          const push = ((repulsionRadius - dist) / repulsionRadius) * 4.5;
          other.position({
            x: opos.x + (dx / dist) * push,
            y: opos.y + (dy / dist) * push,
          });
        }
      });

      // Update hover tooltip position if dragging the hovered node
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const rpos = draggedNode.renderedPosition();
        setHoveredNode({
          id: draggedNode.id(),
          x: rect.left + rpos.x,
          y: rect.top + rpos.y,
          isNote: draggedNode.data('isNote'),
        });
      }
    });

    // Hover handlers for nodes
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target;
      const nodeId = node.id();
      const isNote = node.data('isNote');

      cy.elements().removeClass('hovered hovered-connected hovered-neighbor');

      node.addClass('hovered');
      node.connectedEdges().addClass('hovered-connected');
      node.neighborhood('node').addClass('hovered-neighbor');

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const rpos = node.renderedPosition();
        setHoveredNode({
          id: nodeId,
          x: rect.left + rpos.x,
          y: rect.top + rpos.y,
          isNote,
        });
      }
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('hovered hovered-connected hovered-neighbor');
      setHoveredNode(null);
    });

    cy.on('pan zoom', () => {
      setHoveredNode(null);
    });

    // Selection handlers
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      if (!node.data('isNote')) {
        onSelectEntity(node.id());
      }
      setContextMenu((prev) => ({ ...prev, visible: false }));
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      onSelectRelationship(edge.id());
      setContextMenu((prev) => ({ ...prev, visible: false }));
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
        if (focusedNodeId) {
          clearFocus();
        }
      }
    });

    // Double-click to open
    cy.on('dbltap', 'node', (evt: EventObject) => {
      const node = evt.target;
      if (node.data('isNote')) {
        onOpenNote?.(node.id());
      } else {
        onOpenEntity(node.id());
      }
    });

    cy.on('dbltap', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      onOpenRelationship(edge.id());
    });

    // Custom Context menu handlers
    cy.on('cxttap', 'node', (evt: EventObject) => {
      evt.originalEvent?.preventDefault();
      const node = evt.target;
      const originalEvt = evt.originalEvent as MouseEvent | undefined;
      const pos = evt.renderedPosition;
      let x = pos.x;
      let y = pos.y;
      if (originalEvt && typeof originalEvt.clientX === 'number') {
        x = originalEvt.clientX;
        y = originalEvt.clientY;
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = rect.left + pos.x;
        y = rect.top + pos.y;
      }

      setContextMenu({
        visible: true,
        x,
        y,
        targetType: 'node',
        targetId: node.id(),
        isNote: node.data('isNote'),
      });
      setHoveredNode(null);
    });

    cy.on('cxttap', 'edge', (evt: EventObject) => {
      evt.originalEvent?.preventDefault();
      const edge = evt.target;
      const originalEvt = evt.originalEvent as MouseEvent | undefined;
      const pos = evt.renderedPosition;
      let x = pos.x;
      let y = pos.y;
      if (originalEvt && typeof originalEvt.clientX === 'number') {
        x = originalEvt.clientX;
        y = originalEvt.clientY;
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = rect.left + pos.x;
        y = rect.top + pos.y;
      }

      setContextMenu({
        visible: true,
        x,
        y,
        targetType: 'edge',
        targetId: edge.id(),
      });
      setHoveredNode(null);
    });

    cy.on('cxttap', (evt: EventObject) => {
      if (evt.target === cy) {
        evt.originalEvent?.preventDefault();
        const originalEvt = evt.originalEvent as MouseEvent | undefined;
        const pos = evt.renderedPosition;
        let x = pos.x;
        let y = pos.y;
        if (originalEvt && typeof originalEvt.clientX === 'number') {
          x = originalEvt.clientX;
          y = originalEvt.clientY;
        } else if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          x = rect.left + pos.x;
          y = rect.top + pos.y;
        }

        setContextMenu({
          visible: true,
          x,
          y,
          targetType: 'background',
        });
        setHoveredNode(null);
      }
    });

    return () => {
      if (activeLayoutRef.current) {
        try {
          activeLayoutRef.current.stop();
        } catch (e) {}
        activeLayoutRef.current = null;
      }
      try {
        cy.stop();
      } catch (e) {}
      try {
        cy.destroy();
      } catch (e) {}
      cyRef.current = null;
    };
  }, []);

  // Sync elements into Cytoscape incrementally
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
    });

    const hasPreset = elements.some((el) => el.group === 'nodes' && el.position);
    if (!hasPreset && elements.length > 0) {
      runLayout(layoutName);
    } else {
      try {
        cy.fit(undefined, 40);
      } catch (e) {}
    }
  }, [elements]);

  // Sync active selection from props
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    cy.elements().unselect();
    if (selectedEntityId) {
      const node = cy.getElementById(selectedEntityId);
      if (node.nonempty()) {
        node.select();
      }
    } else if (selectedRelationshipId) {
      const edge = cy.getElementById(selectedRelationshipId);
      if (edge.nonempty()) {
        edge.select();
      }
    }
  }, [selectedEntityId, selectedRelationshipId]);

  // Run Layout with high interactive repulsion
  const runLayout = (name: string) => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    if (activeLayoutRef.current) {
      try {
        activeLayoutRef.current.stop();
      } catch (e) {}
      activeLayoutRef.current = null;
    }

    let layoutOptions: any = { name, animate: true, animationDuration: 400 };
    if (name === 'cose') {
      layoutOptions = {
        name: 'cose',
        animate: true,
        animationDuration: 450,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 110,
        edgeElasticity: () => 120,
        gravity: 0.22,
        numIter: 400,
        padding: 50,
      };
    } else if (name === 'concentric') {
      layoutOptions = {
        name: 'concentric',
        animate: true,
        animationDuration: 450,
        padding: 50,
      };
    } else if (name === 'breadthfirst') {
      layoutOptions = {
        name: 'breadthfirst',
        animate: true,
        animationDuration: 450,
        directed: true,
        padding: 50,
      };
    }

    try {
      const layout = cy.layout(layoutOptions);
      activeLayoutRef.current = layout;
      layout.on('layoutstop', () => {
        if (activeLayoutRef.current === layout) {
          activeLayoutRef.current = null;
        }
      });
      layout.run();
    } catch (e) {
      console.warn('Layout execution error:', e);
    }
  };

  // Focus and Highlight Node + Direct Neighbors
  const focusNodeNeighborhood = (nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;

    const targetNode = cy.getElementById(nodeId);
    if (targetNode.empty()) return;

    setFocusedNodeId(nodeId);
    const neighborhood = targetNode.neighborhood().add(targetNode);

    cy.elements().removeClass('highlighted faded');
    cy.elements().difference(neighborhood).addClass('faded');
    neighborhood.addClass('highlighted');

    cy.animate({
      fit: {
        eles: neighborhood,
        padding: 60,
      },
      duration: 350,
    });
  };

  const clearFocus = () => {
    const cy = cyRef.current;
    if (!cy) return;
    setFocusedNodeId(null);
    cy.elements().removeClass('highlighted faded');
  };

  // Search in Graph
  const handleGraphSearch = (query: string) => {
    setSearchQuery(query);
    const cy = cyRef.current;
    if (!cy || !query.trim()) return;

    const lower = query.toLowerCase();
    const matched = cy.nodes().filter((node) => {
      const label = node.data('label') || '';
      const aliases = node.data('aliases') || '';
      return label.toLowerCase().includes(lower) || aliases.toLowerCase().includes(lower);
    });

    if (matched.nonempty()) {
      cy.elements().removeClass('highlighted faded');
      cy.elements().difference(matched).addClass('faded');
      matched.addClass('highlighted');
      cy.animate({
        fit: {
          eles: matched,
          padding: 80,
        },
        duration: 350,
      });
    }
  };

  // Save layout positions
  const handleSavePositions = () => {
    const cy = cyRef.current;
    if (!cy || !onSavePositions) return;

    const positions: Record<string, { x: number; y: number }> = {};
    cy.nodes().forEach((node) => {
      const pos = node.position();
      positions[node.id()] = { x: Math.round(pos.x), y: Math.round(pos.y) };
    });

    onSavePositions(positions);
  };

  // Toggle filter
  const toggleEntityType = (type: EntityType) => {
    setSelectedEntityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleStatus = (status: RelationshipStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111115] select-none overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        {/* Left Search Bar & Layout Switcher */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-[#18181c]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-obsidian-border shadow-popover">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-obsidian-dim absolute left-2" />
            <input
              type="text"
              placeholder="Find entity or alias in graph..."
              value={searchQuery}
              onChange={(e) => handleGraphSearch(e.target.value)}
              className="pl-7 pr-2 py-1 bg-[#121214] border border-obsidian-border rounded-lg text-xs text-obsidian-text placeholder-obsidian-dim focus:outline-none focus:border-obsidian-accent w-48 transition-all"
            />
          </div>

          <div className="w-px h-4 bg-obsidian-border" />

          {/* Layout Selector */}
          <div className="flex items-center space-x-1 text-xs">
            {(['cose', 'concentric', 'breadthfirst'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLayoutName(l);
                  runLayout(l);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                  layoutName === l
                    ? 'bg-obsidian-accent text-white shadow-sm'
                    : 'text-obsidian-muted hover:text-white hover:bg-obsidian-hover'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-[#18181c]/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-obsidian-border shadow-popover">
          {/* Toggle Notes */}
          <button
            type="button"
            onClick={() => setShowNotesOnGraph(!showNotesOnGraph)}
            className={`px-2 py-1 text-xs rounded-lg flex items-center space-x-1 transition-colors ${
              showNotesOnGraph
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium'
                : 'text-obsidian-muted hover:text-white hover:bg-obsidian-hover'
            }`}
            title="Toggle investigation notes on graph"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Filter Dropdown Toggle */}
          <button
            type="button"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              filterPanelOpen
                ? 'bg-obsidian-accent text-white'
                : 'text-obsidian-dim hover:text-white hover:bg-obsidian-hover'
            }`}
            title="Filter Entities and Relationships"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={() => cyRef.current?.fit(undefined, 40)}
            className="p-1.5 text-obsidian-dim hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset Layout */}
          <button
            type="button"
            onClick={() => runLayout(layoutName)}
            className="p-1.5 text-obsidian-dim hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
            title="Re-run Layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Save Positions */}
          {onSavePositions && (
            <button
              type="button"
              onClick={() => {
                handleSavePositions();
                showToast('Graph positions saved');
              }}
              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors"
              title="Save Graph Positions"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Entity */}
          <button
            type="button"
            onClick={onCreateEntity}
            className="px-2.5 py-1 text-xs bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded-lg flex items-center space-x-1 font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Entity</span>
          </button>
        </div>
      </div>

      {/* Filter Popover Panel */}
      {filterPanelOpen && (
        <div className="absolute top-14 right-3 z-30 w-72 bg-[#18181c] border border-obsidian-border rounded-xl shadow-popover p-3 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-obsidian-border pb-1.5">
            <span className="font-semibold text-white">Graph Filters</span>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="text-obsidian-dim hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <span className="font-medium text-obsidian-dim block mb-1.5 uppercase text-[10px] tracking-wider">
              Entity Types
            </span>
            <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
              {ENTITY_TYPES.map((t) => {
                const checked = selectedEntityTypes.has(t.type);
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => toggleEntityType(t.type)}
                    className={`px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors ${
                      checked
                        ? 'bg-[#22222a] text-white border border-obsidian-border'
                        : 'text-obsidian-dim opacity-50 hover:opacity-80'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="truncate">{t.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-medium text-obsidian-dim block mb-1.5 uppercase text-[10px] tracking-wider">
              Relationship Statuses
            </span>
            <div className="space-y-1">
              {RELATIONSHIP_STATUSES.map((s) => {
                const checked = selectedStatuses.has(s.status);
                return (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => toggleStatus(s.status)}
                    className={`w-full px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors ${
                      checked
                        ? 'bg-[#22222a] text-white border border-obsidian-border'
                        : 'text-obsidian-dim opacity-50 hover:opacity-80'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.label}</span>
                    </span>
                    <span className="text-[10px] text-obsidian-dim font-mono">{s.borderStyle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Cytoscape Canvas */}
      <div ref={containerRef} className="w-full flex-1" />

      {/* Bottom Info Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-[11px] text-obsidian-dim">
        <div className="flex items-center space-x-3 pointer-events-auto bg-[#18181c]/80 backdrop-blur px-2.5 py-1 rounded-lg border border-obsidian-borderSubtle">
          <span>{projectData.entities.length} entities</span>
          <span>•</span>
          <span>{projectData.relationships.length} relationships</span>
          {projectData.notes && (
            <>
              <span>•</span>
              <span>{projectData.notes.length} notes</span>
            </>
          )}
          <span>•</span>
          <span>Double-click to open</span>
        </div>
      </div>

      {/* Floating Hover Inspection Card ("Більше інфи") */}
      {hoveredNode && !contextMenu.visible && (() => {
        const width = 280;
        const padding = 16;
        let left = hoveredNode.x + 18;
        let top = hoveredNode.y - 30;

        if (typeof window !== 'undefined') {
          if (left + width > window.innerWidth - padding) {
            left = hoveredNode.x - width - 18;
          }
          if (left < padding) left = padding;
          if (top < padding) top = padding;
          if (top + 240 > window.innerHeight - padding) {
            top = window.innerHeight - 240 - padding;
          }
        }

        // Card for Note Node
        if (hoveredNode.isNote && hoveredNote) {
          return (
            <div
              className="fixed z-40 w-70 bg-[#161410]/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl rounded-xl p-3 text-xs text-obsidian-text pointer-events-none ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100"
              style={{ left: `${left}px`, top: `${top}px` }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-900/40">
                <div className="flex items-center space-x-1.5 text-amber-300 font-semibold uppercase text-[10px]">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Investigation Note</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{hoveredNote.id}</span>
              </div>
              <div className="font-bold text-white text-[13px] leading-snug mb-1">
                {hoveredNote.title}
              </div>
              <div className="text-[10px] text-zinc-300 line-clamp-3 italic">
                {hoveredNote.markdownBody.slice(0, 140)}...
              </div>
              <div className="mt-2 pt-1.5 border-t border-amber-900/30 flex items-center justify-between text-[9px] text-zinc-500">
                <span>Double-click: Open Note</span>
                <span>Right-click: Menu</span>
              </div>
            </div>
          );
        }

        // Card for Entity Node
        if (hoveredEntity) {
          const typeColor = getEntityTypeColor(hoveredEntity.type);
          const photo =
            hoveredEntity.attributes?.photo ||
            hoveredEntity.attributes?.image ||
            hoveredEntity.attributes?.avatar;

          return (
            <div
              className="fixed z-40 w-70 bg-[#141419]/95 backdrop-blur-xl border border-[#2e2e3c] shadow-2xl rounded-xl p-3 text-xs text-obsidian-text pointer-events-none ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100"
              style={{ left: `${left}px`, top: `${top}px` }}
            >
              {/* Header / Type Badge */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#252532]">
                <div className="flex items-center space-x-1.5 truncate">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${typeColor}22`,
                      border: `1px solid ${typeColor}55`,
                      color: typeColor,
                    }}
                  >
                    <EntityIcon type={hoveredEntity.type} className="w-3 h-3" />
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${typeColor}1a`,
                      color: typeColor,
                    }}
                  >
                    {getEntityTypeLabel(hoveredEntity.type)}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400 font-mono bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                  {hoveredEntityRelations.length} links
                </div>
              </div>

              {/* Entity Photo + Name */}
              <div className="flex items-center gap-2 mb-1.5">
                {photo && (
                  <img
                    src={photo}
                    alt={hoveredEntity.name}
                    className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                )}
                <div className="font-bold text-white text-[13px] leading-snug truncate">
                  {hoveredEntity.name}
                </div>
              </div>

              {/* Aliases */}
              {hoveredEntity.aliases && hoveredEntity.aliases.length > 0 && (
                <div className="text-[10px] text-zinc-400 mb-1.5 truncate">
                  <span className="text-zinc-500 font-medium">aka: </span>
                  <span>{hoveredEntity.aliases.join(', ')}</span>
                </div>
              )}

              {/* Tags */}
              {hoveredEntity.tags && hoveredEntity.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {hoveredEntity.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Relationships preview */}
              {hoveredEntityRelations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#252532] space-y-1">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Connected entities ({hoveredEntityRelations.length})
                  </div>
                  {hoveredEntityRelations.slice(0, 3).map((rel) => {
                    const s = rel.source_entity || (rel as any).source;
                    const t = rel.target_entity || (rel as any).target;
                    const isSource = s === hoveredEntity.id;
                    const otherId = isSource ? t : s;
                    const otherEntity = projectData.entities.find((e) => e.id === otherId);
                    const otherName = otherEntity ? otherEntity.name : otherId;
                    return (
                      <div key={rel.id} className="flex items-center space-x-1.5 text-[10px] truncate">
                        <span className="text-zinc-500 font-mono text-[9px]">
                          {isSource ? '→' : '←'}
                        </span>
                        <span className="text-purple-300 font-mono text-[9px] bg-purple-950/70 px-1 rounded border border-purple-800/40 shrink-0">
                          {rel.type}
                        </span>
                        <span className="text-zinc-300 truncate">{otherName}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Note Snippet */}
              {hoveredEntityNotesPreview && (
                <div className="mt-2 pt-2 border-t border-[#252532] text-[10px] text-zinc-400 italic line-clamp-2">
                  "{hoveredEntityNotesPreview}"
                </div>
              )}

              {/* Keyboard & Action Hint */}
              <div className="mt-2.5 pt-1.5 border-t border-[#252532] flex items-center justify-between text-[9px] text-zinc-400">
                <span>Double-click: Open</span>
                <span>Right-Click: Menu</span>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#1e1e24] border border-obsidian-border text-white px-3 py-1.5 rounded-lg shadow-2xl text-xs flex items-center space-x-2 animate-in fade-in duration-150">
          <Sparkles className="w-3.5 h-3.5 text-obsidian-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Custom Context Menu */}
      {contextMenu.visible && (() => {
        const width = 240;
        const padding = 12;
        let left = contextMenu.x;
        let top = contextMenu.y;

        if (typeof window !== 'undefined') {
          if (left + width > window.innerWidth - padding) {
            left = window.innerWidth - width - padding;
          }
          if (left < padding) left = padding;
          if (top + 320 > window.innerHeight - padding) {
            top = window.innerHeight - 320 - padding;
          }
          if (top < padding) top = padding;
        }

        return (
          <div
            data-context-menu
            className="fixed z-50 w-60 bg-[#141419]/95 backdrop-blur-2xl border border-[#2e2e3d] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-xs text-obsidian-text ring-1 ring-white/10 p-1 select-none animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${top}px`, left: `${left}px` }}
          >
            {/* Background Canvas Menu */}
            {contextMenu.targetType === 'background' && (
              <>
                <div className="px-3 py-2 border-b border-[#252532] bg-[#1a1a24]/70 rounded-t-lg mb-1">
                  <div className="flex items-center space-x-1.5 text-white font-semibold text-xs">
                    <Layers className="w-3.5 h-3.5 text-obsidian-accent" />
                    <span>Investigation Canvas</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {projectData.entities.length} entities • {projectData.relationships.length} relationships
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onCreateEntity();
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-obsidian-accent hover:text-white hover:bg-obsidian-accent/30 rounded-lg text-left transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Entity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      cyRef.current?.fit(undefined, 40);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Fit Graph to Screen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      runLayout(layoutName);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Re-run Layout</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono capitalize">{layoutName}</span>
                  </button>

                  {onSavePositions && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSavePositions();
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                        showToast('Graph layout positions saved');
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Node Positions</span>
                    </button>
                  )}

                  {hiddenNodeIds.size > 0 && (
                    <>
                      <div className="border-t border-[#252532] my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setHiddenNodeIds(new Set());
                          setContextMenu((prev) => ({ ...prev, visible: false }));
                          showToast(`Restored ${hiddenNodeIds.size} hidden nodes`);
                        }}
                        className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-amber-400 hover:bg-amber-500/20 rounded-lg text-left transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Unhide All ({hiddenNodeIds.size})</span>
                      </button>
                    </>
                  )}

                  {focusedNodeId && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFocus();
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Clear Isolation</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Note Node Menu */}
            {contextMenu.targetType === 'node' && contextMenu.isNote && selectedNodeNote && (
              <>
                <div className="px-3 py-2 border-b border-[#252532] bg-[#1a1a24]/70 rounded-t-lg mb-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-xs truncate">
                        {selectedNodeNote.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono truncate">{selectedNodeNote.id}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNote?.(selectedNodeNote.id);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-3.5 h-3.5 text-obsidian-accent" />
                      <span>Open Note</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Double Click</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedNodeNote.title, 'title')}
                    className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Note Title</span>
                  </button>

                  <div className="border-t border-[#252532] my-1" />

                  {onDeleteNote && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteNote(selectedNodeNote.id);
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 rounded-lg text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Note</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Entity Node Menu */}
            {contextMenu.targetType === 'node' && !contextMenu.isNote && selectedNodeEntity && (() => {
              const typeColor = getEntityTypeColor(selectedNodeEntity.type);
              return (
                <>
                  <div className="px-3 py-2 border-b border-[#252532] bg-[#1a1a24]/70 rounded-t-lg mb-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${typeColor}25`,
                          border: `1px solid ${typeColor}60`,
                          color: typeColor,
                        }}
                      >
                        <EntityIcon type={selectedNodeEntity.type} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-xs truncate">
                          {selectedNodeEntity.name}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
                          <span
                            className="font-medium text-[9px] uppercase tracking-wider"
                            style={{ color: typeColor }}
                          >
                            {selectedNodeEntity.type}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="font-mono text-zinc-500 truncate">{selectedNodeEntity.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenEntity(selectedNodeEntity.id);
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-3.5 h-3.5 text-obsidian-accent" />
                        <span>Open Entity Markdown</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Double Click</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onCreateRelationshipFromEntity(selectedNodeEntity.id);
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Connect with Relationship</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        focusNodeNeighborhood(selectedNodeEntity.id);
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                      <span>Focus & Isolate Neighbors</span>
                    </button>

                    <div className="border-t border-[#252532] my-1" />

                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedNodeEntity.name, 'name')}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Entity Name</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedNodeEntity.id, 'ID')}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <Hash className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Entity ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHiddenNodeIds((prev) => new Set([...prev, selectedNodeEntity.id]));
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                        showToast(`Hidden "${selectedNodeEntity.name}" from graph`);
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Hide from Canvas</span>
                    </button>

                    <div className="border-t border-[#252532] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteEntity(selectedNodeEntity.id);
                        setContextMenu((prev) => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-2.5 py-1.5 flex items-center space-x-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 rounded-lg text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entity</span>
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Edge Menu */}
            {contextMenu.targetType === 'edge' && selectedEdge && (
              <>
                <div className="px-3 py-2 border-b border-[#252532] bg-[#1a1a24]/70 rounded-t-lg mb-1">
                  <div className="text-[10px] uppercase font-mono text-purple-400 font-semibold mb-0.5">
                    {selectedEdge.type}
                  </div>
                  <div className="text-xs text-white font-medium truncate flex items-center space-x-1">
                    <span className="truncate">
                      {edgeSourceEntity
                        ? edgeSourceEntity.name
                        : selectedEdge.source_entity || (selectedEdge as any).source}
                    </span>
                    <span className="text-zinc-500 shrink-0">→</span>
                    <span className="truncate">
                      {edgeTargetEntity
                        ? edgeTargetEntity.name
                        : selectedEdge.target_entity || (selectedEdge as any).target}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-[10px] text-zinc-400">
                    <span>Status:</span>
                    <span className="font-mono text-zinc-300 capitalize">{selectedEdge.status}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenRelationship(selectedEdge.id);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-3.5 h-3.5 text-obsidian-accent" />
                      <span>Open Relationship</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Double Click</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const src = edgeSourceEntity
                        ? edgeSourceEntity.name
                        : selectedEdge.source_entity || (selectedEdge as any).source;
                      const tgt = edgeTargetEntity
                        ? edgeTargetEntity.name
                        : selectedEdge.target_entity || (selectedEdge as any).target;
                      copyToClipboard(`${src} —[${selectedEdge.type}]→ ${tgt}`, 'relationship info');
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Relationship Text</span>
                  </button>

                  <div className="border-t border-[#252532] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteRelationship(selectedEdge.id);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-2.5 py-1.5 flex items-center space-x-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 rounded-lg text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Relationship</span>
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};
