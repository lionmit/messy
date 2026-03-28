// ─── Interview Lifecycle ──────────────────────────────────────────────

export type InterviewPhase = 'person' | 'offering' | 'brand' | 'assets' | 'complete';

export type InterviewStatus = 'active' | 'completed' | 'abandoned';

export type MessageRole = 'user' | 'assistant';

export type InputMode = 'text' | 'voice';

export type MediaType = 'image' | 'audio' | 'document' | 'link';

// ─── Database Records ─────────────────────────────────────────────────

export interface Interview {
  id: string;
  created_at: string;
  updated_at: string;
  phase: InterviewPhase;
  status: InterviewStatus;
  identity_document: IdentityDocument | null;
  language: string;
  gallery_opt_in: boolean;
}

export interface Message {
  id: string;
  interview_id: string;
  role: MessageRole;
  content: string;
  audio_url: string | null;
  input_mode: InputMode;
  phase: InterviewPhase;
  created_at: string;
}

export interface Media {
  id: string;
  interview_id: string;
  url: string;
  media_type: MediaType;
  label: string | null;
  created_at: string;
}

export interface GalleryEntry {
  id: string;
  interview_id: string;
  display_name: string;
  tagline: string;
  profession: string;
  avatar_url: string | null;
  site_url: string | null;
  identity_snapshot: Partial<IdentityDocument>;
  published_at: string;
}

// ─── Brand & Identity ─────────────────────────────────────────────────

export interface ServiceCard {
  name: string;
  description: string;
  audience: string;
  format: string;
}

export interface BrandProfile {
  emojis: string[];
  colors: string[];
  energy: string;
  tone: string;
  reference_sites: string[];
  language_notes: string;
}

export interface IdentityDocument {
  name: string;
  positioning_statement: string;
  through_line: string;
  origin_story: string;
  trigger: string;
  best_moment: string;
  audience: {
    ideal: string;
    not_for: string;
  };
  services: ServiceCard[];
  does_not_do: string[];
  brand: BrandProfile;
  assets: {
    links: string[];
    testimonials: string[];
    photos: string[];
    contact_cta: string;
  };
}

// ─── API Payloads ─────────────────────────────────────────────────────

export interface ChatRequest {
  interview_id?: string;
  message: string;
  input_mode: InputMode;
}

export interface ChatResponse {
  interview_id: string;
  message: string;
  phase: InterviewPhase;
  status: InterviewStatus;
  identity_document: IdentityDocument | null;
  audio_url: string | null;
}
