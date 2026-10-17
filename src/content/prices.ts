/**
 * Mirror of the numbers in messy-sites/board/prices.json (lane1), copied 2026-10-10.
 * That file is the source of truth and every number in it is still a hypothesis
 * (Lionel, 2026-10-08). When it changes, change it here too.
 */
export const PRICES = {
  interview_price: 0,
  document_price: 0,
  golive_founding_price: 99,
  golive_list_price: 149,
  /** פגישת דיוק, one to one with Lionel (prices.json session_price). */
  session_price: 450,
  founding_open: true,
  hosting_months_included: 12,
  transcript_retention_days: 90,
  /** How long after the interview the site preview is promised, in hours of business days (no Friday, Saturday). */
  preview_ready_hours: 48,
  preview_ready_includes_weekend: false,
} as const;

/** "יום עסקים אחד", "יומיים עסקים", "3 ימי עסקים": the preview promise in words, from the number above. */
export function previewReadyWords(): string {
  const days = Math.max(1, Math.ceil(PRICES.preview_ready_hours / 24));
  const unit = PRICES.preview_ready_includes_weekend ? 'ימים' : 'ימי עסקים';
  if (days === 1) return PRICES.preview_ready_includes_weekend ? 'יום אחד' : 'יום עסקים אחד';
  if (days === 2) return PRICES.preview_ready_includes_weekend ? 'יומיים' : 'יומיים עסקים';
  return `${days} ${unit}`;
}

export function goLivePrice(): number {
  return PRICES.founding_open ? PRICES.golive_founding_price : PRICES.golive_list_price;
}
