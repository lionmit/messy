import { describe, expect, it } from 'vitest';
import { getClarityStage } from '@/components/ChatInterface';
import nextConfig from '../next.config';

describe('Chat UI & Clarity Gauge (Epistemic Clarity Gauge)', () => {
  it('follows Lionel\'s exact progression for Epistemic Clarity Gauge', () => {
    // Stage 1 (0-2 user turns): 'אנחנו ממש בהתחלה'
    expect(getClarityStage(0, false)).toEqual({
      step: 1,
      label: 'אנחנו ממש בהתחלה',
    });
    expect(getClarityStage(1, false)).toEqual({
      step: 1,
      label: 'אנחנו ממש בהתחלה',
    });
    expect(getClarityStage(2, false)).toEqual({
      step: 1,
      label: 'אנחנו ממש בהתחלה',
    });

    // Stage 2 (3-6 user turns): 'אני מתחיל להבין'
    expect(getClarityStage(3, false)).toEqual({
      step: 2,
      label: 'אני מתחיל להבין',
    });
    expect(getClarityStage(4, false)).toEqual({
      step: 2,
      label: 'אני מתחיל להבין',
    });
    expect(getClarityStage(6, false)).toEqual({
      step: 2,
      label: 'אני מתחיל להבין',
    });

    // Stage 3 (7-11 user turns): 'יש לי את הכיוון והסיפור שלך'
    expect(getClarityStage(7, false)).toEqual({
      step: 3,
      label: 'יש לי את הכיוון והסיפור שלך',
    });
    expect(getClarityStage(10, false)).toEqual({
      step: 3,
      label: 'יש לי את הכיוון והסיפור שלך',
    });
    expect(getClarityStage(11, false)).toEqual({
      step: 3,
      label: 'יש לי את הכיוון והסיפור שלך',
    });

    // Stage 4 (12-15 user turns): 'אני מחבר את המילים והשירותים'
    expect(getClarityStage(12, false)).toEqual({
      step: 4,
      label: 'אני מחבר את המילים והשירותים',
    });
    expect(getClarityStage(14, false)).toEqual({
      step: 4,
      label: 'אני מחבר את המילים והשירותים',
    });
    expect(getClarityStage(15, false)).toEqual({
      step: 4,
      label: 'אני מחבר את המילים והשירותים',
    });

    // Stage 5 (16+ user turns or when finishing): 'יש לי את מה שאני צריך כדי להביא גרסה ראשונה, אני יוצא לעבודה. יש עוד משהו שחשוב שאני אדע?'
    const stage5Text = 'יש לי את מה שאני צריך כדי להביא גרסה ראשונה, אני יוצא לעבודה. יש עוד משהו שחשוב שאני אדע?';
    expect(getClarityStage(16, false)).toEqual({
      step: 5,
      label: stage5Text,
    });
    expect(getClarityStage(20, false)).toEqual({
      step: 5,
      label: stage5Text,
    });
    // Finishing early (e.g. at 5 turns)
    expect(getClarityStage(5, true)).toEqual({
      step: 5,
      label: stage5Text,
    });
  });

  it('next.config allows microphone for Web Speech API on self origin', async () => {
    if (typeof nextConfig.headers === 'function') {
      const headers = await nextConfig.headers();
      const allRoutes = headers.find((h) => h.source === '/(.*)');
      const permPolicy = allRoutes?.headers.find((hdr) => hdr.key === 'Permissions-Policy');
      expect(permPolicy?.value).toContain('microphone=(self)');
    }
  });
});
