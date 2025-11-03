import { useState } from 'react';

interface PresenterControlsProps {
  onSetQuestion: (text: string, password: string) => void;
  onClearAnswers: (password: string) => void;
  isPresenter: boolean;
  onTogglePresenter: () => void;
}

export function PresenterControls({
  onSetQuestion,
  onClearAnswers,
  isPresenter,
  onTogglePresenter,
}: PresenterControlsProps) {
  const [questionText, setQuestionText] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleSetQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionText.trim() && password) {
      onSetQuestion(questionText.trim(), password);
      setQuestionText('');
    }
  };

  const handleClearAnswers = () => {
    if (password && window.confirm('Clear all answers?')) {
      onClearAnswers(password);
    }
  };

  if (!isPresenter) {
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <button
          onClick={() => setShowPasswordInput(!showPasswordInput)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Presenter Mode
        </button>
        {showPasswordInput && (
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Presenter password"
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={onTogglePresenter}
              className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
            >
              Enter
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Presenter Controls</h2>
        <button
          onClick={onTogglePresenter}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Exit Presenter Mode
        </button>
      </div>

      <form onSubmit={handleSetQuestion} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question
          </label>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Presenter password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!questionText.trim() || !password}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Set Question
          </button>
          <button
            type="button"
            onClick={handleClearAnswers}
            disabled={!password}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Clear Answers
          </button>
        </div>
      </form>
    </div>
  );
}
