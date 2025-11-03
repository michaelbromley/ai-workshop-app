import type { Question } from '../types';

interface QuestionDisplayProps {
  question: Question | null;
}

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  if (!question) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-lg">Waiting for a question...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
        {question.text}
      </h1>
    </div>
  );
}
