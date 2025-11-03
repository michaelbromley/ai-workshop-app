import { useState } from 'react';

interface AddAnswerProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export function AddAnswer({ onSubmit, disabled }: AddAnswerProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add your answer..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Add
        </button>
      </div>
    </form>
  );
}
