import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export type MathProblem = {
  a: number;
  b: number;
  id: string; 
};

export type Level = {
  id: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  range: [number, number];
};

const PROBLEMS_PER_LEVEL = 10;

export function useMathTrainer() {
  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem('math-dojo-levels');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Уровень ${i + 1}`,
      isUnlocked: i === 0,
      isCompleted: false,
      range: [1, 9]
    }));
  });

  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [queue, setQueue] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0 });
  const [input, setInput] = useState('');
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  useEffect(() => {
    localStorage.setItem('math-dojo-levels', JSON.stringify(levels));
  }, [levels]);

  const startLevel = useCallback((levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level || !level.isUnlocked) return;

    const newDeck = Array.from({ length: PROBLEMS_PER_LEVEL }, () => {
      const a = Math.floor(Math.random() * (level.range[1] - level.range[0] + 1)) + level.range[0];
      const b = Math.floor(Math.random() * (level.range[1] - level.range[0] + 1)) + level.range[0];
      return { a, b, id: `${a}-${b}-${Math.random()}` };
    });

    setCurrentLevelId(levelId);
    setQueue(newDeck);
    setCurrentProblem(newDeck[0]);
    setStats({ total: 0, correct: 0, wrong: 0 });
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
  }, [levels]);

  const completeLevel = useCallback(() => {
    if (!currentLevelId) return;
    
    setLevels(prev => prev.map(l => {
      if (l.id === currentLevelId) return { ...l, isCompleted: true };
      if (l.id === currentLevelId + 1) return { ...l, isUnlocked: true };
      return l;
    }));
    setIsLevelCompleted(true);
    setCurrentProblem(null);
    
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [currentLevelId]);

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

      setTimeout(() => {
        const remaining = queue.slice(1);
        if (remaining.length === 0) {
          completeLevel();
        } else {
          setFeedback('none');
          setInput('');
          setQueue(remaining);
          setCurrentProblem(remaining[0]);
        }
      }, 1000);
    } else {
      setFeedback('incorrect');
      setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
    }
  }, [currentProblem, input, feedback, queue, completeLevel]);

  const skipAfterError = useCallback(() => {
    if (feedback === 'incorrect') {
      const remaining = queue.slice(1);
      const problem = queue[0];
      const insertIdx = Math.min(remaining.length, 2);
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
    levels,
    currentLevelId,
    currentProblem,
    feedback,
    stats,
    input,
    setInput,
    checkAnswer,
    skipAfterError,
    isLevelCompleted,
    startLevel,
    exitToMenu: () => setCurrentLevelId(null),
    totalInLevel: PROBLEMS_PER_LEVEL
  };
}
