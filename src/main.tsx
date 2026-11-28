import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { HistoryProvider } from './hooks/useHistory';
import { QuizProvider } from './hooks/useQuiz';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HistoryProvider>
        <QuizProvider>
          <App />
        </QuizProvider>
      </HistoryProvider>
    </BrowserRouter>
  </StrictMode>,
);
