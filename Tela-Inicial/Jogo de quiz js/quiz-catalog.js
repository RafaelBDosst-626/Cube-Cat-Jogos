(() => {
  const progress = window.CubeCatQuizProgress;
  if (!progress) return;

  const medalIcons = { bronze: "\u2605", silver: "\u2605", gold: "\u2605" };

  document.querySelectorAll(".animation-topic, .universe-topic").forEach((topic) => {
    const firstQuizLink = topic.querySelector(".difficulty[href]");
    if (!firstQuizLink) return;
    const quizId = new URL(firstQuizLink.href).searchParams.get("quiz");
    const award = progress.getQuizAward(quizId);
    const earnedMedals = progress.getQuizMedals(quizId);
    if (award) topic.dataset.award = award;

    if (earnedMedals.length || award === "black") {
      const badges = document.createElement("span");
      badges.className = "topic-awards";

      earnedMedals.forEach((medal) => {
        const badge = document.createElement("span");
        badge.className = `topic-award topic-award--${medal}`;
        badge.textContent = medalIcons[medal];
        badge.title = `Insígnia ${progress.medalLabels[medal]} conquistada nas três dificuldades`;
        badge.setAttribute("role", "img");
        badge.setAttribute("aria-label", badge.title);
        badges.append(badge);
      });

      if (award === "black") {
        const specialBadge = document.createElement("span");
        specialBadge.className = "topic-award topic-award--special";
        specialBadge.textContent = "\u2726";
        specialBadge.title = "Recompensa especial desbloqueada.";
        specialBadge.setAttribute("role", "img");
        specialBadge.setAttribute("aria-label", specialBadge.title);
        badges.append(specialBadge);
      }

      topic.append(badges);
    }

    topic.querySelectorAll(".difficulty[href]").forEach((link) => {
      const params = new URL(link.href).searchParams;
      const record = progress.getLevelRecord(quizId, params.get("difficulty"));
      if (!record) return;
      link.dataset.award = record.medal;
      link.title = `${progress.medalLabels[record.medal]} \u2014 recorde de ${record.bestScore} pontos`;
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

    ["bronze", "silver", "gold"].forEach((medal) => {
      const badge = badges.querySelector(`[data-medal="${medal}"]`);
      const label = progress.medalLabels[medal];
      badge.hidden = !awards[medal];
      if (awards[medal]) {
        badge.textContent = `${medalIcons[medal]} Medalha ${label}`;
        badge.title = `Medalha ${label} em todos os quizzes e dificuldades da categoria`;
      }
    });

    const masterBadge = badges.querySelector("[data-master-badge]");
    const masterMessage = badges.querySelector("[data-master-message]");
    masterBadge.hidden = !awards.master;
    masterMessage.hidden = !awards.master || folderId === "animations";
    if (awards.master) {
      const specialAward = folderId === "universe"
        ? {
            icon: "\u{1F30C}",
            label: "Guardião do Cosmos",
            message: "Você desvendou os grandes mistérios do universo!",
          }
        : {
            icon: "\u{1F3AC}",
            label: "O que Walt diria?",
            message: "Você é um verdadeiro apreciador de animações: completou todos os quizzes com pontuação máxima. Deve ser bom em pegar referências!",
          };
      masterBadge.textContent = `${specialAward.icon} ${specialAward.label}`;
      masterBadge.title = specialAward.message;
      masterBadge.setAttribute("aria-label", `${specialAward.label}. ${specialAward.message}`);
      masterMessage.textContent = specialAward.message;
      folderCard.dataset.folderMaster = folderId;
    }
  });
})();
