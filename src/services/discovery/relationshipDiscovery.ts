import { Entity, Relationship, EntityType } from '@/types';

export interface SuggestedRelationship {
  id: string;
  sourceEntityId: string;
  sourceEntityName: string;
  sourceEntityType: EntityType;
  targetEntityId: string;
  targetEntityName: string;
  targetEntityType: EntityType;
  suggestedType: string;
  category: 'surname' | 'contact' | 'corporate' | 'infrastructure' | 'mention' | 'attribute';
  evidence: string;
  confidence: number;
  matchedField: string;
  matchedValue: string;
}

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'ukr.net',
  'proton.me',
  'protonmail.com',
  'mail.ru',
  'yandex.ru',
  'meta.ua',
  'i.ua',
  'aol.com',
]);

function normalizeDigits(val: string): string {
  return val.replace(/[^\d]/g, '');
}

function extractSurnames(name: string): string[] {
  const parts = name.trim().split(/\s+/).filter((p) => p.length >= 3);
  if (parts.length === 0) return [];
  // In Ukrainian/Western naming conventions: either first word or last word is the surname
  const candidates = new Set<string>();
  candidates.add(parts[0].toLowerCase());
  if (parts.length > 1) {
    candidates.add(parts[parts.length - 1].toLowerCase());
  }
  return Array.from(candidates);
}

function extractEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length === 2 && parts[1].includes('.')) {
    return parts[1];
  }
  return null;
}

