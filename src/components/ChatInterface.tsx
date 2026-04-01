'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { InterviewPhase, ChatMessage, ChatResponse, IdentityDocument } from '@/types';
import MessageBubble from './MessageBubble';
import PhaseIndicator from './PhaseIndicator';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<InterviewPhase>('person');
  const [isComplete, setIsComplete] = useState(false);
  const [identityDoc, setIdentityDoc] = useState<IdentityDocument | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const callChat = useCallback(
    async (messages: ChatMessage[], currentPhase: InterviewPhase) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, phase: currentPhase }),
      });
      if (!res.ok) throw new Error('Chat request failed');
      return res.json() as Promise<ChatResponse>;
    },
    []
  );

  // Initial greeting on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      setIsLoading(true);
      try {
        const initMessages: ChatMessage[] = [
          { role: 'user', content: '[start interview]' },
        ];
        const data = await callChat(initMessages, 'person');

        setConversationHistory([
          { role: 'user', content: '[start interview]' },
          { role: 'assistant', content: data.message },
        ]);
        setDisplayMessages([
          { id: 'greeting', role: 'assistant', content: data.message },
        ]);
        setPhase(data.phase);
      } catch (err) {
        console.error('Init error:', err);
        setDisplayMessages([
          {
            id: 'error-init',
            role: 'assistant',
            content:
              "Hey! I'm having trouble starting up. Please refresh and try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [callChat]);

  const sendMessage = async (text: string) => {
    if (isLoading || !text.trim()) return;
    setIsLoading(true);

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...conversationHistory, userMsg];

    setConversationHistory(newHistory);
    setDisplayMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text },
    ]);
    setInputText('');

    try {
      const data = await callChat(newHistory, phase);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message,
      };
      const updatedHistory = [...newHistory, assistantMsg];

      setConversationHistory(updatedHistory);
      setPhase(data.phase);
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
        },
      ]);

      if (data.status === 'completed' && data.identity_document) {
        setIsComplete(true);
        setIdentityDoc(data.identity_document);
        sessionStorage.setItem(
          'messy-result',
          JSON.stringify(data.identity_document)
        );

        // Backup to Sheets (fire and forget)
        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity_document: data.identity_document,
            messages: updatedHistory.filter(
              (m) => m.content !== '[start interview]'
            ),
          }),
        }).catch((err) => console.error('Sheets backup failed:', err));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <PhaseIndicator currentPhase={phase} />

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {isComplete && identityDoc && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-4 text-center">
          <p className="text-amber-800 font-medium">
            Your identity document is ready.
          </p>
          <a
            href="/result/view"
            className="inline-block mt-2 px-6 py-2 rounded-full bg-amber-400
              hover:bg-amber-300 text-gray-950 text-sm font-semibold transition-colors"
          >
            View your identity
          </a>
        </div>
      )}

      {!isComplete && (
        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 max-w-2xl mx-auto"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300
                disabled:opacity-50 max-h-32"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-full
                bg-amber-400 hover:bg-amber-500 text-white transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
