import { describe, it, expect } from 'vitest';
import {
  parseMarkdownFrontmatter,
  serializeMarkdownFrontmatter,
  parseEntityFile,
  serializeEntityFile,
  parseRelationshipFile,
  serializeRelationshipFile,
  parseNoteFile,
  serializeNoteFile,
  parseProjectFile,
  serializeProjectFile,
} from '../services/markdownParser';

describe('Markdown Parser & Serializer', () => {
  it('parses frontmatter correctly', () => {
    const raw = `---
id: test-1
name: Test Subject
type: person
---

# Test Subject Body`;

    const { frontmatter, content } = parseMarkdownFrontmatter(raw);
    expect(frontmatter.id).toBe('test-1');
    expect(frontmatter.name).toBe('Test Subject');
    expect(content.trim()).toBe('# Test Subject Body');
  });

  it('preserves unknown metadata on notes and projects', () => {
    const noteRaw = `---
id: note-1
type: note
title: Investigation Notes
tags: [intel, cyber]
custom_field: secret_value
priority_level: 5
created_at: '2026-01-01T00:00:00.000Z'
updated_at: '2026-01-01T00:00:00.000Z'
---

# Investigation Notes Content`;

    const parsedNote = parseNoteFile(noteRaw, 'fallback');
    expect(parsedNote.title).toBe('Investigation Notes');
    expect(parsedNote.extraFrontmatter?.custom_field).toBe('secret_value');
    expect(parsedNote.extraFrontmatter?.priority_level).toBe(5);

    const reSerialized = serializeNoteFile(parsedNote);
    expect(reSerialized).toContain('custom_field: secret_value');
    expect(reSerialized).toContain('priority_level: 5');
  });

  it('handles Windows CRLF line endings in frontmatter', () => {
    const crlf = "---\r\nid: ent-win\r\ntype: person\r\nname: Windows User\r\n---\r\n\r\n# Hello CRLF";
    const entity = parseEntityFile(crlf, 'fallback');
    expect(entity.id).toBe('ent-win');
    expect(entity.name).toBe('Windows User');
    expect(entity.markdownBody.trim()).toBe('# Hello CRLF');
  });

  it('recovers gracefully from missing frontmatter', () => {
    const raw = '# Just Plain Markdown\n\nNo frontmatter delimiters here.';
    const entity = parseEntityFile(raw, 'fallback-id');
    expect(entity.id).toBe('fallback-id');
    expect(entity.name).toBe('fallback-id');
    expect(entity.markdownBody).toBe(raw);
  });

  it('recovers gracefully from invalid YAML syntax', () => {
    const raw = '---\nid: valid-id\nname: [unclosed array\n---\n\n# Body';
    const entity = parseEntityFile(raw, 'fallback');
    expect(entity.markdownBody.trim()).toBe('# Body');
  });
});
