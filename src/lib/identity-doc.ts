import type { IdentityDocument } from '@/types';

/**
 * Builds a default (empty) identity document structure.
 * The actual rich content is synthesized by Claude at interview completion.
 */
export function buildDefaultIdentityDocument(): IdentityDocument {
  return {
    name: '',
    positioning_statement: '',
    through_line: '',
    origin_story: '',
    trigger: '',
    best_moment: '',
    audience: {
      ideal: '',
      not_for: '',
    },
    services: [],
    does_not_do: [],
    brand: {
      emojis: [],
      colors: [],
      energy: '',
      tone: '',
      reference_sites: [],
      language_notes: '',
    },
    assets: {
      links: [],
      testimonials: [],
      photos: [],
      contact_cta: '',
    },
  };
}

/**
 * Validates that a parsed object has the required IdentityDocument shape.
 */
export function isValidIdentityDocument(obj: unknown): obj is IdentityDocument {
  if (!obj || typeof obj !== 'object') return false;
  const doc = obj as Record<string, unknown>;

  return (
    typeof doc.name === 'string' &&
    typeof doc.positioning_statement === 'string' &&
    typeof doc.through_line === 'string' &&
    typeof doc.origin_story === 'string' &&
    typeof doc.trigger === 'string' &&
    typeof doc.best_moment === 'string' &&
    typeof doc.audience === 'object' &&
    doc.audience !== null &&
    Array.isArray(doc.services) &&
    Array.isArray(doc.does_not_do) &&
    typeof doc.brand === 'object' &&
    doc.brand !== null &&
    typeof doc.assets === 'object' &&
    doc.assets !== null
  );
}
