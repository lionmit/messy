'use client';

import { useRef } from 'react';

interface MediaUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function MediaUpload({ onFileSelected, disabled }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      // Reset so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*,.pdf,.doc,.docx"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full
          bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Upload a file"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
    </>
  );
}
