import type { Answer } from '../types';
import { AnswerItem } from './AnswerItem';

interface AnswerListProps {
  answers: Answer[];
  onUpvote: (answerId: string) => void;
  onDelete?: (answerId: string) => void;
  canDelete: boolean;
}

export function AnswerList({ answers, onUpvote, onDelete, canDelete }: AnswerListProps) {
  // Sort by upvotes (descending), then by creation time (ascending)
  const sortedAnswers = [...answers].sort((a, b) => {
    if (b.upvotes !== a.upvotes) {
      return b.upvotes - a.upvotes;
    }
    return a.createdAt - b.createdAt;
  });

  if (sortedAnswers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No answers yet. Be the first to contribute!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedAnswers.map((answer) => (
        <AnswerItem
          key={answer.id}
          answer={answer}
          onUpvote={() => onUpvote(answer.id)}
          onDelete={onDelete ? () => onDelete(answer.id) : undefined}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
