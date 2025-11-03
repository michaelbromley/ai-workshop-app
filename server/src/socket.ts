import { Server as SocketServer, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types.js';
import * as db from './db.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const PRESENTER_PASSWORD = process.env.PRESENTER_PASSWORD || 'workshop2024';

// Store session IDs for connected sockets
const socketSessions = new Map<string, string>();

export function setupSocketHandlers(io: SocketServer<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: TypedSocket) => {
    console.log('Client connected:', socket.id);

    // Get current state
    socket.on('get-current-state', (callback) => {
      const question = db.getCurrentQuestion();
      const answers = db.getAnswers();
      callback(question, answers);
    });

    // Register session
    socket.on('register-session', (name, callback) => {
      const sessionId = db.createSession(name);
      socketSessions.set(socket.id, sessionId);
      callback(sessionId);
      console.log(`Session registered: ${name} (${sessionId})`);
    });

    // Set question (presenter only)
    socket.on('set-question', (text, presenterPassword, callback) => {
      if (presenterPassword !== PRESENTER_PASSWORD) {
        callback(false);
        socket.emit('error', 'Invalid presenter password');
        return;
      }

      try {
        const question = db.setQuestion(text);
        io.emit('question-updated', question);
        callback(true);
        console.log('Question set:', text);
      } catch (error) {
        console.error('Error setting question:', error);
        callback(false);
        socket.emit('error', 'Failed to set question');
      }
    });

    // Add answer
    socket.on('add-answer', (text, authorName, callback) => {
      try {
        const answer = db.addAnswer(text, authorName);
        io.emit('answer-added', answer);
        callback(true, answer);
        console.log(`Answer added by ${authorName}:`, text);
      } catch (error) {
        console.error('Error adding answer:', error);
        callback(false);
        socket.emit('error', 'Failed to add answer');
      }
    });

    // Upvote answer
    socket.on('upvote-answer', (answerId, callback) => {
      const sessionId = socketSessions.get(socket.id);
      if (!sessionId) {
        callback(false);
        socket.emit('error', 'Session not registered');
        return;
      }

      try {
        const upvotes = db.upvoteAnswer(answerId, sessionId);
        if (upvotes === null) {
          callback(false);
          socket.emit('error', 'Already voted for this answer');
          return;
        }

        io.emit('answer-upvoted', answerId, upvotes);
        callback(true);
        console.log(`Answer ${answerId} upvoted by session ${sessionId}`);
      } catch (error) {
        console.error('Error upvoting answer:', error);
        callback(false);
        socket.emit('error', 'Failed to upvote answer');
      }
    });

    // Delete answer (presenter only)
    socket.on('delete-answer', (answerId, presenterPassword, callback) => {
      if (presenterPassword !== PRESENTER_PASSWORD) {
        callback(false);
        socket.emit('error', 'Invalid presenter password');
        return;
      }

      try {
        const success = db.deleteAnswer(answerId);
        if (success) {
          io.emit('answer-deleted', answerId);
          callback(true);
          console.log('Answer deleted:', answerId);
        } else {
          callback(false);
          socket.emit('error', 'Answer not found');
        }
      } catch (error) {
        console.error('Error deleting answer:', error);
        callback(false);
        socket.emit('error', 'Failed to delete answer');
      }
    });

    // Clear answers (presenter only)
    socket.on('clear-answers', (presenterPassword, callback) => {
      if (presenterPassword !== PRESENTER_PASSWORD) {
        callback(false);
        socket.emit('error', 'Invalid presenter password');
        return;
      }

      try {
        db.clearAnswers();
        io.emit('answers-cleared');
        callback(true);
        console.log('All answers cleared');
      } catch (error) {
        console.error('Error clearing answers:', error);
        callback(false);
        socket.emit('error', 'Failed to clear answers');
      }
    });

    socket.on('disconnect', () => {
      socketSessions.delete(socket.id);
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.io handlers configured');
  console.log(`Presenter password: ${PRESENTER_PASSWORD}`);
}
