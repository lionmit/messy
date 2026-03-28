import { describe, it, expect } from 'vitest';
import { getSystemPrompt, getPhasePrompt } from '@/lib/prompts';

describe('getSystemPrompt', () => {
  it('returns a system prompt string', () => {
    const prompt = getSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes identity extraction language', () => {
    const prompt = getSystemPrompt();
    expect(prompt).toContain('identity extraction');
  });

  it('includes the through-line concept', () => {
    const prompt = getSystemPrompt();
    expect(prompt).toContain('through-line');
    // Also referenced as THREAD in system prompt
    expect(prompt).toContain('THREAD');
  });

  it('includes phase tag instructions', () => {
    const prompt = getSystemPrompt();
    expect(prompt).toContain('<phase>');
    expect(prompt).toContain('</phase>');
  });

  it('includes existing identity when provided', () => {
    const identity = { name: 'Test Person', positioning_statement: 'I help people' };
    const prompt = getSystemPrompt(identity);
    expect(prompt).toContain('Test Person');
    expect(prompt).toContain('I help people');
    expect(prompt).toContain('what you have gathered so far');
  });

  it('does not include identity context when none provided', () => {
    const prompt = getSystemPrompt();
    expect(prompt).not.toContain('what you have gathered so far');
  });
});

describe('getPhasePrompt', () => {
  it('has prompts for all four active phases', () => {
    const phases = ['person', 'offering', 'brand', 'assets'] as const;
    for (const phase of phases) {
      const prompt = getPhasePrompt(phase);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it('has a prompt for the complete phase', () => {
    const prompt = getPhasePrompt('complete');
    expect(prompt).toContain('complete');
  });

  it('person phase does NOT mention testimonials', () => {
    const prompt = getPhasePrompt('person');
    // Should explicitly say NOT to ask about testimonials
    expect(prompt).toContain('testimonials');
    expect(prompt).toContain('DO NOT');
  });

  it('person phase asks about story and trigger', () => {
    const prompt = getPhasePrompt('person');
    expect(prompt).toContain('story');
    expect(prompt).toContain('trigger');
  });

  it('person phase asks about best moment broadly (not just clients)', () => {
    const prompt = getPhasePrompt('person');
    expect(prompt).toContain('best moment');
    // Should mention it's broad — studies, projects, etc.
    expect(prompt).toContain('BROAD');
  });

  it('offering phase includes elimination questions', () => {
    const prompt = getPhasePrompt('offering');
    expect(prompt).toContain('ELIMINATION');
    expect(prompt).toContain('NOT do');
    expect(prompt).toContain('NOT their person');
  });

  it('offering phase includes through-line mirroring', () => {
    const prompt = getPhasePrompt('offering');
    expect(prompt).toContain('through-line');
    expect(prompt).toContain('Mirror back');
  });

  it('brand phase asks about emojis, colors, and energy', () => {
    const prompt = getPhasePrompt('brand');
    expect(prompt).toContain('emojis');
    expect(prompt).toContain('Colors');
    expect(prompt).toContain('energy');
  });

  it('assets phase mentions testimonials gently', () => {
    const prompt = getPhasePrompt('assets');
    expect(prompt).toContain('Testimonials');
    expect(prompt).toContain("DON'T push");
  });

  it('assets phase produces identity document JSON', () => {
    const prompt = getPhasePrompt('assets');
    expect(prompt).toContain('<identity>');
    expect(prompt).toContain('IdentityDocument');
  });

  it('all active phase prompts include their phase tag', () => {
    expect(getPhasePrompt('person')).toContain('"phase":"person"');
    expect(getPhasePrompt('offering')).toContain('"phase":"offering"');
    expect(getPhasePrompt('brand')).toContain('"phase":"brand"');
    expect(getPhasePrompt('assets')).toContain('"phase":"assets"');
    expect(getPhasePrompt('complete')).toContain('"phase":"complete"');
  });
});
