import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt, getPhasePrompt } from '@/lib/prompts';
import type { ChatRequest, ChatResponse, InterviewPhase, IdentityDocument } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

function cleanMessageText(text: string): string {
  return text
    .replace(/<phase>[\s\S]*?<\/phase>/g, '')
    .replace(/<identity>[\s\S]*?<\/identity>/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, phase } = body;

    const systemPrompt = getSystemPrompt(null);
    const phasePrompt = getPhasePrompt(phase);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `${systemPrompt}\n\n${phasePrompt}`,
      messages,
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const phaseTag = extractTagContent<{ phase: InterviewPhase }>(rawText, 'phase');
    const newPhase: InterviewPhase = phaseTag?.phase ?? phase;

    const identityDoc = extractTagContent<IdentityDocument>(rawText, 'identity');
    const cleanText = cleanMessageText(rawText);

    const chatResponse: ChatResponse = {
      message: cleanText,
      phase: newPhase,
      status: newPhase === 'complete' ? 'completed' : 'active',
      identity_document: identityDoc ?? null,
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
