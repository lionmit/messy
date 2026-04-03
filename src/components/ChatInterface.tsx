'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
            content: "Hey! I'm having trouble starting up. Please refresh and try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
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
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.message };
      const updatedHistory = [...newHistory, assistantMsg];

      setConversationHistory(updatedHistory);
      setPhase(data.phase);
      setDisplayMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: data.message },
      ]);

      if (data.status === 'completed' && data.identity_document) {
        setIsComplete(true);
        setIdentityDoc(data.identity_document);
        sessionStorage.setItem('messy-result', JSON.stringify(data.identity_document));

        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity_document: data.identity_document,
            messages: updatedHistory.filter((m) => m.content !== '[start interview]'),
          }),
        }).catch((err) => console.error('Sheets backup failed:', err));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setDisplayMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
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
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
      >
        <Link
          href="/"
          className="font-[family-name:var(--font-space)] text-lg font-bold tracking-tight"
          style={{ color: 'var(--navy)', textDecoration: 'none' }}
        >
          m<span style={{ color: 'var(--yellow)' }}>e</span>ssy
        </Link>
        <PhaseIndicator currentPhase={phase} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full">
        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3 msg-assistant">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 font-[family-name:var(--font-space)] text-xs font-bold"
              style={{ background: 'var(--yellow-light)', color: 'var(--yellow-dark)' }}
            >
              M
            </div>
            <div
              className="px-5 py-3.5"
              style={{
                background: 'var(--surface)',
                borderRadius: '20px 20px 20px 6px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div className="flex gap-2">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion */}
      {isComplete && identityDoc && (
        <div
          className="px-5 py-4 text-center"
          style={{ background: 'var(--yellow-light)', borderTop: '2px solid var(--yellow)' }}
        >
          <p className="font-semibold text-base" style={{ color: 'var(--navy)' }}>
            Your identity document is ready.
          </p>
          <a href="/result/view" className="btn-cta" style={{ marginTop: '0.75rem', padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
            View your identity
          </a>
        </div>
      )}

      {/* Input */}
      {!isComplete && (
        <div className="px-4 py-3" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-light)', boxShadow: '0 -2px 12px rgba(26,26,46,0.04)' }}>
          <form onSubmit={handleSubmit} className="flex items-end gap-2.5 max-w-2xl mx-auto">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={isLoading}
              className="chat-input flex-1 resize-none px-4 py-3 text-[0.95rem] max-h-32"
            />
            <button type="submit" disabled={isLoading || !inputText.trim()} className="send-btn" aria-label="Send message">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
