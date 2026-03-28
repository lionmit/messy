'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { InterviewPhase, ChatResponse } from '@/types';
import MessageBubble from './MessageBubble';
import PhaseIndicator from './PhaseIndicator';
import AudioRecorder from './AudioRecorder';
import MediaUpload from './MediaUpload';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string | null;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [phase, setPhase] = useState<InterviewPhase>('person');
  const [isComplete, setIsComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Send a message (text or transcribed voice) to the chat API.
   */
  const sendMessage = useCallback(
    async (text: string, inputMode: 'text' | 'voice' = 'text') => {
      if (isLoading) return;
      setIsLoading(true);

      // Show user message immediately (skip for initial greeting)
      if (text) {
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', content: text },
        ]);
      }
      setInputText('');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interviewId,
            message: text,
            input_mode: inputMode,
          }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const data: ChatResponse = await res.json();

        setInterviewId(data.interview_id);
        setPhase(data.phase);

        if (data.status === 'completed') {
          setIsComplete(true);
        }

        // Request TTS for assistant response (fire and forget)
        let audioUrl: string | null = null;
        try {
          const speakRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.message.slice(0, 500) }),
          });
          if (speakRes.ok) {
            const speakData = await speakRes.json();
            audioUrl = speakData.audio_url;
          }
        } catch {
          // TTS is optional — don't block
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            audioUrl,
          },
        ]);
      } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => [
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
    },
    [interviewId, isLoading]
  );

  // Auto-send initial greeting on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      sendMessage('');
    }
  }, [sendMessage]);

  /**
   * Handle voice recording completion.
   */
  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Transcription failed');

      const { text } = await res.json();
      if (text) {
        await sendMessage(text, 'voice');
      }
    } catch (err) {
      console.error('Voice input error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file upload.
   */
  const handleFileUpload = async (file: File) => {
    if (!interviewId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('interview_id', interviewId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        // Let the user know the file was uploaded
        await sendMessage(`[Uploaded: ${file.name}] ${url}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text);
  };

  /**
   * Handle Enter key (submit) vs Shift+Enter (newline).
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Phase indicator */}
      <PhaseIndicator currentPhase={phase} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            audioUrl={msg.audioUrl}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion banner */}
      {isComplete && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 text-center">
          <p className="text-amber-800 text-sm font-medium">
            Your identity document is ready.
          </p>
          <a
            href={`/result/${interviewId}`}
            className="inline-block mt-1 text-amber-600 underline text-sm hover:text-amber-700"
          >
            View your results
          </a>
        </div>
      )}

      {/* Input area */}
      {!isComplete && (
        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 max-w-2xl mx-auto"
          >
            <MediaUpload
              onFileSelected={handleFileUpload}
              disabled={isLoading || !interviewId}
            />

            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              disabled={isLoading}
            />

            <textarea
              ref={inputRef}
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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