export function discoverRelationships(
  entities: Entity[],
  existingRelationships: Relationship[]
): SuggestedRelationship[] {
  const suggestions: SuggestedRelationship[] = [];
  const existingPairSet = new Set<string>();

  existingRelationships.forEach((r) => {
    existingPairSet.add(`${r.source_entity}:${r.target_entity}`);
    existingPairSet.add(`${r.target_entity}:${r.source_entity}`);
  });

  const pairSuggestionMap = new Map<string, SuggestedRelationship>();

  const addSuggestion = (sug: SuggestedRelationship) => {
    const pairKey = [sug.sourceEntityId, sug.targetEntityId].sort().join(':');
    if (existingPairSet.has(`${sug.sourceEntityId}:${sug.targetEntityId}`)) return;
    if (existingPairSet.has(`${sug.targetEntityId}:${sug.sourceEntityId}`)) return;

    const existing = pairSuggestionMap.get(pairKey);
    if (!existing || existing.confidence < sug.confidence) {
      pairSuggestionMap.set(pairKey, sug);
    }
  };

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];

      // 1. Surname matching for person entities
      if (a.type === 'person' && b.type === 'person') {
        const surnamesA = extractSurnames(a.name);
        const surnamesB = extractSurnames(b.name);
        for (const sA of surnamesA) {
          if (surnamesB.includes(sA) && sA.length >= 4) {
            addSuggestion({
              id: `sug-sur-${a.id}-${b.id}`,
              sourceEntityId: a.id,
              sourceEntityName: a.name,
              sourceEntityType: a.type,
              targetEntityId: b.id,
              targetEntityName: b.name,
              targetEntityType: b.type,
              suggestedType: 'family',
              category: 'surname',
              evidence: `Shared surname: "${sA.charAt(0).toUpperCase() + sA.slice(1)}"`,
              confidence: 65,
              matchedField: 'name',
              matchedValue: sA,
            });
            break;
          }
        }
      }

      // Check all attributes between A and B
      const attrsA = a.attributes || {};
      const attrsB = b.attributes || {};

      for (const [keyA, valA] of Object.entries(attrsA)) {
        if (valA === null || valA === undefined || valA === '') continue;
        const strA = String(valA).trim();

        // 2. Phone matching
        if (
          keyA.toLowerCase().includes('phone') ||
          keyA.toLowerCase().includes('tel') ||
          keyA.toLowerCase().includes('mobile')
        ) {
          const digitsA = normalizeDigits(strA);
          if (digitsA.length >= 9) {
            for (const [keyB, valB] of Object.entries(attrsB)) {
              if (!valB) continue;
              const digitsB = normalizeDigits(String(valB));
              if (digitsB.length >= 9 && digitsA === digitsB) {
                addSuggestion({
                  id: `sug-phone-${a.id}-${b.id}`,
                  sourceEntityId: a.id,
                  sourceEntityName: a.name,
                  sourceEntityType: a.type,
                  targetEntityId: b.id,
                  targetEntityName: b.name,
                  targetEntityType: b.type,
                  suggestedType: 'shared_phone',
                  category: 'contact',
                  evidence: `Identical phone number: ${strA}`,
                  confidence: 95,
                  matchedField: keyA,
                  matchedValue: strA,
                });
              }
            }
          }
        }

        // 3. Email matching & Corporate Domain matching
        if (keyA.toLowerCase().includes('email') || keyA.toLowerCase().includes('mail')) {
          const emailA = strA.toLowerCase();
          for (const [keyB, valB] of Object.entries(attrsB)) {
            if (!valB) continue;
            const emailB = String(valB).trim().toLowerCase();
            if (emailA === emailB && emailA.includes('@')) {
              addSuggestion({
                id: `sug-email-${a.id}-${b.id}`,
                sourceEntityId: a.id,
                sourceEntityName: a.name,
                sourceEntityType: a.type,
                targetEntityId: b.id,
                targetEntityName: b.name,
                targetEntityType: b.type,
                suggestedType: 'shared_email',
                category: 'contact',
                evidence: `Identical email address: ${strA}`,
                confidence: 95,
                matchedField: keyA,
                matchedValue: strA,
              });
            } else {
              const domA = extractEmailDomain(emailA);
              const domB = extractEmailDomain(emailB);
              if (domA && domB && domA === domB && !PUBLIC_EMAIL_DOMAINS.has(domA)) {
                addSuggestion({
                  id: `sug-dom-${a.id}-${b.id}`,
                  sourceEntityId: a.id,
                  sourceEntityName: a.name,
                  sourceEntityType: a.type,
                  targetEntityId: b.id,
                  targetEntityName: b.name,
                  targetEntityType: b.type,
                  suggestedType: 'colleague',
                  category: 'corporate',
                  evidence: `Shared corporate email domain: @${domA}`,
                  confidence: 80,
                  matchedField: 'email_domain',
                  matchedValue: domA,
                });
              }
            }
          }
        }

        // 4. IP address matching
        if (keyA.toLowerCase() === 'ip' || keyA.toLowerCase().includes('ip_address') || keyA.toLowerCase() === 'host') {
          for (const [keyB, valB] of Object.entries(attrsB)) {
            if (!valB) continue;
            const strB = String(valB).trim();
            if (strA === strB && strA.length >= 7) {
              addSuggestion({
                id: `sug-ip-${a.id}-${b.id}`,
                sourceEntityId: a.id,
                sourceEntityName: a.name,
                sourceEntityType: a.type,
                targetEntityId: b.id,
                targetEntityName: b.name,
                targetEntityType: b.type,
                suggestedType: 'shared_infrastructure',
                category: 'infrastructure',
                evidence: `Shared IP address / host: ${strA}`,
                confidence: 90,
                matchedField: keyA,
                matchedValue: strA,
              });
            }
          }
        }

        // 5. Organization / Company / Employer matching
        if (
          ['organization', 'company', 'employer', 'workplace', 'org'].includes(keyA.toLowerCase())
        ) {
          for (const [keyB, valB] of Object.entries(attrsB)) {
            if (!valB) continue;
            const strB = String(valB).trim();
            if (
              ['organization', 'company', 'employer', 'workplace', 'org'].includes(keyB.toLowerCase()) &&
              strA.toLowerCase() === strB.toLowerCase() &&
              strA.length >= 3
            ) {
              addSuggestion({
                id: `sug-org-${a.id}-${b.id}`,
                sourceEntityId: a.id,
                sourceEntityName: a.name,
                sourceEntityType: a.type,
                targetEntityId: b.id,
                targetEntityName: b.name,
                targetEntityType: b.type,
                suggestedType: 'coworker',
                category: 'corporate',
                evidence: `Associated with same organization: "${strA}"`,
                confidence: 85,
                matchedField: keyA,
                matchedValue: strA,
              });
            }
          }
        }

        // 6. Address / Location matching
        if (['address', 'location', 'residence', 'city_address'].includes(keyA.toLowerCase())) {
          for (const [keyB, valB] of Object.entries(attrsB)) {
            if (!valB) continue;
            const strB = String(valB).trim();
            if (
              ['address', 'location', 'residence', 'city_address'].includes(keyB.toLowerCase()) &&
              strA.toLowerCase() === strB.toLowerCase() &&
              strA.length >= 5
            ) {
              addSuggestion({
                id: `sug-addr-${a.id}-${b.id}`,
                sourceEntityId: a.id,
                sourceEntityName: a.name,
                sourceEntityType: a.type,
                targetEntityId: b.id,
                targetEntityName: b.name,
                targetEntityType: b.type,
                suggestedType: 'co_located',
                category: 'attribute',
                evidence: `Matching address: "${strA}"`,
                confidence: 75,
                matchedField: keyA,
                matchedValue: strA,
              });
            }
          }
        }

        // 7. General identifier attribute matching (tax_id, inn, edrpou, passport, telegram, handle, etc.)
        if (
          ['inn', 'edrpou', 'tax_id', 'passport', 'telegram', 'handle', 'username', 'car_number', 'license_plate', 'iban'].includes(
            keyA.toLowerCase()
          )
        ) {
          const valB = attrsB[keyA];
          if (valB && String(valB).trim().toLowerCase() === strA.toLowerCase()) {
            addSuggestion({
              id: `sug-id-${a.id}-${b.id}-${keyA}`,
              sourceEntityId: a.id,
              sourceEntityName: a.name,
              sourceEntityType: a.type,
              targetEntityId: b.id,
              targetEntityName: b.name,
              targetEntityType: b.type,
              suggestedType: `shared_${keyA}`,
              category: 'attribute',
              evidence: `Shared identifier ${keyA.toUpperCase()}: "${strA}"`,
              confidence: 95,
              matchedField: keyA,
              matchedValue: strA,
            });
          }
        }
      }

      // 8. Mentions in attributes: if entity A's name is mentioned in entity B's attributes
      if (a.name.length >= 4) {
        for (const [keyB, valB] of Object.entries(attrsB)) {
          if (valB && typeof valB === 'string' && valB.toLowerCase().includes(a.name.toLowerCase())) {
            addSuggestion({
              id: `sug-mention-${a.id}-${b.id}`,
              sourceEntityId: a.id,
              sourceEntityName: a.name,
              sourceEntityType: a.type,
              targetEntityId: b.id,
              targetEntityName: b.name,
              targetEntityType: b.type,
              suggestedType: 'mentioned_in',
              category: 'mention',
              evidence: `Entity "${a.name}" is mentioned in ${b.name}'s ${keyB}`,
              confidence: 85,
              matchedField: keyB,
              matchedValue: a.name,
            });
          }
        }
      }
      if (b.name.length >= 4) {
        for (const [keyA, valA] of Object.entries(attrsA)) {
          if (valA && typeof valA === 'string' && valA.toLowerCase().includes(b.name.toLowerCase())) {
            addSuggestion({
              id: `sug-mention-${b.id}-${a.id}`,
              sourceEntityId: b.id,
              sourceEntityName: b.name,
              sourceEntityType: b.type,
              targetEntityId: a.id,
              targetEntityName: a.name,
              targetEntityType: a.type,
              suggestedType: 'mentioned_in',
              category: 'mention',
              evidence: `Entity "${b.name}" is mentioned in ${a.name}'s ${keyA}`,
              confidence: 85,
              matchedField: keyA,
              matchedValue: b.name,
            });
          }
        }
      }
    }
  }

  suggestions.push(...Array.from(pairSuggestionMap.values()));
  return suggestions.sort((x, y) => y.confidence - x.confidence);
}
