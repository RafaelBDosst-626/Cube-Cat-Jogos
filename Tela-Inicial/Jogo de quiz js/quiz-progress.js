(() => {
  const STORAGE_KEY = "cubeCatQuizProgressV1";
  const SESSION_HISTORY_KEY = "cubeCatQuizSessionHistoryV1";
  const PERFECT_RUN_KEY = "cubeCatQuizPerfectRunV1";
  const medals = ["bronze", "silver", "gold"];
  const medalLabels = { bronze: "Bronze", silver: "Prata", gold: "Ouro" };
  const pointsPerAnswer = { easy: 100, medium: 150, hard: 200 };
  // Keep these topic IDs in sync with each folder; adding one resets its all-quizzes badges.
  const folderTopics = {
    animations: ["conhecimento", "disney", "dreamworks", "pixar", "aardman", "walle"],
    universe: ["estrelas", "planetas", "habitabilidade", "galaxias"],
  };
  let fallbackHistory = [];

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { records: {}, blackBorders: {} };
    } catch {
      return { records: {}, blackBorders: {} };
    }
  }

  function writeProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch {
      return false;
    }
  }

  function readSessionHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_HISTORY_KEY)) || [];
    } catch {
      return fallbackHistory;
    }
  }

  function readPerfectRun() {
    try {
      return JSON.parse(sessionStorage.getItem(PERFECT_RUN_KEY));
    } catch {
      return null;
    }
  }

  function writePerfectRun(run) {
    try {
      if (run) sessionStorage.setItem(PERFECT_RUN_KEY, JSON.stringify(run));
      else sessionStorage.removeItem(PERFECT_RUN_KEY);
    } catch {
      // The perfect-run reward is session based, so it is skipped if session storage is unavailable.
    }
  }

  function getMedal(correct) {
    if (correct >= 10) return "gold";
    if (correct >= 8) return "silver";
    if (correct >= 6) return "bronze";
    return "";
  }

  function getLevelRecord(quizId, level) {
    return readProgress().records?.[quizId]?.[level] || null;
  }

  function getQuizAward(quizId, progress = readProgress()) {
    if (progress.blackBorders?.[quizId]) return "black";
    const levelMedals = Object.keys(pointsPerAnswer).map((level) => progress.records?.[quizId]?.[level]?.medal || "");
    if (levelMedals.some((medal) => !medal)) return "";
    return levelMedals.reduce((lowest, medal) => medals.indexOf(medal) < medals.indexOf(lowest) ? medal : lowest);
  }

  function getQuizMedals(quizId, progress = readProgress()) {
    const levelMedals = Object.keys(pointsPerAnswer).map((level) => progress.records?.[quizId]?.[level]?.medal || "");
    if (levelMedals.some((medal) => !medal)) return [];
    const lowestRank = Math.min(...levelMedals.map((medal) => medals.indexOf(medal)));
    return medals.filter((_, rank) => rank <= lowestRank);
  }

  function getFolderAwards(quizIds) {
    const progress = readProgress();
    const medalRank = { bronze: 0, silver: 1, gold: 2, black: 2 };
    const quizRanks = quizIds.map((quizId) => medalRank[getQuizAward(quizId, progress)] ?? -1);
    const allAtLeast = (medal) => quizRanks.length > 0
      && quizRanks.every((rank) => rank >= medalRank[medal]);

    return {
      bronze: allAtLeast("bronze"),
      silver: allAtLeast("silver"),
      gold: allAtLeast("gold"),
      master: quizIds.length > 0 && quizIds.every((quizId) => Boolean(progress.blackBorders?.[quizId])),
    };
  }

  function invalidatePerfectRun() {
    writePerfectRun(null);
  }

  function startPerfectRunLevel(quizId, level, token) {
    const run = readPerfectRun();
    const isValid = Boolean(token)
      && run?.quizId === quizId
      && run.token === token
      && (run.next === level || run.next === `${level}:playing`);
    if (!isValid) {
      invalidatePerfectRun();
      return false;
    }
    if (run.next === level) {
      run.next = `${level}:playing`;
      writePerfectRun(run);
    }
    return true;
  }

  function beginPerfectRun(quizId) {
    const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    writePerfectRun({ quizId, token, next: "medium" });
    return token;
  }

  function completePerfectRunLevel(quizId, level, token, isPerfect) {
    const run = readPerfectRun();
    const isValid = Boolean(isPerfect && token)
      && run?.quizId === quizId
      && run.token === token
      && run.next === `${level}:playing`;
    if (!isValid) {
      invalidatePerfectRun();
      return { nextToken: "", unlocked: false };
    }
    if (level === "medium") {
      run.next = "hard";
      writePerfectRun(run);
      return { nextToken: token, unlocked: false };
    }
    if (level === "hard") {
      invalidatePerfectRun();
      return { nextToken: "", unlocked: true };
    }
    invalidatePerfectRun();
    return { nextToken: "", unlocked: false };
  }

  function unlockBlackBorder(quizId) {
    const progress = readProgress();
    progress.blackBorders ||= {};
    progress.blackBorders[quizId] = true;
    return writeProgress(progress);
  }

  function recordAttempt({ quizId, level, correct }) {
    const multiplier = pointsPerAnswer[level] ? level : "easy";
    const points = pointsPerAnswer[multiplier];
    const score = correct * points;
    const maxScore = 10 * points;
    const medal = getMedal(correct);
    const attempt = {
      quizId,
      level: multiplier,
      correct,
      score,
      maxScore,
      medal,
      playedAt: new Date().toISOString(),
    };

    const history = [...readSessionHistory(), attempt].slice(-50);
    fallbackHistory = history;
    try {
      sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Keep a page-session history in memory if browser storage is blocked.
    }

    let saved = false;
    let isNewRecord = false;
    let record = getLevelRecord(quizId, multiplier);
    if (medal) {
      const progress = readProgress();
      progress.records ||= {};
      progress.records[quizId] ||= {};
      const previous = progress.records[quizId][multiplier];
      isNewRecord = !previous || score > previous.bestScore;
      const bestScore = Math.max(score, previous?.bestScore || 0);
      const bestCorrect = Math.max(correct, previous?.bestCorrect || 0);
      const qualifiedHistory = [...(previous?.history || []), { score, correct, playedAt: attempt.playedAt }].slice(-25);
      record = {
        bestScore,
        bestCorrect,
        medal: getMedal(bestCorrect),
        qualifiedAttempts: (previous?.qualifiedAttempts || 0) + 1,
        history: qualifiedHistory,
      };
      progress.records[quizId][multiplier] = record;
      saved = writeProgress(progress);
    }

    return {
      ...attempt,
      medalLabel: medalLabels[medal] || "",
      saved,
      isNewRecord,
      record,
      history: readSessionHistory().filter((item) => item.quizId === quizId && item.level === multiplier),
    };
  }

  window.CubeCatQuizProgress = {
    recordAttempt,
    getLevelRecord,
    getQuizAward,
    getQuizMedals,
    getFolderAwards,
    startPerfectRunLevel,
    beginPerfectRun,
    completePerfectRunLevel,
    invalidatePerfectRun,
    unlockBlackBorder,
    folderTopics,
    medalLabels,
    pointsPerAnswer,
  };
})();
