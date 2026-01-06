import { useMathTrainer } from '@/lib/math-engine';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, RefreshCw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function Home() {
  const { currentProblem, feedback, stats, input, setInput, checkAnswer, skipAfterError } = useMathTrainer();
  const inputRef = useRef<HTMLInputElement>(null);

  // Percentage calculation
  const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 100;

  // Refocus input when moving to a new problem (feedback becomes 'none')
  useEffect(() => {
    if (feedback === 'none' && inputRef.current) {
      // Small timeout to allow render to settle if needed, but immediate usually works
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [feedback, currentProblem]);

  // Handle Enter Key for "Continue" after error
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (feedback === 'incorrect' && e.key === 'Enter') {
      skipAfterError();
    }
  };

  if (!currentProblem) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div 
      className="min-h-screen bg-muted/30 flex flex-col font-sans"
      onKeyDown={handleKeyDown}
    >
      {/* Header / Stats Bar */}
      <header className="px-4 py-6 max-w-md mx-auto w-full">
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-border/50">
          
          {/* Progress / Total Count */}
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              <span>Progress</span>
              <span>{stats.correct} / {stats.total}</span>
            </div>
            <Progress value={percentage} className="h-3 bg-secondary" />
          </div>

          {/* Percentage Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent-foreground rounded-full font-bold">
            <Trophy className="w-4 h-4 text-accent" />
            <span>{percentage}%</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full relative">
        
        {/* The Card */}
        <div className="w-full mb-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProblem.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white rounded-[2rem] shadow-xl border-b-[8px] border-border p-12 text-center"
            >
              <div className="text-8xl font-display font-bold text-foreground tracking-tight flex items-center justify-center gap-4">
                <span>{currentProblem.a}</span>
                <span className="text-muted-foreground/40">×</span>
                <span>{currentProblem.b}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="w-full max-w-[200px] mb-8 min-h-[80px]">
           {feedback === 'incorrect' ? (
             <div className="text-center animate-in fade-in zoom-in duration-300">
               <div className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">Correct Answer</div>
               <div className="text-6xl font-display font-bold text-success">
                 {currentProblem.a * currentProblem.b}
               </div>
             </div>
           ) : (
             <NumberInput
               ref={inputRef}
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onEnter={checkAnswer}
               disabled={feedback === 'correct'} // Disable during success animation
               isSuccess={feedback === 'correct'}
               placeholder="?"
             />
           )}
        </div>

        {/* Action Button */}
        <div className="w-full mt-auto mb-8">
          {feedback === 'none' && (
            <Button 
              className="w-full h-14 text-xl font-bold rounded-xl btn-3d btn-3d-primary uppercase tracking-wide cursor-pointer"
              onClick={checkAnswer}
              disabled={!input}
            >
              Check Answer
            </Button>
          )}

          {feedback === 'correct' && (
             <Button 
               className="w-full h-14 text-xl font-bold rounded-xl btn-3d btn-3d-success uppercase tracking-wide cursor-default pointer-events-none"
             >
               <Check className="w-6 h-6 mr-2" strokeWidth={3} />
               Great Job!
             </Button>
          )}

          {feedback === 'incorrect' && (
            <Button 
              className="w-full h-14 text-xl font-bold rounded-xl btn-3d btn-3d-destructive uppercase tracking-wide cursor-pointer"
              onClick={skipAfterError}
            >
              Got it
            </Button>
          )}
        </div>
      </main>
      
      {/* Footer Info */}
      <footer className="p-4 text-center text-muted-foreground text-sm font-medium opacity-50">
        Press Enter to confirm
      </footer>
    </div>
  );
}
