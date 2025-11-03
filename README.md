# AI Workshop Q&A App

A real-time collaborative Q&A application for interactive workshops and presentations. Participants can submit answers and upvote others' contributions in real-time.

## Features

- **Real-time Collaboration**: Powered by Socket.io for instant updates
- **Simple & Intuitive**: Clean interface built with React and Tailwind CSS
- **Presenter Controls**: Password-protected moderation features
- **Upvoting System**: Participants can upvote answers (one vote per session)
- **Persistent Data**: SQLite database for data persistence across restarts
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Docker

## Quick Start

### Option 1: Docker (Recommended for Production)

1. **Clone and navigate to the directory**:
   ```bash
   cd ai-workshop-app
   ```

2. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   # Edit .env to set your PRESENTER_PASSWORD
   ```

3. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Access the app**:
   - Open http://localhost:3000 in your browser
   - Default presenter password: `workshop2024`

5. **View logs**:
   ```bash
   docker-compose logs -f
   ```

6. **Stop the app**:
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```

   This runs both the client (http://localhost:5173) and server (http://localhost:3000) concurrently.

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## Project Structure

```
ai-workshop-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (useSocket, useLocalStorage)
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Tailwind styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── db.ts           # SQLite database layer
│   │   ├── socket.ts       # Socket.io event handlers
│   │   └── server.ts       # Express server setup
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   └── types.ts            # Shared TypeScript types
├── data/                   # SQLite database (created at runtime)
├── Dockerfile
├── docker-compose.yml
└── package.json            # Root package with scripts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRESENTER_PASSWORD` | Password for presenter mode | `workshop2024` |
| `PORT` | Server port | `3000` |
| `DB_PATH` | SQLite database path | `./data/workshop.db` |
| `NODE_ENV` | Environment (development/production) | `development` |

## Usage

### As a Presenter

1. **Access Presenter Mode**:
   - Click "Presenter Mode" at the top of the page
   - Enter your presenter password

2. **Create a Question**:
   - Type your question in the question field
   - Enter your presenter password
   - Click "Set Question"

3. **Moderate Answers**:
   - Delete individual answers using the trash icon
   - Clear all answers with the "Clear Answers" button

### As a Participant

1. **Join the Session**:
   - Enter your name when prompted
   - Your name is saved locally for future visits

2. **Submit an Answer**:
   - Type your answer in the input field
   - Click "Add" to submit

3. **Upvote Answers**:
   - Click the thumbs-up icon on any answer
   - You can only vote once per answer

## API/Socket Events

### Client → Server

- `register-session`: Register a new session with a name
- `get-current-state`: Get current question and answers
- `set-question`: Create/update the question (presenter only)
- `add-answer`: Submit a new answer
- `upvote-answer`: Upvote an existing answer
- `delete-answer`: Delete an answer (presenter only)
- `clear-answers`: Clear all answers (presenter only)

### Server → Client

- `question-updated`: Question was created/updated
- `answers-updated`: Full answers list update
- `answer-added`: New answer was added
- `answer-upvoted`: Answer upvote count changed
- `answer-deleted`: Answer was removed
- `answers-cleared`: All answers were cleared
- `error`: Error message

## Deployment

### Deploy to Cloud (Example: DigitalOcean, AWS, etc.)

1. **Push to your server**:
   ```bash
   git clone <your-repo>
   cd ai-workshop-app
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   nano .env  # Set your PRESENTER_PASSWORD
   ```

3. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Set up reverse proxy** (optional, for HTTPS):
   - Use nginx or Traefik to proxy to port 3000
   - Set up SSL certificates with Let's Encrypt

### Database Persistence

The SQLite database is stored in the `./data` directory and is mounted as a volume in Docker. This ensures data persists across container restarts and redeployments.

To reset the database:
```bash
rm -rf ./data/workshop.db
```

## Development

### Available Scripts

- `npm run dev` - Run both client and server in development mode
- `npm run dev:client` - Run client only
- `npm run dev:server` - Run server only
- `npm run build` - Build both client and server
- `npm run start` - Start production server
- `npm run install:all` - Install dependencies for all packages

### TypeScript

The project uses TypeScript throughout with strict type checking enabled. Shared types are defined in `shared/types.ts` and used by both client and server.

## Troubleshooting

### Port already in use
If port 3000 is already in use, change the `PORT` environment variable:
```bash
PORT=3001 npm start
```

### Database locked error
SQLite uses WAL mode for better concurrency. If you still encounter locks, ensure:
- Only one server instance is running
- The `data/` directory has proper permissions

### WebSocket connection issues
- Ensure your firewall allows WebSocket connections
- If behind a reverse proxy, configure WebSocket support
- Check CORS settings in `server/src/server.ts`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
