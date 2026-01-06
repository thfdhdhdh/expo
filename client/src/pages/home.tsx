import { useMathTrainer } from '@/lib/math-engine';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Trophy, Star, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function Home() {
  const { 
    currentProblem, 
    feedback, 
    stats, 
    input, 
    setInput, 
    checkAnswer, 
    skipAfterError, 
    isLevelCompleted, 
    startNewLevel,
    totalInLevel 
  } = useMathTrainer();
  
  const inputRef = useRef<HTMLInputElement>(null);

  const progressValue = (stats.correct / totalInLevel) * 100;

  useEffect(() => {
    if (feedback === 'none' && inputRef.current && !isLevelCompleted) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [feedback, currentProblem, isLevelCompleted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (feedback === 'incorrect' && e.key === 'Enter') {
      skipAfterError();
    }
  };

  if (isLevelCompleted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border-b-[10px] border-primary/20 p-10 max-w-md w-full text-center"
        >
          <div className="mb-6 relative inline-block">
            <div className="bg-accent/20 p-6 rounded-full">
              <Trophy className="w-20 h-20 text-accent animate-bounce" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-accent/30 rounded-full"
            />
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Уровень пройден!</h1>
          <p className="text-muted-foreground mb-8">Отличная работа, ты мастер таблицы умножения!</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-secondary/30 p-4 rounded-2xl border-b-4 border-secondary/50">
              <div className="text-3xl font-display font-bold text-secondary-foreground">{stats.correct}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Верно</div>
            </div>
            <div className="bg-destructive/10 p-4 rounded-2xl border-b-4 border-destructive/20">
              <div className="text-3xl font-display font-bold text-destructive">{stats.wrong}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ошибки</div>
            </div>
            <div className="col-span-2 bg-accent/10 p-4 rounded-2xl border-b-4 border-accent/20 flex items-center justify-between px-8">
              <div className="text-left">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Очки опыта</div>
                <div className="text-3xl font-display font-bold text-accent-foreground">+{stats.correct * 10} XP</div>
              </div>
              <Star className="w-8 h-8 text-accent fill-accent" />
            </div>
          </div>

          <Button 
            className="w-full h-16 text-xl font-bold rounded-2xl btn-3d btn-3d-primary uppercase tracking-widest"
            onClick={startNewLevel}
          >
            Следующий уровень
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentProblem) return null;

  return (
    <div 
      className="min-h-screen bg-muted/30 flex flex-col font-sans"
      onKeyDown={handleKeyDown}
    >
      <header className="px-4 py-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-muted-foreground hover:bg-white"
            onClick={startNewLevel}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Progress value={progressValue} className="h-4 bg-white border border-border/50 shadow-inner" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent-foreground rounded-full font-bold text-sm">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span>{stats.correct * 10}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full relative">
        <div className="w-full mb-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProblem.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] shadow-xl border-b-[10px] border-border/20 p-14 text-center"
            >
              <div className="text-8xl font-display font-bold text-foreground tracking-tight flex items-center justify-center gap-6">
                <span>{currentProblem.a}</span>
                <span className="text-muted-foreground/30 font-light">×</span>
                <span>{currentProblem.b}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-[220px] mb-10 min-h-[100px] flex flex-col justify-center">
           {feedback === 'incorrect' ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center"
             >
               <div className="text-xs font-bold text-destructive uppercase tracking-[0.2em] mb-2">Правильный ответ</div>
               <div className="text-7xl font-display font-bold text-success">
                 {currentProblem.a * currentProblem.b}
               </div>
             </motion.div>
           ) : (
             <NumberInput
               ref={inputRef}
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onEnter={checkAnswer}
               disabled={feedback === 'correct'}
               isSuccess={feedback === 'correct'}
               placeholder="?"
             />
           )}
        </div>

        <div className="w-full mt-auto mb-10">
          {feedback === 'none' && (
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d btn-3d-primary uppercase tracking-[0.1em]"
              onClick={checkAnswer}
              disabled={!input}
            >
              Проверить
            </Button>
          )}

          {feedback === 'correct' && (
             <Button 
               className="w-full h-16 text-xl font-bold rounded-2xl btn-3d btn-3d-success uppercase tracking-[0.1em] pointer-events-none"
             >
               <Check className="w-7 h-7 mr-2" strokeWidth={4} />
               Верно!
             </Button>
          )}

          {feedback === 'incorrect' && (
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d btn-3d-destructive uppercase tracking-[0.1em]"
              onClick={skipAfterError}
            >
              Понятно
            </Button>
          )}
        </div>
      </main>
      
      <footer className="p-6 text-center text-muted-foreground/40 text-xs font-bold uppercase tracking-widest">
        Нажми Enter для проверки
      </footer>
    </div>
  );
}
