import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const PROBLEMS_PER_LEVEL = 10;

// Цвета Duolingo
const COLORS = {
  snow: '#131f24',
  polar: '#1f2d33',
  swan: '#37464f',
  hare: '#52656d',
  macaw: '#1cb0f6',
  macawDark: '#1899d6',
  treeFrog: '#58cc02',
  treeFrogDark: '#3fa002',
  fireAnt: '#ff4b4b',
  fireAntDark: '#d32f2f',
  sun: '#ffdd00',
  sunDark: '#e6c600',
};

// Генерация уровней
const generateLevels = () => {
  return Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    let range = [1, 9];
    
    if (id <= 5) range = [1, 3 + id];
    else if (id <= 10) range = [2, 10];
    else if (id <= 20) range = [3, 12];
    else if (id <= 30) range = [5, 15];
    else if (id <= 40) range = [8, 18];
    else range = [1, 20];

    let type = 'exercise';
    if (id % 5 === 0) type = 'chest';
    if (id % 10 === 0) type = 'trophy';

    return {
      id,
      title: `Уровень ${id}`,
      isUnlocked: id === 1,
      isCompleted: false,
      range,
      type
    };
  });
};

// Генерация задач
const generateProblems = (level) => {
  return Array.from({ length: PROBLEMS_PER_LEVEL }, () => {
    const a = Math.floor(Math.random() * (level.range[1] - level.range[0] + 1)) + level.range[0];
    const b = Math.floor(Math.random() * (level.range[1] - level.range[0] + 1)) + level.range[0];
    return { a, b, id: `${a}-${b}-${Date.now()}-${Math.random()}` };
  });
};

// Иконки компоненты
const Icon = ({ name, size = 24, color = '#fff', style }) => {
  const icons = {
    check: '✓',
    trophy: '🏆',
    star: '⭐',
    arrowRight: '→',
    lock: '🔒',
    chevronLeft: '←',
    user: '👤',
    barChart: '📊',
    zap: '⚡',
    package: '📦',
    x: '✕',
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {icons[name] || '•'}
    </Text>
  );
};

