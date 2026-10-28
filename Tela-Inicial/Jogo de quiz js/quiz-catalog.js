(() => {
  const progress = window.CubeCatQuizProgress;
  if (!progress) return;

  const medalIcons = { bronze: "🥉", silver: "🥈", gold: "🥇" };

  document.querySelectorAll(".animation-topic, .universe-topic").forEach((topic) => {
    const firstQuizLink = topic.querySelector(".difficulty[href]");
    if (!firstQuizLink) return;
    const quizId = new URL(firstQuizLink.href).searchParams.get("quiz");
    const award = progress.getQuizAward(quizId);
    if (award) topic.dataset.award = award;

    if (award) {
      const badge = document.createElement("span");
      badge.className = "topic-award";
      badge.textContent = award === "black" ? "✦" : medalIcons[award];
      badge.title = award === "black"
        ? "Easter egg: perfeito em Fácil, Médio e Difícil, em sequência."
        : `Melhor medalha: ${progress.medalLabels[award]}`;
      badge.setAttribute("role", "img");
      badge.setAttribute("aria-label", badge.title);
      topic.append(badge);
    }

    topic.querySelectorAll(".difficulty[href]").forEach((link) => {
      const params = new URL(link.href).searchParams;
      const record = progress.getLevelRecord(quizId, params.get("difficulty"));
      if (!record) return;
      link.dataset.award = record.medal;
      link.title = `${progress.medalLabels[record.medal]} — recorde de ${record.bestScore} pontos`;
      const score = document.createElement("span");
      score.className = "difficulty-record";
      score.textContent = `${medalIcons[record.medal]} ${record.bestScore} pts`;
      score.setAttribute("aria-hidden", "true");
      link.append(score);
    });
  });

  document.querySelectorAll("[data-folder-badges]").forEach((badges) => {
    const folderId = badges.dataset.folderBadges;
    const quizIds = progress.folderTopics[folderId] || [];
    const awards = progress.getFolderAwards(quizIds);
    const folderCard = badges.closest("[data-quiz-folder]");

    Object.entries({ easy: "Fáceis", medium: "Médios", hard: "Difíceis" }).forEach(([level, label]) => {
      const badge = badges.querySelector(`[data-level="${level}"]`);
      badge.hidden = !awards[level];
      if (awards[level]) {
        badge.textContent = `🏅 ${label}`;
        badge.title = `Ganhou Bronze ou melhor em todos os quizzes no nível ${label.toLowerCase()}`;
      }
    });

    const masterBadge = badges.querySelector("[data-master-badge]");
    masterBadge.hidden = !awards.master;
    if (awards.master) {
      const title = folderId === "universe" ? "O mestre do universo" : "Mestre da animação";
      masterBadge.textContent = folderId === "universe" ? "🌌 O mestre do universo" : "🎬 Mestre da animação";
      masterBadge.title = title;
      masterBadge.setAttribute("aria-label", title);
      folderCard.dataset.folderMaster = folderId;
    }
  });
})();
