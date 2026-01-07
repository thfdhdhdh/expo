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
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
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

// Генерация уровней с адаптивной сложностью
const generateLevels = () => {
  return Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    let range = [1, 9];
    
    if (id <= 5) range = [2, 5];
    else if (id <= 10) range = [2, 10];
    else if (id <= 20) range = [3, 12];
    else if (id <= 30) range = [5, 15];
    else if (id <= 40) range = [8, 18];
    else range = [10, 20];

    let type = 'exercise';
    if (id % 5 === 0) type = 'chest';
    if (id % 10 === 0) type = 'trophy';

    return {
      id,
      title: `Уровень ${id}`,
      isUnlocked: id === 1,
      isCompleted: false,
      range,
      type,
      xpReward: 10,
    };
  });
};

// Адаптивный алгоритм генерации задач
const generateProblems = (level, userAccuracy = 0) => {
  const problems = [];
  const minRange = level.range[0];
  const maxRange = level.range[1];
  
  // Адаптируем сложность на основе точности пользователя
  const adjustedMaxRange = userAccuracy > 90 
    ? Math.min(maxRange + 2, 20) 
    : userAccuracy < 50 
    ? Math.max(maxRange - 2, minRange)
    : maxRange;

  for (let i = 0; i < PROBLEMS_PER_LEVEL; i++) {
    const a = Math.floor(Math.random() * (adjustedMaxRange - minRange + 1)) + minRange;
    const b = Math.floor(Math.random() * (adjustedMaxRange - minRange + 1)) + minRange;
    problems.push({
      a,
      b,
      id: `${a}-${b}-${Date.now()}-${Math.random()}`,
      attempts: 0,
      timeSpent: 0,
    });
  }

  return problems;
};

// Звуковые эффекты (заглушки для Expo Snack)
const playSound = async (soundType) => {
  try {
    // В реальном приложении здесь будут звуки
    console.log(`Playing sound: ${soundType}`);
  } catch (error) {
    console.log('Sound error:', error);
  }
};

// Иконки
const Icon = ({ name, size = 24, color = '#fff', style }) => {
  const icons = {
    check: '✓',
    trophy: '🏆',
    star: '⭐',
    fire: '🔥',
    arrowRight: '→',
    lock: '🔒',
    chevronLeft: '←',
    user: '👤',
    barChart: '📊',
    zap: '⚡',
    package: '📦',
    x: '✕',
    crown: '👑',
    medal: '🏅',
    target: '🎯',
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {icons[name] || '•'}
    </Text>
  );
};

