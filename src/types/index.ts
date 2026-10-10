export type { InterviewDocument, ServiceItem } from '@/lib/doc';
export type { Gender, TranscriptMessage as ChatMessage } from '@/lib/session';

/** POST /api/session response */
export interface SessionResponse {
  token: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  mac: string;
  limits: { max_user_message_chars: number; max_user_turns: number };
}

/** POST /api/chat response */
export interface ChatResponse {
  message?: string;
  user_message?: string;
  mac?: string;
  ready?: boolean;
  turns_left?: number;
  distress?: boolean;
  error?: string;
}

/** POST /api/finish response */
export interface FinishResponse {
  document?: import('@/lib/doc').InterviewDocument;
  expires_at?: string;
  delete_url?: string | null;
  delete_is_demo?: boolean;
  distress?: boolean;
  error?: string;
  field?: string;
}
