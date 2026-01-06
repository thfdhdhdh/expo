import { useMathTrainer } from '@/lib/math-engine';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Trophy, Star, ArrowRight, Lock, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function Home() {
  const { 
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
    exitToMenu,
    totalInLevel 
  } = useMathTrainer();
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback === 'none' && inputRef.current && !isLevelCompleted && currentLevelId) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [feedback, currentProblem, isLevelCompleted, currentLevelId]);

  if (currentLevelId === null) {
    return (
      <div className="min-h-screen bg-muted/30 p-8 font-sans">
        <div className="max-w-2xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-4">Математическое Додзё</h1>
            <p className="text-muted-foreground text-xl">Выбери уровень, чтобы начать тренировку</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <motion.button
                key={level.id}
                whileHover={level.isUnlocked ? { scale: 1.05 } : {}}
                whileTap={level.isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => startLevel(level.id)}
                disabled={!level.isUnlocked}
                className={`
                  relative aspect-square rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all border-b-[8px]
                  ${level.isUnlocked 
                    ? 'bg-white border-border/20 shadow-lg cursor-pointer' 
                    : 'bg-muted/50 border-transparent opacity-60 cursor-not-allowed'}
                  ${level.isCompleted ? 'ring-4 ring-success ring-offset-4' : ''}
                `}
              >
                <div className={`p-4 rounded-full ${level.isCompleted ? 'bg-success/20' : 'bg-primary/10'}`}>
                  {level.isUnlocked ? (
                    level.isCompleted ? (
                      <Check className="w-8 h-8 text-success" strokeWidth={3} />
                    ) : (
                      <Star className={`w-8 h-8 ${level.isUnlocked ? 'text-primary fill-primary' : 'text-muted'}`} />
                    )
                  ) : (
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <span className="font-display font-bold text-xl">{level.title}</span>
                {level.isCompleted && (
                  <div className="absolute top-4 right-4 bg-success text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Пройдено
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLevelCompleted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border-b-[10px] border-border/10 p-10 max-w-md w-full text-center"
        >
          <div className="mb-8 relative inline-block">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="bg-accent/10 p-8 rounded-full"
            >
              <Trophy className="w-20 h-20 text-accent" />
            </motion.div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-4 border-dashed border-accent/20 rounded-full"
            />
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Уровень пройден!</h1>
          <p className="text-muted-foreground mb-8 text-lg font-medium">Ты отлично справился!</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#E8F5E9] p-6 rounded-3xl border-b-4 border-[#C8E6C9] flex flex-col items-center">
              <div className="text-4xl font-display font-bold text-[#2E7D32] mb-1">{stats.correct}</div>
              <div className="text-[10px] font-bold text-[#4CAF50] uppercase tracking-widest">ВЕРНО</div>
            </div>
            <div className="bg-[#FFEBEE] p-6 rounded-3xl border-b-4 border-[#FFCDD2] flex flex-col items-center">
              <div className="text-4xl font-display font-bold text-[#C62828] mb-1">{stats.wrong}</div>
              <div className="text-[10px] font-bold text-[#EF5350] uppercase tracking-widest">ОШИБКИ</div>
            </div>
            <div className="col-span-2 bg-[#FFF8E1] p-6 rounded-3xl border-b-4 border-[#FFECB3] flex items-center justify-between px-10">
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#FFA000] uppercase tracking-widest mb-1">Очки опыта</div>
                <div className="text-3xl font-display font-bold text-[#FF8F00]">+{stats.correct * 10} XP</div>
              </div>
              <Star className="w-10 h-10 text-accent fill-accent" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d btn-3d-primary uppercase tracking-widest"
              onClick={() => startLevel(currentLevelId + 1)}
            >
              Дальше
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button 
              variant="ghost"
              className="w-full h-12 text-muted-foreground font-bold uppercase tracking-widest"
              onClick={exitToMenu}
            >
              В меню
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progressValue = (stats.correct / totalInLevel) * 100;

  return (
    <div 
      className="min-h-screen bg-muted/30 flex flex-col font-sans"
      onKeyDown={(e) => feedback === 'incorrect' && e.key === 'Enter' && skipAfterError()}
    >
      <header className="px-4 py-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-muted-foreground hover:bg-white"
            onClick={exitToMenu}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <Progress value={progressValue} className="h-4 bg-white border border-border/50 shadow-inner rounded-full" />
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
              key={currentProblem?.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] shadow-xl border-b-[10px] border-border/20 p-14 text-center"
            >
              <div className="text-8xl font-display font-bold text-foreground tracking-tight flex items-center justify-center gap-6">
                <span>{currentProblem?.a}</span>
                <span className="text-muted-foreground/30 font-light">×</span>
                <span>{currentProblem?.b}</span>
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
               <div className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] mb-2">Правильный ответ</div>
               <div className="text-7xl font-display font-bold text-success">
                 {currentProblem ? currentProblem.a * currentProblem.b : ''}
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
    </div>
  );
}