export default function App() {
  const [levels, setLevels] = useState(() => generateLevels());
  const [userProfile, setUserProfile] = useState({
    totalXp: 0,
    levelsCompleted: 0,
    accuracy: 0,
    totalQuestions: 0,
    correctQuestions: 0,
  });
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [feedback, setFeedback] = useState('none');
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0 });
  const [input, setInput] = useState('');
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [activeTab, setActiveTab] = useState('learn');

  const inputRef = useRef(null);
  const progressAnim = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const popoverOpacity = useSharedValue(0);
  const popoverScale = useSharedValue(0.9);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('math-dojo-profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }

      const savedLevels = await AsyncStorage.getItem('math-dojo-levels');
      if (savedLevels) {
        const parsed = JSON.parse(savedLevels);
        if (parsed.length < 50) {
          const fullList = generateLevels();
          const merged = fullList.map(l => {
            const existing = parsed.find(p => p.id === l.id);
            return existing ? { ...l, ...existing } : l;
          });
          setLevels(merged);
        } else {
          setLevels(parsed);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  // Сохранение данных
  useEffect(() => {
    saveData();
  }, [levels, userProfile]);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('math-dojo-levels', JSON.stringify(levels));
      await AsyncStorage.setItem('math-dojo-profile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const startLevel = useCallback((levelId) => {
    const level = levels.find(l => l.id === levelId);
    if (!level || !level.isUnlocked) return;

    const newDeck = generateProblems(level);
    setCurrentLevelId(levelId);
    setQueue(newDeck);
    setCurrentProblem(newDeck[0]);
    setStats({ total: 0, correct: 0, wrong: 0 });
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
    setSelectedLevelId(null);
    
    progressAnim.value = 0;
    cardScale.value = 0.9;
    cardOpacity.value = 0;
    cardTranslateY.value = 20;
    
    setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
    }, 50);
  }, [levels, progressAnim, cardScale, cardOpacity, cardTranslateY]);

  const completeLevel = useCallback(() => {
    if (!currentLevelId) return;
    
    const xpGained = stats.correct * 10;
    const newTotalQuestions = userProfile.totalQuestions + stats.total;
    const newCorrectQuestions = userProfile.correctQuestions + stats.correct;
    const newAccuracy = newTotalQuestions > 0 
      ? Math.round((newCorrectQuestions / newTotalQuestions) * 100) 
      : 0;

    setUserProfile(prev => ({
      ...prev,
      totalXp: prev.totalXp + xpGained,
      levelsCompleted: Math.max(prev.levelsCompleted, currentLevelId),
      totalQuestions: newTotalQuestions,
      correctQuestions: newCorrectQuestions,
      accuracy: newAccuracy,
    }));

    setLevels(prev => prev.map(l => {
      if (l.id === currentLevelId) return { ...l, isCompleted: true };
      if (l.id === currentLevelId + 1) return { ...l, isUnlocked: true };
      return l;
    }));

    setIsLevelCompleted(true);
    setCurrentProblem(null);
  }, [currentLevelId, stats, userProfile]);

  const checkAnswer = useCallback(() => {
    if (!currentProblem || feedback !== 'none' || !input.trim()) return;

    Keyboard.dismiss();
    const num = parseInt(input, 10);
    if (isNaN(num)) return;

    const correctAnswer = currentProblem.a * currentProblem.b;

    if (num === correctAnswer) {
      setFeedback('correct');
      setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
      
      progressAnim.value = withTiming((prev.correct + 1) / PROBLEMS_PER_LEVEL * 100, { duration: 300 });
      
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );

      setTimeout(() => {
        const remaining = queue.slice(1);
        if (remaining.length === 0) {
          completeLevel();
        } else {
          setFeedback('none');
          setInput('');
          setQueue(remaining);
          setCurrentProblem(remaining[0]);
          
          cardScale.value = 0.9;
          cardOpacity.value = 0;
          cardTranslateY.value = 20;
          
          setTimeout(() => {
            cardScale.value = withSpring(1, { damping: 10, stiffness: 100 });
            cardOpacity.value = withTiming(1, { duration: 300 });
            cardTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
          }, 50);
        }
      }, 1000);
    } else {
      setFeedback('incorrect');
      setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
      
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    }
  }, [currentProblem, input, feedback, queue, completeLevel, progressAnim, cardScale, cardOpacity, cardTranslateY]);

  const skipAfterError = useCallback(() => {
    if (feedback === 'incorrect' && currentProblem) {
      const remaining = queue.slice(1);
      const problem = queue[0];
      const insertIdx = Math.min(remaining.length, 2);
      const newQueue = [
        ...remaining.slice(0, insertIdx),
        { ...problem, id: `${problem.a}-${problem.b}-${Date.now()}` },
        ...remaining.slice(insertIdx)
      ];
      
      setFeedback('none');
      setInput('');
      setQueue(newQueue);
      setCurrentProblem(newQueue[0]);
      
      cardScale.value = 0.9;
      cardOpacity.value = 0;
      cardTranslateY.value = 20;
      
      setTimeout(() => {
        cardScale.value = withSpring(1, { damping: 10, stiffness: 100 });
        cardOpacity.value = withTiming(1, { duration: 300 });
        cardTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
      }, 50);
    }
  }, [feedback, queue, currentProblem, cardScale, cardOpacity, cardTranslateY]);

  const exitToMenu = () => {
    setCurrentLevelId(null);
    setCurrentProblem(null);
    setQueue([]);
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
    setSelectedLevelId(null);
  };

  // Анимации
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
    opacity: cardOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const popoverAnimatedStyle = useAnimatedStyle(() => ({
    opacity: popoverOpacity.value,
    transform: [
      { scale: popoverScale.value },
      { translateY: interpolate(popoverScale.value, [0.9, 1], [10, 0], Extrapolate.CLAMP) },
    ],
  }));

  // Экран профиля
  if (showProfile) {
    return (
      <SafeAreaView style={styles.profileContainer}>
        <StatusBar barStyle="light-content" />
        <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileContent}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.backButton}>
              <Icon name="chevronLeft" size={24} />
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Профиль</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Icon name="user" size={48} color={COLORS.macaw} />
            </View>
            <Text style={styles.username}>Ученик</Text>
            <View style={styles.xpBadgeProfile}>
              <Icon name="star" size={16} color={COLORS.sun} />
              <Text style={styles.xpTextProfile}>{userProfile.totalXp} XP</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="zap" size={32} color={COLORS.macaw} />
              <Text style={styles.statValue}>{userProfile.levelsCompleted}</Text>
              <Text style={styles.statLabel}>Уровней</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="barChart" size={32} color={COLORS.treeFrog} />
              <Text style={styles.statValue}>{userProfile.accuracy}%</Text>
              <Text style={styles.statLabel}>Точность</Text>
            </View>
          </View>

          <View style={styles.detailedStats}>
            <View style={styles.detailedStatsHeader}>
              <Icon name="trophy" size={20} color={COLORS.sun} />
              <Text style={styles.detailedStatsTitle}>Статистика</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Всего ответов</Text>
              <Text style={styles.statRowValue}>{userProfile.totalQuestions}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Верных ответов</Text>
              <Text style={[styles.statRowValue, { color: COLORS.treeFrog }]}>
                {userProfile.correctQuestions}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Экран завершения уровня
  if (isLevelCompleted) {
    return (
      <SafeAreaView style={styles.completionContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.completionContent}>
          <Animated.View
            style={[
              { transform: [{ scale: cardScale.value }] },
            ]}
          >
            <Icon name="trophy" size={96} color={COLORS.sun} />
          </Animated.View>
          
          <Text style={styles.completionTitle}>Отлично!</Text>
          <Text style={styles.completionSubtitle}>Уровень {currentLevelId} пройден</Text>

          <View style={styles.completionStats}>
            <View style={styles.completionStatBox}>
              <Text style={[styles.completionStatValue, { color: COLORS.treeFrog }]}>
                {stats.correct}
              </Text>
              <Text style={styles.completionStatLabel}>ВЕРНО</Text>
            </View>
            <View style={styles.completionStatBox}>
              <Text style={[styles.completionStatValue, { color: COLORS.fireAnt }]}>
                {stats.wrong}
              </Text>
              <Text style={styles.completionStatLabel}>ОШИБКИ</Text>
            </View>
            <View style={[styles.completionStatBox, styles.completionXpBox]}>
              <View>
                <Text style={styles.completionXpLabel}>Очки опыта</Text>
                <Text style={styles.completionXpValue}>+{stats.correct * 10} XP</Text>
              </View>
              <Icon name="star" size={40} color={COLORS.sun} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              if (currentLevelId < levels.length) {
                startLevel(currentLevelId + 1);
              } else {
                exitToMenu();
              }
            }}
          >
            <Text style={styles.nextButtonText}>Дальше</Text>
            <Icon name="arrowRight" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={exitToMenu}>
            <Text style={styles.menuButtonText}>В меню</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Экран игры
  if (currentLevelId) {
    const progressValue = (stats.correct / PROBLEMS_PER_LEVEL) * 100;
    progressAnim.value = progressValue;

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.gameContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.gameHeader}>
            <TouchableOpacity onPress={exitToMenu} style={styles.exitButton}>
              <Icon name="x" size={24} color={COLORS.hare} />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
                  <View style={styles.progressBarInner} />
                </Animated.View>
              </View>
            </View>
            <View style={styles.xpBadgeSmall}>
              <Icon name="star" size={14} color={COLORS.sun} />
              <Text style={styles.xpBadgeSmallText}>{stats.correct * 10}</Text>
            </View>
          </View>

          <View style={styles.gameContent}>
            <Animated.View style={[styles.questionCard, cardAnimatedStyle]}>
              <Text style={styles.questionText}>
                {currentProblem?.a} × {currentProblem?.b}
              </Text>
            </Animated.View>

            <View style={styles.inputSection}>
              {feedback === 'incorrect' ? (
                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>Правильный ответ</Text>
                  <Text style={styles.correctAnswerValue}>
                    {currentProblem ? currentProblem.a * currentProblem.b : ''}
                  </Text>
                </View>
              ) : (
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    feedback === 'correct' && styles.inputCorrect,
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="?"
                  placeholderTextColor={COLORS.swan}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={checkAnswer}
                  editable={feedback === 'none'}
                />
              )}
            </View>

            <View style={styles.buttonSection}>
              {feedback === 'none' && (
                <TouchableOpacity
                  style={[styles.checkButton, !input.trim() && styles.checkButtonDisabled]}
                  onPress={checkAnswer}
                  disabled={!input.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.checkButtonText}>Проверить</Text>
                </TouchableOpacity>
              )}

              {feedback === 'correct' && (
                <TouchableOpacity style={styles.correctButton} disabled>
                  <Icon name="check" size={28} />
                  <Text style={styles.correctButtonText}>Верно!</Text>
                </TouchableOpacity>
              )}

              {feedback === 'incorrect' && (
                <TouchableOpacity
                  style={styles.incorrectButton}
                  onPress={skipAfterError}
                  activeOpacity={0.8}
                >
                  <Text style={styles.incorrectButtonText}>Понятно</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  // Главный экран с уровнями
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>М</Text>
          </View>
          <View>
            <Text style={styles.headerSubtitle}>МАТЕМАТИКА</Text>
            <Text style={styles.headerTitle}>Уровень {userProfile.levelsCompleted + 1}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpBadgeHeader}>
            <Icon name="zap" size={20} color={COLORS.macaw} />
            <Text style={styles.xpBadgeHeaderText}>{userProfile.levelsCompleted}</Text>
          </View>
          <View style={styles.xpBadgeHeader}>
            <Icon name="star" size={20} color={COLORS.sun} />
            <Text style={[styles.xpBadgeHeaderText, { color: COLORS.sun }]}>
              {userProfile.totalXp}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.avatarButton}>
            <Icon name="user" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.levelsScroll}
        contentContainerStyle={styles.levelsContent}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level, index) => {
          const offset = Math.sin(index * 0.8) * 60;
          const isSelected = selectedLevelId === level.id;
          
          if (isSelected && level.isUnlocked && !level.isCompleted) {
            popoverOpacity.value = withTiming(1, { duration: 200 });
            popoverScale.value = withSpring(1, { damping: 10, stiffness: 100 });
          } else {
            popoverOpacity.value = withTiming(0, { duration: 200 });
            popoverScale.value = withTiming(0.9, { duration: 200 });
          }

          return (
            <View key={level.id} style={[styles.levelWrapper, { transform: [{ translateX: offset }] }]}>
              {isSelected && level.isUnlocked && !level.isCompleted && (
                <Animated.View style={[styles.popover, popoverAnimatedStyle]}>
                  <Text style={styles.popoverTitle}>Уровень {level.id}</Text>
                  <TouchableOpacity
                    style={styles.popoverButton}
                    onPress={() => startLevel(level.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.popoverButtonText}>Начать: +10 Опыта</Text>
                  </TouchableOpacity>
                  <View style={styles.popoverTail} />
                </Animated.View>
              )}

              <TouchableOpacity
                style={[
                  styles.levelButton,
                  !level.isUnlocked && styles.levelButtonLocked,
                  level.isCompleted && styles.levelButtonCompleted,
                ]}
                onPress={() => {
                  if (level.isUnlocked && !level.isCompleted) {
                    setSelectedLevelId(isSelected ? null : level.id);
                  }
                }}
                disabled={!level.isUnlocked || level.isCompleted}
                activeOpacity={0.7}
              >
                {!level.isUnlocked ? (
                  <Icon name="lock" size={32} color={COLORS.hare} />
                ) : level.isCompleted ? (
                  <Icon name="check" size={32} />
                ) : level.type === 'chest' ? (
                  <Icon name="package" size={32} />
                ) : level.type === 'trophy' ? (
                  <Icon name="trophy" size={32} />
                ) : (
                  <Icon name="star" size={32} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Нижняя навигация */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'learn' && styles.navItemActive]}
          onPress={() => setActiveTab('learn')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, activeTab === 'learn' && styles.navLabelActive]}>
            Главная
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'practice' && styles.navItemActive]}
          onPress={() => setActiveTab('practice')}
        >
          <Text style={styles.navIcon}>📚</Text>
          <Text style={[styles.navLabel, activeTab === 'practice' && styles.navLabelActive]}>
            Учить
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'leaderboard' && styles.navItemActive]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={[styles.navLabel, activeTab === 'leaderboard' && styles.navLabelActive]}>
            Лидеры
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
          onPress={() => {
            setActiveTab('profile');
            setShowProfile(true);
          }}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Профиль
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.snow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.snow,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.swan,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.treeFrog,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.hare,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.polar,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    gap: 4,
  },
  xpBadgeHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.polar,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    borderColor: COLORS.swan,
  },
  levelsScroll: {
    flex: 1,
  },
  levelsContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 100,
  },
  levelWrapper: {
    marginBottom: 40,
    alignItems: 'center',
  },
  levelButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.macaw,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 8,
    borderBottomColor: COLORS.macawDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelButtonLocked: {
    backgroundColor: COLORS.swan,
    borderBottomColor: COLORS.polar,
  },
  levelButtonCompleted: {
    backgroundColor: COLORS.treeFrog,
    borderBottomColor: COLORS.treeFrogDark,
  },
  popover: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minWidth: 240,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  popoverTitle: {
    color: '#afafaf',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  popoverButton: {
    width: '100%',
    backgroundColor: COLORS.macaw,
    paddingVertical: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.macawDark,
    alignItems: 'center',
  },
  popoverButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  popoverTail: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e5e5e5',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.snow,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
    gap: 12,
  },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 16,
    backgroundColor: COLORS.swan,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.treeFrog,
    borderRadius: 8,
  },
  progressBarInner: {
    position: 'absolute',
    top: 4,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  xpBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.polar,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.sun,
    gap: 4,
  },
  xpBadgeSmallText: {
    color: COLORS.sun,
    fontWeight: 'bold',
    fontSize: 12,
  },
  gameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionCard: {
    backgroundColor: COLORS.polar,
    padding: 56,
    borderRadius: 40,
    marginBottom: 40,
    borderBottomWidth: 10,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    maxWidth: 400,
  },
  questionText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -2,
  },
  inputSection: {
    width: '100%',
    marginBottom: 40,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.swan,
    fontSize: 64,
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 10,
    width: 220,
    fontWeight: 'bold',
  },
  inputCorrect: {
    borderBottomColor: COLORS.treeFrog,
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
  },
  correctAnswerBox: {
    alignItems: 'center',
  },
  correctAnswerLabel: {
    color: COLORS.fireAnt,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  correctAnswerValue: {
    color: COLORS.treeFrog,
    fontSize: 64,
    fontWeight: 'bold',
  },
  buttonSection: {
    width: '100%',
    maxWidth: 400,
  },
  checkButton: {
    backgroundColor: COLORS.macaw,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderBottomWidth: 6,
    borderBottomColor: COLORS.macawDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  correctButton: {
    backgroundColor: COLORS.treeFrog,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.treeFrogDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  correctButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  incorrectButton: {
    backgroundColor: COLORS.fireAnt,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderBottomWidth: 6,
    borderBottomColor: COLORS.fireAntDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  incorrectButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  completionContainer: {
    flex: 1,
    backgroundColor: COLORS.snow,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  completionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: COLORS.hare,
    marginBottom: 40,
  },
  completionStats: {
    width: '100%',
    marginBottom: 40,
  },
  completionStatBox: {
    backgroundColor: COLORS.snow,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  completionXpBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completionStatLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.hare,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  completionXpLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.sun,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'left',
  },
  completionXpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextButton: {
    backgroundColor: COLORS.treeFrog,
    padding: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.treeFrogDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  menuButton: {
    padding: 16,
  },
  menuButtonText: {
    color: COLORS.hare,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: COLORS.snow,
  },
  profileScroll: {
    flex: 1,
  },
  profileContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: COLORS.polar,
    padding: 32,
    borderRadius: 30,
    alignItems: 'center',
    margin: 16,
    borderBottomWidth: 8,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(28, 176, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.macaw,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  xpBadgeProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 221, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.sun,
    gap: 6,
  },
  xpTextProfile: {
    color: COLORS.sun,
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: COLORS.polar,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.hare,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  detailedStats: {
    backgroundColor: COLORS.polar,
    padding: 24,
    borderRadius: 24,
    margin: 16,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  detailedStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailedStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statRowLabel: {
    color: COLORS.hare,
    fontSize: 16,
    fontWeight: '500',
  },
  statRowValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Активный элемент
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: COLORS.macaw,
  },
});
