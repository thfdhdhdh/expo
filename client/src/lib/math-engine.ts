import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export type MathProblem = {
  a: number;
  b: number;
  id: string; 
};

export type GameState = {
  status: 'idle' | 'playing' | 'completed';
  currentProblem: MathProblem | null;
  feedback: 'none' | 'correct' | 'incorrect';
  stats: {
    total: number;
    correct: number;
  };
};

// Generate all pairs 1-9
const generateDeck = (): MathProblem[] => {
  const deck: MathProblem[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      deck.push({ a, b, id: `${a}-${b}-${Math.random()}` });
    }
  }
  // Shuffle - Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export function useMathTrainer() {
  const [queue, setQueue] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [input, setInput] = useState('');

  // Initialize
  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = useCallback(() => {
    const newDeck = generateDeck();
    setQueue(newDeck);
    setCurrentProblem(newDeck[0]);
    setStats({ total: 0, correct: 0 });
    setFeedback('none');
    setInput('');
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentProblem) return;
    
    const num = parseInt(input, 10);
    if (isNaN(num)) return; // Ignore empty/invalid

    const correctAnswer = currentProblem.a * currentProblem.b;

    if (num === correctAnswer) {
      // Correct
      setFeedback('correct');
      setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#26cb7c', '#ffdd00', '#ffffff']
      });
      
      // Next card after delay
      setTimeout(() => {
        nextCard(true);
      }, 1000);
    } else {
      // Incorrect
      setFeedback('incorrect');
      // Do NOT increment "correct" stat, but increment "total" attempts? 
      // User requirements: "how many passed, how many correct".
      // Usually "total passed" means distinct problems resolved or total attempts.
      // Let's count total attempts.
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
    }
  }, [currentProblem, input]);

  const nextCard = (wasCorrect: boolean) => {
    setFeedback('none');
    setInput('');
    
    if (wasCorrect) {
      // Remove current from head
      const nextQueue = queue.slice(1);
      
      if (nextQueue.length === 0) {
        // Cycle Complete! Reshuffle and start over?
        // Or just keep going with a new deck?
        // Requirement: "after full circle - new cycle"
        const newDeck = generateDeck();
        setQueue(newDeck);
        setCurrentProblem(newDeck[0]);
      } else {
        setQueue(nextQueue);
        setCurrentProblem(nextQueue[0]);
      }
    } else {
      // Incorrect - Requeue
      // Requirement: "if wrong - return later in same cycle"
      // Let's move it 3-5 spots back, or to the end if < 5 items.
      const problem = queue[0];
      const remaining = queue.slice(1);
      
      // Insert back into queue
      const insertIdx = Math.min(remaining.length, 3 + Math.floor(Math.random() * 3));
      const newQueue = [
        ...remaining.slice(0, insertIdx),
        { ...problem, id: `${problem.a}-${problem.b}-${Math.random()}` }, // Give new ID to force re-render if needed
        ...remaining.slice(insertIdx)
      ];
      
      setQueue(newQueue);
      // Don't show new problem yet, we need to clear the feedback state first?
      // Actually, standard drill: Show correction -> User clicks "Next" or types correct answer?
      // Requirement: "show correct answer... not give new example until user answered"
      // Wait, "until answered" usually means they have to type the correct answer to proceed.
      // BUT, if I already showed them the answer, typing it is trivial.
      // Let's assume: Show error state with correct answer -> User presses Enter/Next to move on.
    }
  };

  const skipAfterError = useCallback(() => {
    // Call this to move on after viewing the error
    if (feedback === 'incorrect') {
      nextCard(false);
    }
  }, [feedback, queue]);

  return {
    currentProblem,
    feedback,
    stats,
    input,
    setInput,
    checkAnswer,
    skipAfterError
  };
}
