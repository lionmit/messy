import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase';
import { getSystemPrompt, getPhasePrompt } from '@/lib/prompts';
import type {
  ChatRequest,
  ChatResponse,
  InterviewPhase,
  IdentityDocument,
  Message,
} from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extract a JSON payload from XML-style tags in the response text.
 */
function extractTagContent<T>(text: string, tag: string): T | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = text.match(regex);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as T;
  } catch {
    return null;
  }
}

/**
 * Strip phase/identity tags from the visible message text.
 */
function cleanMessageText(text: string): string {
  return text
    .replace(/<phase>[\s\S]*?<\/phase>/g, '')
    .replace(/<identity>[\s\S]*?<\/identity>/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, input_mode } = body;
    let { interview_id } = body;

    const sb = createServiceClient();

    // ── Create or retrieve interview ──────────────────────────────────

    let currentPhase: InterviewPhase = 'person';

    if (interview_id) {
      const { data: interview, error } = await sb
        .from('interviews')
        .select('*')
        .eq('id', interview_id)
        .single();

      if (error || !interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      }
      currentPhase = interview.phase as InterviewPhase;
    } else {
      const { data: newInterview, error } = await sb
        .from('interviews')
        .insert({ phase: 'person', status: 'active' })
        .select()
        .single();

      if (error || !newInterview) {
        return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
      }
      interview_id = newInterview.id;
    }

    // ── Save user message ─────────────────────────────────────────────

    if (message) {
      await sb.from('messages').insert({
        interview_id,
        role: 'user',
        content: message,
        input_mode,
        phase: currentPhase,
      });
    }

    // ── Build conversation history ────────────────────────────────────

    const { data: history } = await sb
      .from('messages')
      .select('role, content')
      .eq('interview_id', interview_id)
      .order('created_at', { ascending: true });

    const conversationMessages: { role: 'user' | 'assistant'; content: string }[] =
      (history ?? []).map((m: Pick<Message, 'role' | 'content'>) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // ── Fetch existing identity doc for context ───────────────────────

    const { data: currentInterview } = await sb
      .from('interviews')
      .select('identity_document')
      .eq('id', interview_id)
      .single();

    // ── Call Claude ───────────────────────────────────────────────────

    const systemPrompt = getSystemPrompt(currentInterview?.identity_document);
    const phasePrompt = getPhasePrompt(currentPhase);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `${systemPrompt}\n\n${phasePrompt}`,
      messages: conversationMessages,
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // ── Extract phase and identity from response ──────────────────────

    const phaseTag = extractTagContent<{ phase: InterviewPhase }>(rawText, 'phase');
    const newPhase: InterviewPhase = phaseTag?.phase ?? currentPhase;

    const identityDoc = extractTagContent<IdentityDocument>(rawText, 'identity');

    const cleanText = cleanMessageText(rawText);

    // ── Save assistant message ────────────────────────────────────────

    await sb.from('messages').insert({
      interview_id,
      role: 'assistant',
      content: cleanText,
      input_mode: 'text',
      phase: newPhase,
    });

    // ── Update interview ──────────────────────────────────────────────

    const updatePayload: Record<string, unknown> = { phase: newPhase };
    if (newPhase === 'complete') {
      updatePayload.status = 'completed';
    }
    if (identityDoc) {
      updatePayload.identity_document = identityDoc;
    }

    await sb.from('interviews').update(updatePayload).eq('id', interview_id);

    // ── Return response ───────────────────────────────────────────────

    const chatResponse: ChatResponse = {
      interview_id: interview_id!,
      message: cleanText,
      phase: newPhase,
      status: newPhase === 'complete' ? 'completed' : 'active',
      identity_document: identityDoc ?? null,
      audio_url: null,
    };

    return NextResponse.json(chatResponse);
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
