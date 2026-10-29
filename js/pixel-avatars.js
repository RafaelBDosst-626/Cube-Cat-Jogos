(() => {
  const sprites = [
    [
      ".A...A..",
      "..A.A...",
      "...A.A..",
      "..A...A.",
      "...A.A..",
      "....A...",
      ".A...A..",
      "..A.A..."
    ],
    [
      "..OCCO..",
      ".OCCCCO.",
      "OCCOOCCO",
      "OCC..O..",
      ".OCCO...",
      "...OCCO.",
      "..OCCO..",
      ".OCCO..."
    ],
    [
      "...OO...",
      "..OCCO..",
      ".OCCACO.",
      "OCACCCCO",
      "OCCCCCCO",
      ".OCCCCO.",
      "..OCCO..",
      "...OO..."
    ],
    [
      "O......O",
      "OC....CO",
      ".OCCCCO.",
      "..OCCO..",
      ".OCCCCO.",
      ".OCEECO.",
      "..OCCO..",
      ".OO..OO."
    ]
  ];
  const palette = { O: "#111820", C: "currentColor", A: "#f4da62", E: "#f7fbff" };

  function create(index = 0) {
    const avatar = document.createElement("span");
    const spriteIndex = ((index % sprites.length) + sprites.length) % sprites.length;
    avatar.className = `mp-retro-avatar mp-retro-avatar-${spriteIndex + 1}`;
    avatar.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 8 8");
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("focusable", "false");
    sprites[spriteIndex].forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === ".") return;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", "1");
      rect.setAttribute("height", "1");
      rect.setAttribute("fill", palette[pixel] || palette.C);
      svg.appendChild(rect);
    }));
    avatar.appendChild(svg);
    return avatar;
  }

  window.CubeCatPixelAvatar = { create };
})();
