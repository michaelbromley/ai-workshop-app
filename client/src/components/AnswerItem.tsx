import type { Answer } from '../types';

interface AnswerItemProps {
  answer: Answer;
  onUpvote: () => void;
  onDelete?: () => void;
  canDelete: boolean;
}

export function AnswerItem({ answer, onUpvote, onDelete, canDelete }: AnswerItemProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-lg mb-2 break-words">{answer.text}</p>
          <p className="text-sm text-gray-500">— {answer.authorName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUpvote}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            title="Upvote"
          >
            <span className="text-xl">👍</span>
            <span className="font-semibold text-gray-700">{answer.upvotes}</span>
          </button>
          {canDelete && onDelete && (
            <button
              onClick={onDelete}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-colors"
              title="Delete answer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
