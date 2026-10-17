/** The pipeline's side of the store (README-web.md in messy-sites/pipeline). Exact paths. */
export const PIPELINE = {
  prefix: 'pipeline/',
  slugs: 'pipeline/_slugs.json',
  count: 'pipeline/_count.json',
  digest: 'pipeline/_digest.md',
  commands: 'pipeline/_commands/',
} as const;

export const statePathname = (slug: string) => `${PIPELINE.prefix}${slug}/state.json`;

/** The slug the pipeline gives a record it has not mapped yet: "i-" + the first 12 hex of the id. */
export const defaultSlug = (id: string) => `i-${id.slice(0, 12)}`;
