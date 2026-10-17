import { describe, it, expect } from 'vitest';
import { discoverRelationships } from '../services/discovery/relationshipDiscovery';
import { Entity } from '../types';

describe('Relationship Discovery Algorithm', () => {
  it('does NOT match common first names as surnames (e.g. John Doe & John Smith)', () => {
    const e1: Entity = {
      id: 'ent-1',
      name: 'John Doe',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {},
      tags: [],
      markdownBody: '',
    };
    const e2: Entity = {
      id: 'ent-2',
      name: 'John Smith',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {},
      tags: [],
      markdownBody: '',
    };

    const suggestions = discoverRelationships([e1, e2], []);
    // "John" is the first name, not a surname. They should NOT be suggested as family!
    const familySug = suggestions.find((s) => s.category === 'surname');
    expect(familySug).toBeUndefined();
  });

  it('matches actual shared surnames for relatives (e.g. Alice Watson & Bob Watson)', () => {
    const e1: Entity = {
      id: 'ent-1',
      name: 'Alice Watson',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {},
      tags: [],
      markdownBody: '',
    };
    const e2: Entity = {
      id: 'ent-2',
      name: 'Bob Watson',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {},
      tags: [],
      markdownBody: '',
    };

    const suggestions = discoverRelationships([e1, e2], []);
    const familySug = suggestions.find((s) => s.category === 'surname');
    expect(familySug).toBeDefined();
    expect(familySug?.suggestedType).toBe('family');
    expect(familySug?.matchedValue).toBe('watson');
  });

  it('does not falsely match substring in mention when name is a substring of another word (e.g. Dan in Jordan)', () => {
    const e1: Entity = {
      id: 'ent-1',
      name: 'Dan',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {},
      tags: [],
      markdownBody: '',
    };
    const e2: Entity = {
      id: 'ent-2',
      name: 'Michael Jordan',
      type: 'person',
      aliases: [],
      created_at: '',
      updated_at: '',
      attributes: {
        employer: 'Jordan Brand Corporation',
      },
      tags: [],
      markdownBody: '',
    };

    const suggestions = discoverRelationships([e1, e2], []);
    const mentionSug = suggestions.find((s) => s.category === 'mention');
    expect(mentionSug).toBeUndefined();
  });
});
