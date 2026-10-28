(() => {
  function characterCount(value) {
    return [...value].length;
  }

  function isAllowedCharacter(character) {
    return /[\p{L} -]/u.test(character);
  }

  function baseCharacter(character) {
    return character.normalize("NFD").replace(/[\p{M}]/gu, "");
  }

  function compareAnswer(expected, guess) {
    const target = [...expected.normalize("NFC").toLocaleLowerCase("pt-BR")];
    const attempt = [...guess.normalize("NFC").toLocaleLowerCase("pt-BR")];
    const states = Array(target.length).fill("empty");
    const remaining = new Map();

    target.forEach((character, index) => {
      if (!/[\p{L}]/u.test(character)) return;
      if (attempt[index] === character) states[index] = "correct";
      else {
        const base = baseCharacter(character);
        remaining.set(base, (remaining.get(base) || 0) + 1);
      }
    });

    attempt.forEach((character, index) => {
      if (states[index] === "correct" || !/[\p{L}]/u.test(character)) return;
      const base = baseCharacter(character);
      const count = remaining.get(base) || 0;
      if (count > 0) {
        states[index] = "present";
        remaining.set(base, count - 1);
      } else {
        states[index] = "absent";
      }
    });
    return states;
  }

  function attach(input) {
    const guide = document.createElement("div");
    guide.className = "answer-guide";
    guide.setAttribute("aria-hidden", "true");
    const hint = document.createElement("small");
    hint.className = "answer-guide-hint";
    input.after(hint, guide);

    let expected = "";

    function render(states = []) {
      const target = [...expected];
      const attempt = [...input.value];
      guide.replaceChildren();
      target.forEach((character, index) => {
        if (character === " ") {
          const gap = document.createElement("span");
          gap.className = "answer-guide-space";
          gap.textContent = "·";
          guide.appendChild(gap);
          return;
        }

        const slot = document.createElement("span");
        slot.className = "answer-guide-slot";
        if (character === "-") slot.classList.add("is-punctuation");
        else if (states[index]) slot.classList.add(`is-${states[index]}`);
        slot.textContent = attempt[index] || (character === "-" ? "-" : "");
        guide.appendChild(slot);
      });
    }

    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.addEventListener("input", () => {
      const filtered = [...input.value.normalize("NFC")]
        .filter(isAllowedCharacter)
        .slice(0, characterCount(expected))
        .join("");
      if (filtered !== input.value) input.value = filtered;
      input.classList.remove("is-correct", "is-accent", "is-wrong");
      render();
    });

    return {
      setExpected(answer) {
        expected = answer.normalize("NFC");
        input.maxLength = characterCount(expected);
        const words = expected.trim().split(/\s+/).length;
        const letters = [...expected].filter((character) => /[\p{L}]/u.test(character)).length;
        hint.textContent = `${characterCount(expected)} caracteres · ${letters} letras${words > 1 ? ` · ${words} palavras` : ""}`;
        render();
      },
      mark(guess) {
        render(compareAnswer(expected, guess));
      },
      getLength() {
        return characterCount(expected);
      }
    };
  }

  window.sayMyNameAnswerGuide = { attach };
})();
