# Code Review: AI Workshop Q&A Application
**Reviewer:** Nigel
**Date:** 2025-11-03
**Status:** Needs Work

---

## OVERALL ASSESSMENT

This is prototype-quality code that someone decided to ship. It'll work fine for a workshop with 10-20 people, but it's riddled with security holes, missing validation, and architectural shortcuts that'll bite you in production. The TypeScript usage is decent, but that's like having a nice paint job on a car with no brakes.

**Verdict:** Works for a demo. Not production-ready for anything beyond a one-time workshop with trusted participants.

---

## CRITICAL SECURITY ISSUES

### 1. Presenter Authentication is a Joke
**Location:** `server/src/socket.ts:7`, `client/src/components/PresenterControls.tsx`

```typescript
const PRESENTER_PASSWORD = process.env.PRESENTER_PASSWORD || 'workshop2024';
```

You're doing password comparison in plain text over WebSockets. No hashing, no timing-safe comparison, nothing. Every password check goes over the wire in cleartext, and anyone with browser dev tools can see it.

**Impact:** Any participant can open dev tools, watch the network tab, see the presenter enter their password, and become a presenter themselves. Game over.

**What's missing:**
- No session-based authentication after password verification
- No rate limiting on password attempts (I can brute force this in 30 seconds)
- Password travels with every single presenter action (set question, delete answer, clear answers)
- The client-side "presenter mode" toggle is pure UI theater - there's zero enforcement

---

### 2. Zero Input Validation on the Backend
**Location:** `server/src/socket.ts:52-62`

```typescript
socket.on('add-answer', (text, authorName, callback) => {
  try {
    const answer = db.addAnswer(text, authorName);
    io.emit('answer-added', answer);
    callback(true, answer);
  } catch (error) {
    // ...
  }
});
```

Where's the validation? I can send you:
- Empty strings (you trim on the client but not the server)
- 10MB of text
- Unicode exploits
- HTML/XSS payloads (though React escapes rendering, still bad practice)
- Author names with 10,000 characters

The frontend has `maxLength={500}` on the answer input, but that's client-side only - I can bypass it with a curl command.

**Impact:** I can fill your database with garbage, crash your app with oversized payloads, or at minimum make your UI unusable.

---

### 3. SQL Injection? Actually... Good Job Here

I'll give credit where it's due: You're using parameterized queries consistently throughout `server/src/db.ts`. The `better-sqlite3` library handles this properly:

```typescript
db.prepare('INSERT INTO answers (id, text, author_name, upvotes, created_at) VALUES (?, ?, ?, 0, ?)').run(
  id, text, authorName, createdAt
);
```

This is one of the few things you got right. No SQL injection vulnerabilities here.

---

## ARCHITECTURAL PROBLEMS

### 4. No Rate Limiting Anywhere
**Location:** `server/src/socket.ts`

Nothing stops me from:
- Creating 1000 sessions per second
- Submitting 100 answers per second
- Attempting password guesses at unlimited speed
- Upvoting every answer from a single session (wait, I can only vote once... but I can create unlimited sessions)

**Impact:** Trivial to DoS your workshop or spam the Q&A with garbage. The database will choke, the UI will be unusable, and everyone's experience is ruined.

---

### 5. Session Management is Half-Baked
**Location:** `server/src/socket.ts:10`, `client/src/App.tsx:13`

```typescript
// Server
const socketSessions = new Map<string, string>();

// Client
const [_sessionId, setSessionId] = useLocalStorage<string>('sessionId', '');
```

You're storing session-to-socket mappings in memory, which means:
- Server restart = everyone loses their voting history
- Can't scale horizontally (sticky sessions required)
- Reconnection creates a new session (always calls `createSession`)

On the client, you're storing `sessionId` in localStorage but **never using it**. The variable is prefixed with `_` because you know it's unused. This is sloppy AI-generated code that someone copy-pasted and didn't think through.

**Impact:** Users can vote multiple times by refreshing the page. The entire voting system is broken.

---

### 6. Error Handling is User-Hostile
**Location:** `client/src/hooks/useSocket.ts:57-60`, `client/src/App.tsx`

