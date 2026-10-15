/**
 * Registry of studio cases. One JSON per owner in this folder; adding an owner
 * means adding a file and one line here. Static imports keep the files inside
 * the server bundle (no runtime fs reads on Vercel).
 */
import maayan from './maayan.json';

export const STUDIO_CASES: Record<string, unknown> = {
  maayan,
};
