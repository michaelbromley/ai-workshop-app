import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Question, Answer } from '../types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    const socketInstance: TypedSocket = io({
      path: '/socket.io',
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Get current state when connecting
      socketInstance.emit('get-current-state', (q, a) => {
        setQuestion(q);
        setAnswers(a);
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('question-updated', (q) => {
      setQuestion(q);
    });

    socketInstance.on('answers-updated', (a) => {
      setAnswers(a);
    });

    socketInstance.on('answer-added', (answer) => {
      setAnswers((prev) => [...prev, answer]);
    });

    socketInstance.on('answer-upvoted', (answerId, upvotes) => {
      setAnswers((prev) =>
        prev.map((a) => (a.id === answerId ? { ...a, upvotes } : a))
      );
    });

    socketInstance.on('answer-deleted', (answerId) => {
      setAnswers((prev) => prev.filter((a) => a.id !== answerId));
    });

    socketInstance.on('answers-cleared', () => {
      setAnswers([]);
    });

    socketInstance.on('error', (message) => {
      console.error('Socket error:', message);
      alert(message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  return {
    socket,
    isConnected,
    question,
    answers,
  };
}
