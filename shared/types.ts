export interface Question {
  id: string;
  text: string;
  createdAt: number;
}

export interface Answer {
  id: string;
  text: string;
  authorName: string;
  upvotes: number;
  createdAt: number;
}

export interface SessionData {
  sessionId: string;
  name: string;
  votedAnswerIds: string[];
}

// Socket.io event types
export interface ServerToClientEvents {
  'question-updated': (question: Question | null) => void;
  'answers-updated': (answers: Answer[]) => void;
  'answer-added': (answer: Answer) => void;
  'answer-upvoted': (answerId: string, upvotes: number) => void;
  'answer-deleted': (answerId: string) => void;
  'answers-cleared': () => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'set-question': (text: string, presenterPassword: string, callback: (success: boolean) => void) => void;
  'add-answer': (text: string, authorName: string, callback: (success: boolean, answer?: Answer) => void) => void;
  'upvote-answer': (answerId: string, callback: (success: boolean) => void) => void;
  'delete-answer': (answerId: string, presenterPassword: string, callback: (success: boolean) => void) => void;
  'clear-answers': (presenterPassword: string, callback: (success: boolean) => void) => void;
  'get-current-state': (callback: (question: Question | null, answers: Answer[]) => void) => void;
  'register-session': (name: string, callback: (sessionId: string) => void) => void;
}
