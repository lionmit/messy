import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudioConfig, parseStudioConfig, publicStudioConfig } from '@/lib/studio/config';
import {
  CHIPS,
  DEFAULT_FIRST_LINE,
  DEFAULT_REPLY_LINE,
  STEP_COUNT,
  STUDIO_STEPS,
  applyPatch,
  buildWaLink,
  displayIsraeliPhone,
  findIsraeliPhone,
  initialState,
  normalizeIsraeliPhone,
  openingMessage,
  parseStudioReply,
  thankYouMessage,
  validateStudioState,
} from '@/lib/studio/steps';
import { buildStudioRequest, studioChatTurn, validateStudioMessages, resetStudioChatForTests } from '@/lib/studio/chat';
import {
  buildStudioPayload,
  resetStudioSubmitForTests,
  studioSubmit,
  validateSubmitBody,
} from '@/lib/studio/submit';
import { parsePersisted } from '@/components/studio/store';

describe('Studio config (§2.1)', () => {
  it('loads and validates maayan.json config correctly', () => {
    const config = getStudioConfig('maayan');
    expect(config).not.toBeNull();
    expect(config?.slug).toBe('maayan');
    expect(config?.name).toBe('מעין');
    expect(config?.gender).toBe('f');
    expect(config?.heroLine).toBe('להאט, להתבונן יחד במה שקורה בבית, ולמצוא את השביל המדויק.');
    expect(config?.round).toBe(1);
    expect(config?.roundsIncluded).toBe(2);
    expect(config?.sections.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects invalid slugs or malformed configs', () => {
    expect(getStudioConfig('invalid/slug')).toBeNull();
    expect(getStudioConfig('non-existent-case-12345')).toBeNull();
    expect(parseStudioConfig({ slug: 'test' })).toBeNull();
    expect(parseStudioConfig({ slug: 'test', name: 'Test', gender: 'x' })).toBeNull();
  });

  it('publicStudioConfig fills lionelWhatsapp from environment', () => {
    const base = getStudioConfig('maayan')!;
    const pub = publicStudioConfig(base, { LIONEL_WHATSAPP: '054-9998877' } as NodeJS.ProcessEnv);
    expect(pub.lionelWhatsapp).toBe('0549998877');
  });
});

describe('Studio steps and state logic (§2.3)', () => {
  it('initializes opening turn with heroLine and chips', () => {
    const config = getStudioConfig('maayan')!;
    const opening = openingMessage(config);
    expect(opening.text).toContain(config.name);
    expect(opening.text).toContain(config.heroLine);
    expect(opening.chips).toContain(CHIPS.goLive);
    expect(opening.chips).toContain('כן, זה אני');
  });

  it('normalizes Israeli phone numbers accurately', () => {
    expect(normalizeIsraeliPhone('0501234567')).toBe('972501234567');
    expect(normalizeIsraeliPhone('050-1234567')).toBe('972501234567');
    expect(normalizeIsraeliPhone('+972-50-1234567')).toBe('972501234567');
    expect(normalizeIsraeliPhone('+9720501234567')).toBe('972501234567');
    expect(normalizeIsraeliPhone('123456')).toBeNull();
    expect(normalizeIsraeliPhone('not-a-number')).toBeNull();

    expect(findIsraeliPhone('המספר שלי הוא 054-7654321 תודה')).toBe('972547654321');
    expect(displayIsraeliPhone('972501234567')).toBe('050-1234567');
    expect(buildWaLink('972501234567', 'שלום')).toContain('wa.me/972501234567?text=');
  });

  it('validates studio state transitions and caps', () => {
    const base = initialState();
    expect(base.step).toBe(1);
    expect(base.edits).toEqual([]);

    const validRes = validateStudioState(
      {
        step: 3,
        whatsapp: '052-1234567',
        waText: 'הודעת בדיקה',
        reply: DEFAULT_REPLY_LINE,
        first: DEFAULT_FIRST_LINE,
        photoSent: true,
        goLive: false,
      },
      ['hero', 'about']
    );
    expect(validRes.ok).toBe(true);
    if (validRes.ok) {
      expect(validRes.value.step).toBe(3);
      expect(validRes.value.whatsapp).toBe('972521234567');
      expect(validRes.value.photoSent).toBe(true);
    }

    // Invalid step
    expect(validateStudioState({ step: 99 }, ['hero']).ok).toBe(false);
    // Invalid phone
    expect(validateStudioState({ whatsapp: 'invalid' }, ['hero']).ok).toBe(false);
  });

  it('parses model reply JSON and enforces forward step constraint and goLive chip', () => {
    const state = initialState();
    const config = getStudioConfig('maayan')!;

    const rawReply = JSON.stringify({
      reply: 'משפט פתיחה מעולה. נעבור למשפטים הבאים?',
      chips: ['לא, הכול בסדר', 'כן, יש'],
      step: 2,
      statePatch: {
        edits: [{ section: 'hero', from: 'ישן', to: 'חדש' }],
      },
      done: false,
    });

    const parsed = parseStudioReply(rawReply, state, config);
    expect(parsed).not.toBeNull();
    expect(parsed?.step).toBe(2);
    expect(parsed?.state.step).toBe(2);
    expect(parsed?.state.edits.length).toBe(1);
    expect(parsed?.chips).toContain(CHIPS.goLive);

    // Step cannot jump by 2
    const jumpRaw = JSON.stringify({
      reply: 'קפיצה לא חוקית',
      chips: [],
      step: 5,
    });
    const parsedJump = parseStudioReply(jumpRaw, state, config);
    expect(parsedJump?.step).toBe(1); // stays at current step
  });

  it('thankYouMessage reflects goLive flag', () => {
    const liveMsg = thankYouMessage(true);
    const draftMsg = thankYouMessage(false);
    expect(liveMsg).toContain('גם הבקשה להעלות את האתר רשומה');
    expect(draftMsg).not.toContain('גם הבקשה להעלות את האתר רשומה');
  });
});

describe('Studio submit and payload contract (§2.5)', () => {
  beforeEach(() => {
    resetStudioSubmitForTests();
  });

  it('validates submit request body and rejects invalid submissions', () => {
    const config = getStudioConfig('maayan')!;
    const state = initialState();

    const valid = validateSubmitBody({
      slug: config.slug,
      round: config.round,
      state,
      transcript: [{ role: 'assistant', text: 'שלום' }],
    });
    expect(valid.ok).toBe(true);

    // Wrong round
    const wrongRound = validateSubmitBody({
      slug: config.slug,
      round: 999,
      state,
    });
    expect(wrongRound.ok).toBe(false);

    // Unknown slug
    const wrongSlug = validateSubmitBody({
      slug: 'unknown-slug-xyz',
      round: 1,
      state,
    });
    expect(wrongSlug.ok).toBe(false);
  });

  it('buildStudioPayload generates exact contract keys expected by pipeline §3.2', () => {
    const config = getStudioConfig('maayan')!;
    const state: any = {
      ...initialState(),
      step: 7,
      edits: [{ section: 'hero', from: 'from-text', to: 'to-text' }],
      comments: [{ section: 'offer', comment: 'הערה על ההצעה' }],
      whatsapp: '972501234567',
      waText: 'היי מעין',
      reply: 'עונה תוך יום',
      first: 'שיחת היכרות קצרה',
      photoSent: true,
      goLive: true,
    };
    const transcript = [
      { role: 'assistant' as const, text: 'היי' },
      { role: 'user' as const, text: 'זה טוב, אפשר להעלות' },
    ];
    const now = new Date('2026-10-16T12:00:00Z');

    const payload = buildStudioPayload({ config, round: 1, state, transcript }, now);
    expect(payload.kind).toBe('studio_round');
    expect(payload.slug).toBe('maayan');
    expect(payload.round).toBe(1);
    expect(payload.go_live).toBe(true);
    expect(payload.whatsapp).toBe('972501234567');
    expect(payload.reply_line).toBe('עונה תוך יום');
    expect(payload.first_line).toBe('שיחת היכרות קצרה');
    expect(payload.photo_sent).toBe(true);
    expect(payload.edits).toEqual([{ section: 'hero', from: 'from-text', to: 'to-text' }]);
    expect(payload.comments).toEqual([{ section: 'offer', comment: 'הערה על ההצעה' }]);
    expect(payload.transcript).toEqual(transcript);
  });

  it('submits round successfully and guards against duplicate submissions', async () => {
    const deliverMock = vi.fn().mockResolvedValue('sent');
    const config = getStudioConfig('maayan')!;
    const state = initialState();

    const body = {
      slug: config.slug,
      round: config.round,
      state,
      transcript: [],
    };

    const res1 = await studioSubmit(body, '127.0.0.1', {
      deliver: deliverMock,
      now: () => new Date(),
    });
    expect(res1.status).toBe(200);
    expect(deliverMock).toHaveBeenCalledTimes(1);
    expect(deliverMock).toHaveBeenCalledWith('studio_round', expect.objectContaining({ slug: 'maayan' }));

    // Duplicate submission
    const res2 = await studioSubmit(body, '127.0.0.1', {
      deliver: deliverMock,
      now: () => new Date(),
    });
    expect(res2.status).toBe(409);
    expect(res2.body).toEqual({ error: 'already_sent' });
  });
});

describe('Studio chat turn e2e execution (§2.3)', () => {
  beforeEach(() => {
    resetStudioChatForTests();
  });

  it('completes chat turn with mock Anthropic caller and updates phone check', async () => {
    const config = getStudioConfig('maayan')!;
    const state = { ...initialState(), step: 3 };

    const mockCallModel = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        reply: 'המספר נקלט מצוין. זו ההודעה שמגיעה אליו, מה דעתך?',
        chips: [CHIPS.waTest, CHIPS.waEdit, CHIPS.waOk],
        step: 3,
        statePatch: {},
        done: false,
      }),
      stopReason: 'stop',
    });

    const body = {
      slug: config.slug,
      messages: [
        { role: 'assistant', text: 'מה מספר הוואטסאפ שלך?' },
        { role: 'user', text: '050-1234567' },
      ],
      state,
    };

    const res = await studioChatTurn(body, '127.0.0.1', { callModel: mockCallModel });
    expect(res.status).toBe(200);
    expect(mockCallModel).toHaveBeenCalledTimes(1);

    const bodyRes = res.body as any;
    expect(bodyRes.step).toBe(3);
    expect(bodyRes.reply).toContain('המספר נקלט מצוין');
    expect(bodyRes.state.whatsapp).toBe('972501234567');
    expect(bodyRes.waPreview).not.toBeNull();
    expect(bodyRes.waPreview.number).toBe('050-1234567');
  });
});

describe('Studio persistence parser (§2.4)', () => {
  it('parses valid persisted storage snapshot', () => {
    const raw = JSON.stringify({
      v: 1,
      slug: 'maayan',
      round: 1,
      messages: [{ id: '1', role: 'assistant', text: 'שלום' }],
      state: { step: 2, edits: [], comments: [] },
      submitted: null,
    });
    const parsed = parsePersisted(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.slug).toBe('maayan');
    expect(parsed?.state.step).toBe(2);
  });

  it('returns null on invalid or corrupted storage data', () => {
    expect(parsePersisted(null)).toBeNull();
    expect(parsePersisted('invalid json')).toBeNull();
    expect(parsePersisted(JSON.stringify({ v: 2 }))).toBeNull();
  });
});
