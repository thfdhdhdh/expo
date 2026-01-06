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

const DEFAULT_LEVELS: Level[] = [
  { id: 1, title: 'Уровень 1', isUnlocked: true, isCompleted: false, range: [1, 3] },
  { id: 2, title: 'Уровень 2', isUnlocked: false, isCompleted: false, range: [1, 5] },
  { id: 3, title: 'Уровень 3', isUnlocked: false, isCompleted: false, range: [2, 7] },
  { id: 4, title: 'Уровень 4', isUnlocked: false, isCompleted: false, range: [2, 9] },
  { id: 5, title: 'Уровень 5', isUnlocked: false, isCompleted: false, range: [3, 10] },
  { id: 6, title: 'Уровень 6', isUnlocked: false, isCompleted: false, range: [5, 12] },
  { id: 7, title: 'Уровень 7', isUnlocked: false, isCompleted: false, range: [8, 15] },
  { id: 8, title: 'Уровень 8', isUnlocked: false, isCompleted: false, range: [10, 18] },
  { id: 9, title: 'Уровень 9', isUnlocked: false, isCompleted: false, range: [12, 20] },
  { id: 10, title: 'Уровень 10', isUnlocked: false, isCompleted: false, range: [1, 20] },
];

export function useMathTrainer() {
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('math-dojo-profile');
    if (saved) return JSON.parse(saved);
    return {
      totalXp: 0,
      levelsCompleted: 0,
      accuracy: 0,
      totalQuestions: 0,
      correctQuestions: 0
    };
  });

  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem('math-dojo-levels');
    if (saved) return JSON.parse(saved);
    return DEFAULT_LEVELS;
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

  useEffect(() => {
    localStorage.setItem('math-dojo-profile', JSON.stringify(userProfile));
  }, [userProfile]);

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
    
    const xpGained = stats.correct * 10;
    
    setUserProfile(prev => {
      const newTotalQuestions = prev.totalQuestions + stats.total;
      const newCorrectQuestions = prev.correctQuestions + stats.correct;
      return {
        ...prev,
        totalXp: prev.totalXp + xpGained,
        levelsCompleted: prev.levelsCompleted + 1,
        totalQuestions: newTotalQuestions,
        correctQuestions: newCorrectQuestions,
        accuracy: Math.round((newCorrectQuestions / newTotalQuestions) * 100)
      };
    });

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
  }, [currentLevelId, stats]);

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
    userProfile,
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
