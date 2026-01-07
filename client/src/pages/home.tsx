import { useMathTrainer } from '@/lib/math-engine';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Trophy, Star, ArrowRight, Lock, ChevronLeft, User, BarChart3, Zap, Package, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'learn' | 'leaderboard'>('learn');
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback === 'none' && inputRef.current && !isLevelCompleted && currentLevelId) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [feedback, currentProblem, isLevelCompleted, currentLevelId]);

  const handleGlobalClick = () => {
    setSelectedLevelId(null);
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-[#131f24] text-white p-4 md:p-8 font-sans">
        <div className="max-w-md mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setShowProfile(false)} className="rounded-full text-white hover:bg-white/10">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-display font-bold">Профиль</h1>
          </header>

          <div className="bg-[#1f2d33] rounded-[2.5rem] p-8 border-b-8 border-black/20 mb-6 text-center">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-1">Ученик</h2>
            <div className="flex items-center justify-center gap-2 text-accent bg-accent/10 px-4 py-1 rounded-full w-fit mx-auto border border-accent/20">
              <Star className="w-4 h-4 fill-accent" />
              <span>{userProfile.totalXp} XP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1f2d33] p-6 rounded-3xl border-b-4 border-black/20 flex flex-col items-center">
              <Zap className="w-8 h-8 text-primary mb-2" />
              <div className="text-2xl font-display font-bold">{userProfile.levelsCompleted}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Уровней</div>
            </div>
            <div className="bg-[#1f2d33] p-6 rounded-3xl border-b-4 border-black/20 flex flex-col items-center">
              <BarChart3 className="w-8 h-8 text-success mb-2" />
              <div className="text-2xl font-display font-bold">{userProfile.accuracy}%</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Точность</div>
            </div>
          </div>

          <div className="bg-[#1f2d33] p-6 rounded-3xl border-b-4 border-black/20">
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
      <div className="min-h-screen bg-[#131f24] text-white font-sans overflow-x-hidden pb-24" onClick={handleGlobalClick}>
        {/* Duolingo Sticky Header */}
        <header className="sticky top-0 z-50 bg-[#131f24] border-b-2 border-[#37464f] p-4">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-[#1f2d33] px-3 py-1.5 rounded-xl border-b-2 border-black/20">
                  <Zap className="w-5 h-5 text-primary fill-primary" />
                  <span className="font-bold">{userProfile.levelsCompleted}</span>
               </div>
               <div className="flex items-center gap-2 bg-[#1f2d33] px-3 py-1.5 rounded-xl border-b-2 border-black/20 text-accent">
                  <Star className="w-5 h-5 fill-accent" />
                  <span className="font-bold">{userProfile.totalXp}</span>
               </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 w-10 p-0 border-b-2 border-black/20 bg-[#1f2d33] text-white border-[#37464f]"
              onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {activeTab === 'leaderboard' ? (
          <div className="max-w-md mx-auto py-8 px-4">
            <h1 className="text-2xl font-display font-bold mb-6 text-center">Таблица лидеров</h1>
            <div className="space-y-3">
              {[
                { name: 'Дмитрий', xp: 12500, rank: 1, avatar: '🦊' },
                { name: 'Анна', xp: 11200, rank: 2, avatar: '🐱' },
                { name: 'Ты', xp: userProfile.totalXp, rank: 3, avatar: '🦉', isUser: true },
                { name: 'Максим', xp: 8400, rank: 4, avatar: '🐼' },
                { name: 'Елена', xp: 7200, rank: 5, avatar: '🐨' },
                { name: 'Иван', xp: 6800, rank: 6, avatar: '🦁' },
                { name: 'Ольга', xp: 5400, rank: 7, avatar: '🐯' },
              ].map((leader) => (
                <div 
                  key={leader.name}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-b-4 ${
                    leader.isUser ? 'bg-primary/20 border-primary/40 ring-2 ring-primary/20' : 'bg-[#1f2d33] border-black/20'
                  }`}
                >
                  <div className="w-8 font-bold text-muted-foreground">{leader.rank}</div>
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">
                    {leader.avatar}
                  </div>
                  <div className="flex-1 font-bold">{leader.name}</div>
                  <div className="font-bold text-accent">{leader.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Level Path */
          <div className="max-w-md mx-auto py-12 px-4 flex flex-col items-center relative">
            {levels.map((level, index) => {
              const offset = Math.sin(index * 0.8) * 60;
              const isSelected = selectedLevelId === level.id;
              
              return (
                <div 
                  key={level.id} 
                  className="mb-10 last:mb-24 relative" 
                  style={{ 
                    transform: `translateX(${offset}px)`,
                    zIndex: isSelected ? 100 : levels.length - index 
                  }}
                >
                  {/* Popover Menu */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.9, y: -10, x: '-50%' }}
                        className="absolute top-full left-1/2 mt-6 z-50 bg-white rounded-2xl p-4 min-w-[240px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#e5e5e5]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-[#afafaf] font-bold text-xs mb-3 uppercase tracking-wider text-center">Уровень {level.id}</h3>
                        <button
                          className="w-full bg-[#1cb0f6] text-white font-bold py-4 rounded-2xl border-b-4 border-[#1899d6] active:translate-y-1 active:border-b-0 transition-all uppercase text-sm tracking-wide shadow-sm"
                          onClick={() => startLevel(level.id)}
                        >
                          Начать: +10 Опыта
                        </button>
                        {/* Popover Tail (Now at the top) */}
                        <div className="absolute bottom-[calc(100%-10px)] left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45 border-l-2 border-t-2 border-[#e5e5e5] z-[-1]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={level.isUnlocked ? { y: 6 } : {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (level.isUnlocked) {
                        setSelectedLevelId(isSelected ? null : level.id);
                      }
                    }}
                    disabled={!level.isUnlocked}
                    className={`
                      level-dot
                      ${level.isUnlocked 
                        ? level.isCompleted 
                          ? 'level-dot-completed' 
                          : 'level-dot-active'
                        : 'level-dot-locked'}
                    `}
                  >
                    {level.type === 'exercise' && (
                      level.isCompleted ? <Check className="w-8 h-8" strokeWidth={5} /> : <Star className="w-8 h-8 fill-current" />
                    )}
                    {level.type === 'chest' && <Package className="w-8 h-8" />}
                    {level.type === 'trophy' && <Trophy className="w-8 h-8" />}
                  </motion.button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#131f24] border-t-2 border-[#37464f] px-6 py-3 z-[200]">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button 
              onClick={() => setActiveTab('learn')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'learn' ? 'text-primary' : 'text-[#52656d]'}`}
            >
              <div className={`p-2 rounded-xl transition-all ${activeTab === 'learn' ? 'bg-primary/10 ring-2 ring-primary/20' : ''}`}>
                <Package className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Обучение</span>
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'leaderboard' ? 'text-accent' : 'text-[#52656d]'}`}
            >
              <div className={`p-2 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-accent/10 ring-2 ring-accent/20' : ''}`}>
                <Trophy className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Лидеры</span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  if (isLevelCompleted) {
    return (
      <div className="min-h-screen bg-[#131f24] flex items-center justify-center p-4 font-sans text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#1f2d33] rounded-[2.5rem] shadow-2xl border-b-[10px] border-black/20 p-10 max-w-md w-full text-center"
        >
          <div className="mb-8 relative inline-block">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", damping: 10, stiffness: 100 }}
             >
               <Trophy className="w-24 h-24 text-accent fill-accent/10" />
             </motion.div>
          </div>

          <h1 className="text-4xl font-display font-bold mb-2">Отлично!</h1>
          <p className="text-muted-foreground mb-8 text-lg">Уровень {currentLevelId} пройден</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#131f24] p-6 rounded-3xl border-b-4 border-black/20 flex flex-col items-center">
              <div className="text-4xl font-display font-bold text-[#58cc02] mb-1">{stats.correct}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ВЕРНО</div>
            </div>
            <div className="bg-[#131f24] p-6 rounded-3xl border-b-4 border-black/20 flex flex-col items-center">
              <div className="text-4xl font-display font-bold text-[#ff4b4b] mb-1">{stats.wrong}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ОШИБКИ</div>
            </div>
            <div className="col-span-2 bg-[#131f24] p-6 rounded-3xl border-b-4 border-black/20 flex items-center justify-between px-10">
              <div className="text-left">
                <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Очки опыта</div>
                <div className="text-3xl font-display font-bold text-white">+{stats.correct * 10} XP</div>
              </div>
              <Star className="w-10 h-10 text-accent fill-accent" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d-base btn-tree-frog uppercase tracking-widest"
              onClick={() => startLevel(currentLevelId + 1)}
            >
              Дальше
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button 
              variant="ghost"
              className="w-full h-12 text-[#52656d] font-bold uppercase tracking-widest"
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
      className="min-h-screen bg-[#131f24] flex flex-col font-sans text-white"
      onKeyDown={(e) => feedback === 'incorrect' && e.key === 'Enter' && skipAfterError()}
    >
      <header className="px-4 py-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-[#52656d] hover:bg-white/10"
            onClick={exitToMenu}
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </Button>
          <div className="flex-1">
            <div className="h-4 bg-[#37464f] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressValue}%` }}
                 className="h-full bg-[#58cc02] relative"
               >
                 <div className="absolute top-1 left-2 right-2 h-1 bg-white/20 rounded-full" />
               </motion.div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full font-bold text-sm border border-accent/20">
            <Star className="w-4 h-4 fill-accent" />
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
              className="bg-[#1f2d33] rounded-[2.5rem] shadow-xl border-b-[10px] border-black/20 p-14 text-center"
            >
              <div className="text-8xl font-display font-bold text-white tracking-tight flex items-center justify-center gap-6">
                <span>{currentProblem?.a}</span>
                <span className="text-[#37464f] font-light">×</span>
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
               <div className="text-[10px] font-bold text-[#ff4b4b] uppercase tracking-[0.2em] mb-2">Правильный ответ</div>
               <div className="text-7xl font-display font-bold text-[#58cc02]">
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
               className="bg-transparent text-white border-b-[#37464f] focus:border-b-[#1cb0f6]"
             />
           )}
        </div>

        <div className="w-full mt-auto mb-10">
          {feedback === 'none' && (
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d-base btn-macaw uppercase tracking-[0.1em]"
              onClick={checkAnswer}
              disabled={!input}
            >
              Проверить
            </Button>
          )}

          {feedback === 'correct' && (
             <Button 
               className="w-full h-16 text-xl font-bold rounded-2xl btn-3d-base btn-tree-frog uppercase tracking-[0.1em] pointer-events-none"
             >
               <Check className="w-7 h-7 mr-2" strokeWidth={5} />
               Верно!
             </Button>
          )}

          {feedback === 'incorrect' && (
            <Button 
              className="w-full h-16 text-xl font-bold rounded-2xl btn-3d-base btn-fire-ant uppercase tracking-[0.1em]"
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
