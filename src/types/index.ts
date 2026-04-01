export type InterviewPhase = 'person' | 'offering' | 'brand' | 'assets' | 'complete';

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  phase: InterviewPhase;
}

export interface ChatResponse {
  message: string;
  phase: InterviewPhase;
  status: 'active' | 'completed';
  identity_document: IdentityDocument | null;
}