```typescript
socketInstance.on('error', (message) => {
  console.error('Socket error:', message);
  alert(message);
});

// Throughout App.tsx:
if (!success) {
  alert('Failed to add answer');
}
```

`alert()`? Really? In 2025? This is the error handling strategy?

**Impact:** Poor UX, no error recovery mechanism, and blocking alerts that stop the user from doing anything.

---

## CODE QUALITY ISSUES

### 7. Magic Strings Everywhere
**Location:** `shared/types.ts`, throughout codebase

In `shared/types.ts`, you define event names as string literals:
```typescript
'question-updated': (question: Question | null) => void;
'answer-added': (answer: Answer) => void;
```

Then throughout the code:
```typescript
io.emit('question-updated', question);
socketInstance.on('answer-added', (answer) => { ... });
```

If I typo `'question-updated'` as `'question-udpated'`, TypeScript won't catch it at compile time. You have typed events defined but you're still passing strings around like it's 2015.

**Better approach:** Extract event names as constants:
```typescript
export const SOCKET_EVENTS = {
  QUESTION_UPDATED: 'question-updated',
  ANSWER_ADDED: 'answer-added',
  // ...
} as const;
```

---

### 8. Inconsistent State Management
**Location:** `client/src/App.tsx:14`

```typescript
const [isPresenter, setIsPresenter] = useState(false);
```

Presenter mode is client-side state. That's it. There's no persistent session, no verification, nothing. If I refresh the page, I lose presenter mode and have to re-enter the password.

Meanwhile, `userName` is stored in localStorage and persists. Why the inconsistency? Either make both persistent or neither.

---

### 9. Database Transaction Safety
**Location:** `server/src/db.ts:117-140`

```typescript
export function upvoteAnswer(answerId: string, sessionId: string): number | null {
  const existingVote = db.prepare('SELECT 1 FROM votes WHERE session_id = ? AND answer_id = ?')
    .get(sessionId, answerId);
  if (existingVote) return null;

  db.prepare('INSERT INTO votes (session_id, answer_id, created_at) VALUES (?, ?, ?)')
    .run(sessionId, answerId, Date.now());
  db.prepare('UPDATE answers SET upvotes = upvotes + 1 WHERE id = ?').run(answerId);

  const row = db.prepare('SELECT upvotes FROM answers WHERE id = ?').get(answerId) as any;
  return row?.upvotes ?? null;
}
```

This is **not atomic**. Between the check and the insert, another request could sneak in. You need a transaction:

```typescript
const transaction = db.transaction(() => {
  // check, insert, update
});
transaction();
```

**Impact:** Race condition allows duplicate votes under high concurrency.

---

### 10. Type Safety Theater
**Location:** `server/src/db.ts` (throughout)

Look at this pattern repeated everywhere:

```typescript
const row = db.prepare('SELECT * FROM questions ...').get() as any;
```

You're casting to `any`, which defeats the entire purpose of TypeScript. You have no idea if the database actually returns what you expect. A schema change breaks your code at runtime, not compile time.

**Better:** Define actual database row types and cast to those, or use a query builder with type inference.

---

## MISSING FEATURES FOR PRODUCTION

### 11. No Database Migrations

Your schema is defined in code (`initDatabase()` in `server/src/db.ts`). What happens when you need to:
- Add a new column?
- Change a constraint?
- Migrate existing data?

Answer: You're screwed. No migration system means manual database surgery in production.

---

### 12. No Logging Strategy

You have `console.log()` scattered everywhere. In production, these go to stdout and are lost unless you set up log aggregation. You have:
- No log levels (info, warn, error)
- No structured logging
- No request IDs to trace events
- No performance metrics

---

### 13. No Monitoring or Observability

There's a `/health` endpoint (good!), but it only tells you if the server is running. It doesn't check:
- Database connectivity
- Socket.io functionality
- Memory usage
- Active connections

When something breaks at 2am, you'll have no idea what happened.

---

### 14. No Tests

Not a single test file. Not one. You're shipping this completely blind. How do you know:
- Voting logic works correctly?
- Session management prevents duplicate votes?
- Password validation actually works?

