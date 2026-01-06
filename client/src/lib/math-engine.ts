import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export type MathProblem = {
  a: number;
  b: number;
  id: string; 
};

export type GameState = {
  status: 'playing' | 'completed';
  currentProblem: MathProblem | null;
  feedback: 'none' | 'correct' | 'incorrect';
  stats: {
    total: number;
    correct: number;
    wrong: number;
  };
};

const PROBLEMS_PER_LEVEL = 10;

const generateDeck = (count: number): MathProblem[] => {
  const deck: MathProblem[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    deck.push({ a, b, id: `${a}-${b}-${Math.random()}` });
  }
  return deck;
};

export function useMathTrainer() {
  const [queue, setQueue] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0 });
  const [input, setInput] = useState('');
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  const startNewLevel = useCallback(() => {
    const newDeck = generateDeck(PROBLEMS_PER_LEVEL);
    setQueue(newDeck);
    setCurrentProblem(newDeck[0]);
    setStats({ total: 0, correct: 0, wrong: 0 });
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
  }, []);

  useEffect(() => {
    startNewLevel();
  }, [startNewLevel]);

  const nextCard = (wasCorrect: boolean) => {
    setFeedback('none');
    setInput('');
    
    const remaining = queue.slice(1);
    
    if (wasCorrect) {
      if (remaining.length === 0) {
        setIsLevelCompleted(true);
        setCurrentProblem(null);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });
      } else {
        setQueue(remaining);
        setCurrentProblem(remaining[0]);
      }
    } else {
      const problem = queue[0];
      // Requeue the problem so it appears later
      const insertIdx = Math.min(remaining.length, 2 + Math.floor(Math.random() * 2));
      const newQueue = [
        ...remaining.slice(0, insertIdx),
        { ...problem, id: `${problem.a}-${problem.b}-${Math.random()}` },
        ...remaining.slice(insertIdx)
      ];
      setQueue(newQueue);
      // Wait for user to click "Got it"
    }
  };

  const checkAnswer = useCallback(() => {
    if (!currentProblem || feedback !== 'none') return;
    
    const num = parseInt(input, 10);
    if (isNaN(num)) return;

    const correctAnswer = currentProblem.a * currentProblem.b;

    if (num === correctAnswer) {
      setFeedback('correct');
      setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#26cb7c', '#ffdd00']
      });
      setTimeout(() => nextCard(true), 1000);
    } else {
      setFeedback('incorrect');
      setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
    }
  }, [currentProblem, input, feedback, queue]);

  const skipAfterError = useCallback(() => {
    if (feedback === 'incorrect') {
      const remaining = queue.slice(1);
      const problem = queue[0];
      const insertIdx = Math.min(remaining.length, 2 + Math.floor(Math.random() * 2));
      const newQueue = [
        ...remaining.slice(0, insertIdx),
        { ...problem, id: `${problem.a}-${problem.b}-${Math.random()}` },
        ...remaining.slice(insertIdx)
      ];
      
      setFeedback('none');
      setInput('');
      setQueue(newQueue);
      setCurrentProblem(newQueue[0]);
    }
  }, [feedback, queue]);

  return {
    currentProblem,
    feedback,
    stats,
    input,
    setInput,
    checkAnswer,
    skipAfterError,
    isLevelCompleted,
    startNewLevel,
    totalInLevel: PROBLEMS_PER_LEVEL
  };
}