export default function App() {
  // Состояния
  const [levels, setLevels] = useState(() => generateLevels());
  const [userProfile, setUserProfile] = useState({
    totalXp: 0,
    levelsCompleted: 0,
    accuracy: 0,
    totalQuestions: 0,
    correctQuestions: 0,
    currentStreak: 0,
    longestStreak: 0,
    fastestTime: null,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [feedback, setFeedback] = useState('none');
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0, totalTime: 0 });
  const [input, setInput] = useState('');
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [activeTab, setActiveTab] = useState('learn');
  const [problemStartTime, setProblemStartTime] = useState(null);

  // Анимации
  const progressAnim = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const streakScale = useSharedValue(1);
  const xpScale = useSharedValue(1);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('math-profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }

      const savedLevels = await AsyncStorage.getItem('math-levels');
      if (savedLevels) {
        setLevels(JSON.parse(savedLevels));
      }

      const savedLeaderboard = await AsyncStorage.getItem('math-leaderboard');
      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  // Сохранение данных
  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('math-profile', JSON.stringify(userProfile));
      await AsyncStorage.setItem('math-levels', JSON.stringify(levels));
      await AsyncStorage.setItem('math-leaderboard', JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  }, [userProfile, levels, leaderboard]);

  useEffect(() => {
    saveData();
  }, [userProfile, levels, leaderboard]);

  // Обновление лидерборда
  const updateLeaderboard = useCallback((score) => {
    const newEntry = {
      id: Date.now(),
      name: 'Ученик',
      score: userProfile.totalXp + score,
      accuracy: userProfile.accuracy,
      streak: userProfile.currentStreak,
      timestamp: Date.now(),
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    setLeaderboard(updated);
  }, [leaderboard, userProfile]);

  // Начало уровня
  const startLevel = useCallback((levelId) => {
    const level = levels.find(l => l.id === levelId);
    if (!level || !level.isUnlocked) return;

    const newDeck = generateProblems(level, userProfile.accuracy);
    setCurrentLevelId(levelId);
    setQueue(newDeck);
    setCurrentProblem(newDeck[0]);
    setStats({ total: 0, correct: 0, wrong: 0, totalTime: 0 });
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
    setSelectedLevelId(null);
    setProblemStartTime(Date.now());
    
    progressAnim.value = 0;
    cardScale.value = 0.9;
    cardOpacity.value = 0;
    cardTranslateY.value = 20;
    
    setTimeout(() => {
      cardScale.value = withSpring(1);
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardTranslateY.value = withSpring(0);
    }, 50);
  }, [levels, userProfile.accuracy]);

  // Завершение уровня
  const completeLevel = useCallback(() => {
    if (!currentLevelId) return;
    
    const xpGained = stats.correct * 10;
    const avgTime = stats.totalTime / stats.total;
    const isFaster = !userProfile.fastestTime || avgTime < userProfile.fastestTime;
    
    const newTotalQuestions = userProfile.totalQuestions + stats.total;
    const newCorrectQuestions = userProfile.correctQuestions + stats.correct;
    const newAccuracy = Math.round((newCorrectQuestions / newTotalQuestions) * 100);
    const newStreak = stats.wrong === 0 ? userProfile.currentStreak + 1 : 0;

    const updatedProfile = {
      ...userProfile,
      totalXp: userProfile.totalXp + xpGained,
      levelsCompleted: Math.max(userProfile.levelsCompleted, currentLevelId),
      totalQuestions: newTotalQuestions,
      correctQuestions: newCorrectQuestions,
      accuracy: newAccuracy,
      currentStreak: newStreak,
      longestStreak: Math.max(userProfile.longestStreak, newStreak),
      fastestTime: isFaster ? avgTime : userProfile.fastestTime,
    };

    setUserProfile(updatedProfile);
    updateLeaderboard(xpGained);

    setLevels(prev => prev.map(l => {
      if (l.id === currentLevelId) return { ...l, isCompleted: true };
      if (l.id === currentLevelId + 1) return { ...l, isUnlocked: true };
      return l;
    }));

    setIsLevelCompleted(true);
    setCurrentProblem(null);
    
    // Анимация XP
    xpScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    playSound('levelComplete');
  }, [currentLevelId, stats, userProfile, updateLeaderboard]);

  // Проверка ответа
  const checkAnswer = useCallback(() => {
    if (!currentProblem || feedback !== 'none' || !input.trim()) return;

    Keyboard.dismiss();
    const num = parseInt(input, 10);
    if (isNaN(num)) return;

    const correctAnswer = currentProblem.a * currentProblem.b;
    const timeSpent = Date.now() - problemStartTime;

    if (num === correctAnswer) {
      setFeedback('correct');
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: prev.correct + 1,
        totalTime: prev.totalTime + timeSpent,
      }));
      
      progressAnim.value = withTiming(((stats.correct + 1) / PROBLEMS_PER_LEVEL) * 100);
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1)
      );

      // Анимация стрейка
      streakScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );

      playSound('correct');

      setTimeout(() => {
        const remaining = queue.slice(1);
        if (remaining.length === 0) {
          completeLevel();
        } else {
          setFeedback('none');
          setInput('');
          setQueue(remaining);
          setCurrentProblem(remaining[0]);
          setProblemStartTime(Date.now());
          
          cardScale.value = 0.9;
          cardOpacity.value = 0;
          cardTranslateY.value = 20;
          
          setTimeout(() => {
            cardScale.value = withSpring(1);
            cardOpacity.value = withTiming(1);
            cardTranslateY.value = withSpring(0);
          }, 50);
        }
      }, 1500);
    } else {
      setFeedback('incorrect');
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        wrong: prev.wrong + 1,
        totalTime: prev.totalTime + timeSpent,
      }));
      
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withSpring(1)
      );

      playSound('incorrect');
    }
  }, [currentProblem, input, feedback, queue, stats, completeLevel, problemStartTime]);

  // Пропуск после ошибки
  const skipAfterError = useCallback(() => {
    if (feedback === 'incorrect' && currentProblem) {
      const remaining = queue.slice(1);
      const problem = queue[0];
      const insertIdx = Math.min(remaining.length, 3);
      const newQueue = [
        ...remaining.slice(0, insertIdx),
        { ...problem, id: `${problem.a}-${problem.b}-${Date.now()}`, attempts: problem.attempts + 1 },
        ...remaining.slice(insertIdx)
      ];
      
      setFeedback('none');
      setInput('');
      setQueue(newQueue);
      setCurrentProblem(newQueue[0]);
      setProblemStartTime(Date.now());
      
      cardScale.value = 0.9;
      cardOpacity.value = 0;
      cardTranslateY.value = 20;
      
      setTimeout(() => {
        cardScale.value = withSpring(1);
        cardOpacity.value = withTiming(1);
        cardTranslateY.value = withSpring(0);
      }, 50);
    }
  }, [feedback, queue, currentProblem]);

  const exitToMenu = () => {
    setCurrentLevelId(null);
    setCurrentProblem(null);
    setQueue([]);
    setFeedback('none');
    setInput('');
    setIsLevelCompleted(false);
    setSelectedLevelId(null);
    setProblemStartTime(null);
  };

  // Анимированные стили
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

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  // Экран профиля
  if (showProfile) {
    return (
      <SafeAreaView style={styles.container}>
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
            <Animated.View style={[styles.xpBadgeProfile, xpAnimatedStyle]}>
              <Icon name="star" size={16} color={COLORS.sun} />
              <Text style={styles.xpTextProfile}>{userProfile.totalXp} XP</Text>
            </Animated.View>
          </View>

          {/* Стрейк */}
          <Animated.View style={[styles.streakCard, streakAnimatedStyle]}>
            <Icon name="fire" size={40} color={COLORS.fireAnt} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{userProfile.currentStreak} дней</Text>
              <Text style={styles.streakLabel}>Текущая серия</Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{userProfile.longestStreak}</Text>
              <Text style={styles.streakLabel}>Рекорд</Text>
            </View>
          </Animated.View>

          {/* Статистика */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="trophy" size={32} color={COLORS.sun} />
              <Text style={styles.statValue}>{userProfile.levelsCompleted}</Text>
              <Text style={styles.statLabel}>Уровней</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="target" size={32} color={COLORS.treeFrog} />
              <Text style={styles.statValue}>{userProfile.accuracy}%</Text>
              <Text style={styles.statLabel}>Точность</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="zap" size={32} color={COLORS.macaw} />
              <Text style={styles.statValue}>{userProfile.totalQuestions}</Text>
              <Text style={styles.statLabel}>Примеров</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="check" size={32} color={COLORS.treeFrog} />
              <Text style={styles.statValue}>{userProfile.correctQuestions}</Text>
              <Text style={styles.statLabel}>Верно</Text>
            </View>
          </View>

          {/* Достижения */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Достижения</Text>
            <View style={styles.achievementsList}>
              {userProfile.levelsCompleted >= 5 && (
                <View style={styles.achievementBadge}>
                  <Icon name="medal" size={32} color={COLORS.sun} />
                  <Text style={styles.achievementName}>Начинающий</Text>
                </View>
              )}
              {userProfile.levelsCompleted >= 10 && (
                <View style={styles.achievementBadge}>
                  <Icon name="crown" size={32} color={COLORS.sun} />
                  <Text style={styles.achievementName}>Профи</Text>
                </View>
              )}
              {userProfile.accuracy >= 90 && (
                <View style={styles.achievementBadge}>
                  <Icon name="star" size={32} color={COLORS.sun} />
                  <Text style={styles.achievementName}>Снайпер</Text>
                </View>
              )}
              {userProfile.currentStreak >= 7 && (
                <View style={styles.achievementBadge}>
                  <Icon name="fire" size={32} color={COLORS.fireAnt} />
                  <Text style={styles.achievementName}>В огне</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Экран лидерборда
  if (showLeaderboard) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => setShowLeaderboard(false)} style={styles.backButton}>
            <Icon name="chevronLeft" size={24} />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Лидеры</Text>
        </View>

        <ScrollView style={styles.leaderboardScroll}>
          {leaderboard.length === 0 ? (
            <View style={styles.emptyLeaderboard}>
              <Icon name="trophy" size={64} color={COLORS.hare} />
              <Text style={styles.emptyText}>Пока нет результатов</Text>
              <Text style={styles.emptySubtext}>Будьте первым в таблице лидеров!</Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => (
              <View key={entry.id} style={[
                styles.leaderboardItem,
                index === 0 && styles.leaderboardFirst,
                index === 1 && styles.leaderboardSecond,
                index === 2 && styles.leaderboardThird,
              ]}>
                <View style={styles.leaderboardRank}>
                  {index === 0 && <Icon name="crown" size={24} color={COLORS.sun} />}
                  {index === 1 && <Icon name="medal" size={24} color="#C0C0C0" />}
                  {index === 2 && <Icon name="medal" size={24} color="#CD7F32" />}
                  {index > 2 && <Text style={styles.rankNumber}>{index + 1}</Text>}
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>{entry.name}</Text>
                  <View style={styles.leaderboardStats}>
                    <Icon name="star" size={14} color={COLORS.sun} />
                    <Text style={styles.leaderboardXp}>{entry.score} XP</Text>
                    <Icon name="target" size={14} color={COLORS.treeFrog} style={{ marginLeft: 12 }} />
                    <Text style={styles.leaderboardAccuracy}>{entry.accuracy}%</Text>
                  </View>
                </View>
                {entry.streak > 0 && (
                  <View style={styles.leaderboardStreak}>
                    <Icon name="fire" size={16} color={COLORS.fireAnt} />
                    <Text style={styles.leaderboardStreakText}>{entry.streak}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Экран завершения уровня
  if (isLevelCompleted) {
    const avgTime = (stats.totalTime / stats.total / 1000).toFixed(1);
    
    return (
      <SafeAreaView style={styles.completionContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.completionContent}>
          <Animated.View style={{ transform: [{ scale: cardScale.value }] }}>
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
            <View style={styles.completionStatBox}>
              <Text style={[styles.completionStatValue, { color: COLORS.macaw }]}>
                {avgTime}с
              </Text>
              <Text style={styles.completionStatLabel}>СР. ВРЕМЯ</Text>
            </View>
          </View>

          <Animated.View style={[styles.xpCard, xpAnimatedStyle]}>
            <View>
              <Text style={styles.xpCardLabel}>Очки опыта</Text>
              <Text style={styles.xpCardValue}>+{stats.correct * 10} XP</Text>
            </View>
            <Icon name="star" size={40} color={COLORS.sun} />
          </Animated.View>

          {stats.wrong === 0 && (
            <View style={styles.perfectScore}>
              <Icon name="fire" size={24} color={COLORS.fireAnt} />
              <Text style={styles.perfectScoreText}>Безупречно!</Text>
            </View>
          )}

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
            <Animated.View style={[styles.xpBadgeSmall, streakAnimatedStyle]}>
              <Icon name="fire" size={14} color={COLORS.fireAnt} />
              <Text style={styles.xpBadgeSmallText}>{userProfile.currentStreak}</Text>
            </Animated.View>
          </View>

          <View style={styles.gameContent}>
            <Animated.View style={[styles.questionCard, cardAnimatedStyle]}>
              <Text style={styles.questionText}>
                {currentProblem?.a} × {currentProblem?.b}
              </Text>
            </Animated.View>

            <View style={styles.inputSection}>
              {feedback === 'incorrect' ? (
                <Animated.View
                  style={[
                    styles.correctAnswerBox,
                    { opacity: cardOpacity.value }
                  ]}
                >
                  <Text style={styles.correctAnswerLabel}>Правильный ответ</Text>
                  <Text style={styles.correctAnswerValue}>
                    {currentProblem ? currentProblem.a * currentProblem.b : ''}
                  </Text>
                </Animated.View>
              ) : (
                <TextInput
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

  // Главный экран
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
          <Animated.View style={[styles.xpBadgeHeader, streakAnimatedStyle]}>
            <Icon name="fire" size={20} color={COLORS.fireAnt} />
            <Text style={[styles.xpBadgeHeaderText, { color: COLORS.fireAnt }]}>
              {userProfile.currentStreak}
            </Text>
          </Animated.View>
          <View style={styles.xpBadgeHeader}>
            <Icon name="star" size={20} color={COLORS.sun} />
            <Text style={[styles.xpBadgeHeaderText, { color: COLORS.sun }]}>
              {userProfile.totalXp}
            </Text>
          </View>
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
          
          return (
            <View key={level.id} style={[styles.levelWrapper, { transform: [{ translateX: offset }] }]}>
              {isSelected && level.isUnlocked && !level.isCompleted && (
                <Animated.View style={styles.popover}>
                  <Text style={styles.popoverTitle}>Уровень {level.id}</Text>
                  <View style={styles.popoverInfo}>
                    <Icon name="star" size={16} color={COLORS.sun} />
                    <Text style={styles.popoverInfoText}>+{level.xpReward} XP</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.popoverButton}
                    onPress={() => startLevel(level.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.popoverButtonText}>Начать</Text>
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
            Учить
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'leaderboard' && styles.navItemActive]}
          onPress={() => {
            setActiveTab('leaderboard');
            setShowLeaderboard(true);
          }}
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
    marginBottom: 8,
  },
  popoverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  popoverInfoText: {
    color: COLORS.sun,
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 14,
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
    borderColor: COLORS.fireAnt,
    gap: 4,
  },
  xpBadgeSmallText: {
    color: COLORS.fireAnt,
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
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completionStatBox: {
    flex: 1,
    backgroundColor: COLORS.polar,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  completionStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completionStatLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.hare,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  xpCard: {
    width: '100%',
    backgroundColor: COLORS.polar,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  xpCardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.sun,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  xpCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  perfectScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.polar,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.fireAnt,
  },
  perfectScoreText: {
    color: COLORS.fireAnt,
    fontSize: 18,
    fontWeight: 'bold',
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
  profileScroll: {
    flex: 1,
  },
  profileContent: {
    paddingBottom: 100,
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.polar,
    padding: 20,
    margin: 16,
    borderRadius: 24,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    gap: 16,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.hare,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
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
    letterSpacing: 1,
  },
  achievementsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    backgroundColor: COLORS.polar,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 100,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  achievementName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  leaderboardScroll: {
    flex: 1,
    padding: 16,
  },
  emptyLeaderboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.hare,
    marginTop: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.polar,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  leaderboardFirst: {
    borderBottomColor: COLORS.sun,
  },
  leaderboardSecond: {
    borderBottomColor: '#C0C0C0',
  },
  leaderboardThird: {
    borderBottomColor: '#CD7F32',
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.hare,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardXp: {
    fontSize: 12,
    color: COLORS.sun,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leaderboardAccuracy: {
    fontSize: 12,
    color: COLORS.treeFrog,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leaderboardStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.snow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaderboardStreakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.fireAnt,
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
  navItemActive: {},
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