Answer: You don't.

---

## DEPLOYMENT AND CONFIGURATION ISSUES

### 15. Environment Variables Are Poorly Documented

The README mentions environment variables, but:
- No validation that required vars are set
- No type checking on env vars
- No defaults documented in code comments

---

### 16. Docker Setup Has Issues
**Location:** `Dockerfile`

```dockerfile
RUN mkdir -p /app/data
```

You create the data directory but don't set permissions. If running as non-root (which you should be), this could fail.

Also, you're running as root by default. No `USER` directive. Security 101.

---

## MINOR NITPICKS (But Still Annoying)

### 17. Unused Imports and Dead Code

`_sessionId` in App.tsx - you know it's unused because you prefixed it with `_`. Delete it or use it.

---

### 18. Inconsistent Code Style

Some files use single quotes, some use double quotes. Pick one. Your formatter should handle this.

---

### 19. Comments That State the Obvious

```typescript
// Get current state
socket.on('get-current-state', (callback) => {
```

This comment is useless. I can read the event name. Tell me **why** you're getting the current state, or when it's called, not **what** the code does.

---

### 20. "Any" Types Everywhere

```typescript
const row = db.prepare(...).get() as any;
```

If you're going to use TypeScript, actually use it. This `any` escape hatch is lazy.

---

## WHAT YOU GOT RIGHT

I'm not completely heartless. Here's what doesn't make me want to rewrite everything:

1. **TypeScript throughout** - Good. Strict mode enabled. Type definitions shared between client and server. This is the right foundation.

2. **Parameterized SQL queries** - No SQL injection vulnerabilities. You used `better-sqlite3` correctly.

3. **Socket.io typed events** - The event typing with `ServerToClientEvents` and `ClientToServerEvents` is solid architecture.

4. **React component structure** - Clean, focused components. No mega-components doing everything. Props are well-typed.

5. **Docker multi-stage build** - Efficient, separates build and runtime concerns.

6. **WAL mode for SQLite** - Shows you thought about concurrency. Good choice.

7. **Foreign key constraints** - Your schema has proper relationships with ON DELETE CASCADE.

---

## PRIORITIZED RECOMMENDATIONS

### Must Fix (Ship-Blockers)

1. **Implement proper authentication** - Issue session tokens after password verification, stop sending passwords with every request
2. **Add server-side input validation** - Max lengths, sanitization, required field checks
3. **Add rate limiting** - Per IP and per session, for all endpoints
4. **Fix session management** - Use existing sessionId from localStorage, don't recreate on reconnect
5. **Use database transactions** - Especially for upvote logic

### Should Fix (Before Real Users)

6. **Remove `any` types** - Define proper database row interfaces
7. **Add error boundaries** - Replace `alert()` with proper UI error handling
8. **Add basic tests** - At least for critical paths like voting and authentication
9. **Implement logging** - Structured logs with levels
10. **Add database migrations** - Use a tool like `node-pg-migrate` adapted for SQLite

### Nice to Have (Tech Debt)

11. **Extract magic strings** - Event names, error messages as constants
12. **Add request IDs** - For tracing socket events across logs
13. **Improve health check** - Actually verify database is working
14. **Add monitoring** - Metrics for active users, questions asked, etc.
15. **Run as non-root in Docker** - Basic security hygiene

---

## FINAL VERDICT

This code works for a demo. It's well-structured enough that it won't collapse under its own weight immediately. But it's **not production-ready** for anything beyond a one-time workshop with trusted participants.

The security issues alone should prevent you from deploying this publicly. The session management is broken by design. And the lack of validation means anyone with 5 minutes and a curl command can ruin your workshop.

If you're going to ship this, fix the must-fix items. If you're keeping it as a learning project, at least add tests so the next person (probably you in 6 months) can understand what it's supposed to do.

You've got decent TypeScript discipline and clean React components, which tells me you **can** write good code. You just didn't here. Probably rushed it. We've all been there. Now go fix it.

---

**Nigel**
*Senior Principal Engineer*
*Professional Code Curmudgeon*
