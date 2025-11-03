import Database from 'better-sqlite3';
import { Question, Answer } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - in production, use volume mount
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/workshop.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      author_name TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      session_id TEXT NOT NULL,
      answer_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (session_id, answer_id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id),
      FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized');
}

// Question operations
export function getCurrentQuestion(): Question | null {
  const row = db.prepare('SELECT * FROM questions ORDER BY created_at DESC LIMIT 1').get() as any;
  if (!row) return null;
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export function setQuestion(text: string): Question {
  const id = uuidv4();
  const createdAt = Date.now();

  // Clear existing questions (only one active question at a time)
  db.prepare('DELETE FROM questions').run();

  db.prepare('INSERT INTO questions (id, text, created_at) VALUES (?, ?, ?)').run(
    id,
    text,
    createdAt
  );

  return { id, text, createdAt };
}

// Answer operations
export function getAnswers(): Answer[] {
  const rows = db.prepare('SELECT * FROM answers ORDER BY created_at ASC').all() as any[];
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    authorName: row.author_name,
    upvotes: row.upvotes,
    createdAt: row.created_at,
  }));
}

export function addAnswer(text: string, authorName: string): Answer {
  const id = uuidv4();
  const createdAt = Date.now();

  db.prepare(
    'INSERT INTO answers (id, text, author_name, upvotes, created_at) VALUES (?, ?, ?, 0, ?)'
  ).run(id, text, authorName, createdAt);

  return {
    id,
    text,
    authorName,
    upvotes: 0,
    createdAt,
  };
}

export function upvoteAnswer(answerId: string, sessionId: string): number | null {
  // Check if already voted
  const existingVote = db
    .prepare('SELECT 1 FROM votes WHERE session_id = ? AND answer_id = ?')
    .get(sessionId, answerId);

  if (existingVote) {
    return null; // Already voted
  }

  // Record the vote
  db.prepare('INSERT INTO votes (session_id, answer_id, created_at) VALUES (?, ?, ?)').run(
    sessionId,
    answerId,
    Date.now()
  );

  // Increment upvotes
  db.prepare('UPDATE answers SET upvotes = upvotes + 1 WHERE id = ?').run(answerId);

  // Get updated count
  const row = db.prepare('SELECT upvotes FROM answers WHERE id = ?').get(answerId) as any;
  return row?.upvotes ?? null;
}

export function deleteAnswer(answerId: string): boolean {
  const result = db.prepare('DELETE FROM answers WHERE id = ?').run(answerId);
  return result.changes > 0;
}

export function clearAnswers(): void {
  db.prepare('DELETE FROM answers').run();
  db.prepare('DELETE FROM votes').run();
}

// Session operations
export function createSession(name: string): string {
  const sessionId = uuidv4();
  const createdAt = Date.now();

  db.prepare('INSERT INTO sessions (session_id, name, created_at) VALUES (?, ?, ?)').run(
    sessionId,
    name,
    createdAt
  );

  return sessionId;
}

export function getSession(sessionId: string): { sessionId: string; name: string } | null {
  const row = db
    .prepare('SELECT session_id, name FROM sessions WHERE session_id = ?')
    .get(sessionId) as any;

  if (!row) return null;

  return {
    sessionId: row.session_id,
    name: row.name,
  };
}

// Initialize on module load
initDatabase();
