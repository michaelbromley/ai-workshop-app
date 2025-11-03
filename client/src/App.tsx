import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useLocalStorage } from './hooks/useLocalStorage';
import { NameEntry } from './components/NameEntry';
import { QuestionDisplay } from './components/QuestionDisplay';
import { AnswerList } from './components/AnswerList';
import { AddAnswer } from './components/AddAnswer';
import { PresenterControls } from './components/PresenterControls';

function App() {
  const { socket, isConnected, question, answers } = useSocket();
  const [userName, setUserName] = useLocalStorage<string>('userName', '');
  const [_sessionId, setSessionId] = useLocalStorage<string>('sessionId', '');
  const [isPresenter, setIsPresenter] = useState(false);

  const handleNameSubmit = useCallback(
    (name: string) => {
      setUserName(name);
      // Register session with server
      socket?.emit('register-session', name, (sid) => {
        setSessionId(sid);
      });
    },
    [socket, setUserName, setSessionId]
  );

  const handleAddAnswer = useCallback(
    (text: string) => {
      if (!socket || !userName) return;
      socket.emit('add-answer', text, userName, (success) => {
        if (!success) {
          alert('Failed to add answer');
        }
      });
    },
    [socket, userName]
  );

  const handleUpvote = useCallback(
    (answerId: string) => {
      if (!socket) return;
      socket.emit('upvote-answer', answerId, (success) => {
        if (!success) {
          alert('Failed to upvote');
        }
      });
    },
    [socket]
  );

  const handleSetQuestion = useCallback(
    (text: string, password: string) => {
      if (!socket) return;
      socket.emit('set-question', text, password, (success) => {
        if (!success) {
          alert('Invalid password');
        }
      });
    },
    [socket]
  );

  const handleDeleteAnswer = useCallback(
    (answerId: string) => {
      if (!socket) return;
      const password = prompt('Enter presenter password:');
      if (password) {
        socket.emit('delete-answer', answerId, password, (success) => {
          if (!success) {
            alert('Invalid password');
          }
        });
      }
    },
    [socket]
  );

  const handleClearAnswers = useCallback(
    (password: string) => {
      if (!socket) return;
      socket.emit('clear-answers', password, (success) => {
        if (!success) {
          alert('Invalid password');
        }
      });
    },
    [socket]
  );

  // Show name entry if user hasn't entered their name
  if (!userName) {
    return <NameEntry onNameSubmit={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              AI Workshop Q&A
            </h1>
            <p className="text-gray-600">Welcome, {userName}!</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Presenter Controls */}
        <div className="mb-6">
          <PresenterControls
            onSetQuestion={handleSetQuestion}
            onClearAnswers={handleClearAnswers}
            isPresenter={isPresenter}
            onTogglePresenter={() => setIsPresenter(!isPresenter)}
          />
        </div>

        {/* Question Display */}
        <div className="mb-8">
          <QuestionDisplay question={question} />
        </div>

        {/* Add Answer */}
        {question && (
          <div className="mb-6">
            <AddAnswer onSubmit={handleAddAnswer} disabled={!isConnected} />
          </div>
        )}

        {/* Answers List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Answers ({answers.length})
            </h2>
          </div>
          <AnswerList
            answers={answers}
            onUpvote={handleUpvote}
            onDelete={isPresenter ? handleDeleteAnswer : undefined}
            canDelete={isPresenter}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
