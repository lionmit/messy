import { describe, it, expect } from 'vitest';
import { buildDefaultIdentityDocument, isValidIdentityDocument } from '@/lib/identity-doc';

describe('buildDefaultIdentityDocument', () => {
  it('returns an object with all required top-level fields', () => {
    const doc = buildDefaultIdentityDocument();

    expect(doc).toHaveProperty('name');
    expect(doc).toHaveProperty('positioning_statement');
    expect(doc).toHaveProperty('through_line');
    expect(doc).toHaveProperty('origin_story');
    expect(doc).toHaveProperty('trigger');
    expect(doc).toHaveProperty('best_moment');
    expect(doc).toHaveProperty('audience');
    expect(doc).toHaveProperty('services');
    expect(doc).toHaveProperty('does_not_do');
    expect(doc).toHaveProperty('brand');
    expect(doc).toHaveProperty('assets');
  });

  it('has audience with ideal and not_for fields', () => {
    const doc = buildDefaultIdentityDocument();
    expect(doc.audience).toHaveProperty('ideal');
    expect(doc.audience).toHaveProperty('not_for');
    expect(typeof doc.audience.ideal).toBe('string');
    expect(typeof doc.audience.not_for).toBe('string');
  });

  it('has brand with all required fields', () => {
    const doc = buildDefaultIdentityDocument();
    expect(doc.brand).toHaveProperty('emojis');
    expect(doc.brand).toHaveProperty('colors');
    expect(doc.brand).toHaveProperty('energy');
    expect(doc.brand).toHaveProperty('tone');
    expect(doc.brand).toHaveProperty('reference_sites');
    expect(doc.brand).toHaveProperty('language_notes');
    expect(Array.isArray(doc.brand.emojis)).toBe(true);
    expect(Array.isArray(doc.brand.colors)).toBe(true);
    expect(Array.isArray(doc.brand.reference_sites)).toBe(true);
  });

  it('has assets with all required fields', () => {
    const doc = buildDefaultIdentityDocument();
    expect(doc.assets).toHaveProperty('links');
    expect(doc.assets).toHaveProperty('testimonials');
    expect(doc.assets).toHaveProperty('photos');
    expect(doc.assets).toHaveProperty('contact_cta');
    expect(Array.isArray(doc.assets.links)).toBe(true);
    expect(Array.isArray(doc.assets.testimonials)).toBe(true);
    expect(Array.isArray(doc.assets.photos)).toBe(true);
  });

  it('has services and does_not_do as arrays', () => {
    const doc = buildDefaultIdentityDocument();
    expect(Array.isArray(doc.services)).toBe(true);
    expect(Array.isArray(doc.does_not_do)).toBe(true);
  });

  it('initializes all strings as empty', () => {
    const doc = buildDefaultIdentityDocument();
    expect(doc.name).toBe('');
    expect(doc.positioning_statement).toBe('');
    expect(doc.through_line).toBe('');
    expect(doc.origin_story).toBe('');
    expect(doc.trigger).toBe('');
    expect(doc.best_moment).toBe('');
  });

  it('passes validation', () => {
    const doc = buildDefaultIdentityDocument();
    expect(isValidIdentityDocument(doc)).toBe(true);
  });
});

describe('isValidIdentityDocument', () => {
  it('returns false for null', () => {
    expect(isValidIdentityDocument(null)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isValidIdentityDocument('not a doc')).toBe(false);
  });

  it('returns false for a partial object missing required fields', () => {
    expect(isValidIdentityDocument({ name: 'Test' })).toBe(false);
  });

  it('returns true for a complete document', () => {
    const doc = {
      name: 'Test',
      positioning_statement: 'Test',
      through_line: 'Test',
      origin_story: 'Test',
      trigger: 'Test',
      best_moment: 'Test',
      audience: { ideal: '', not_for: '' },
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
    expect(isValidIdentityDocument(doc)).toBe(true);
  });
});
