import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getActiveProvider } from '@/lib/model';

describe('model routing guardrails (§3.4)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MODEL_PROVIDER;
    delete process.env.MODEL_PROVIDER_CHAT;
    delete process.env.MODEL_PROVIDER_FINISH;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to Anthropic for both chat and finish when ANTHROPIC_API_KEY exists', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    expect(getActiveProvider('chat')).toBe('anthropic');
    expect(getActiveProvider('finish')).toBe('anthropic');
    expect(getActiveProvider()).toBe('anthropic');
  });

  it('defaults to Anthropic even when BOTH keys exist (removes hybrid Gemini routing)', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.GEMINI_API_KEY = 'gemini-key-test';
    expect(getActiveProvider('chat')).toBe('anthropic');
    expect(getActiveProvider('finish')).toBe('anthropic');
    expect(getActiveProvider()).toBe('anthropic');
  });

  it('routes to Gemini only when MODEL_PROVIDER* says gemini explicitly', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.GEMINI_API_KEY = 'gemini-key-test';

    process.env.MODEL_PROVIDER_CHAT = 'gemini';
    expect(getActiveProvider('chat')).toBe('gemini');
    expect(getActiveProvider('finish')).toBe('anthropic');

    delete process.env.MODEL_PROVIDER_CHAT;
    process.env.MODEL_PROVIDER_FINISH = 'gemini';
    expect(getActiveProvider('chat')).toBe('anthropic');
    expect(getActiveProvider('finish')).toBe('gemini');

    process.env.MODEL_PROVIDER = 'gemini';
    expect(getActiveProvider('chat')).toBe('gemini');
    expect(getActiveProvider('finish')).toBe('gemini');
  });

  it('routes to Anthropic when MODEL_PROVIDER says anthropic explicitly', () => {
    process.env.GEMINI_API_KEY = 'gemini-key-test';
    process.env.MODEL_PROVIDER = 'anthropic';
    expect(getActiveProvider('chat')).toBe('anthropic');
    expect(getActiveProvider('finish')).toBe('anthropic');
  });

  it('falls back to Gemini only if only GEMINI_API_KEY exists without ANTHROPIC_API_KEY', () => {
    process.env.GEMINI_API_KEY = 'gemini-key-test';
    expect(getActiveProvider('chat')).toBe('gemini');
    expect(getActiveProvider('finish')).toBe('gemini');
  });

  it('defaults to Anthropic if neither key exists', () => {
    expect(getActiveProvider('chat')).toBe('anthropic');
    expect(getActiveProvider('finish')).toBe('anthropic');
  });
});
