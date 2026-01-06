import { useMathTrainer } from '@/lib/math-engine';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Trophy, Star, ArrowRight, Lock, ChevronLeft, User, BarChart3, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const { 
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
    exitToMenu,
    totalInLevel 
  } = useMathTrainer();
  
  const [showProfile, setShowProfile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback === 'none' && inputRef.current && !isLevelCompleted && currentLevelId) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [feedback, currentProblem, isLevelCompleted, currentLevelId]);

  if (showProfile) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8 font-sans">
        <div className="max-w-md mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setShowProfile(false)} className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-display font-bold">Профиль</h1>
          </header>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-b-8 border-border/10 mb-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-1">Ученик</h2>
            <div className="flex items-center justify-center gap-2 text-accent-foreground font-bold bg-accent/10 px-4 py-1 rounded-full w-fit mx-auto">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span>{userProfile.totalXp} XP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-6 rounded-3xl border-b-4 border-border/10 flex flex-col items-center">
              <Zap className="w-8 h-8 text-primary mb-2" />
              <div className="text-2xl font-display font-bold">{userProfile.levelsCompleted}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Уровней</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border-b-4 border-border/10 flex flex-col items-center">
              <BarChart3 className="w-8 h-8 text-success mb-2" />
              <div className="text-2xl font-display font-bold">{userProfile.accuracy}%</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Точность</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border-b-4 border-border/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Статистика
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Всего ответов</span>
                <span className="font-bold">{userProfile.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Верных ответов</span>
                <span className="font-bold text-success">{userProfile.correctQuestions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentLevelId === null) {
    return (
      <div className="min-h-screen bg-muted/30 p-8 font-sans">
        <div className="max-w-2xl mx-auto">
          <header className="mb-12 flex justify-between items-center">
            <div className="text-left">
              <h1 className="text-4xl font-display font-bold text-foreground">Додзё</h1>
              <p className="text-muted-foreground">Выбери свой путь</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-2xl h-14 w-14 p-0 border-b-4 border-border shadow-sm bg-white"
              onClick={() => setShowProfile(true)}
            >
              <User className="w-6 h-6 text-primary" />
            </Button>
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
                <div className="text-center">
                  <span className="font-display font-bold text-lg block">{level.title}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">До {level.range[1]}</span>
                </div>
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
