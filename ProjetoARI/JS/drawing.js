/* =========================================================
   Bem Social — estúdio de desenho
   Tela em branco com pincel, borracha, cores, espessura,
   desfazer/refazer e limpar. Funciona com mouse, toque e caneta
   (Pointer Events). Os traços ficam guardados como vetores, o
   que permite desfazer sem gastar memória com cópias da tela.
   ========================================================= */

const DrawingStudio = (() => {
  const dialog = document.getElementById('drawDialog');
  const canvas = document.getElementById('drawCanvas');
  const wrap = document.getElementById('canvasWrap');
  const hint = document.getElementById('canvasHint');
  const ctx = canvas.getContext('2d');

  const ui = {
    tools: dialog.querySelectorAll('[data-tool]'),
    swatches: document.getElementById('swatches'),
    sizeInput: document.getElementById('sizeInput'),
    sizeValue: document.getElementById('sizeValue'),
    sizeDot: document.getElementById('sizeDot'),
    undo: document.getElementById('undoBtn'),
    redo: document.getElementById('redoBtn'),
    clear: document.getElementById('clearBtn'),
    save: document.getElementById('saveDrawingBtn'),
  };

  // Tela 4:3 deitada no computador e 3:4 em pé no celular
  const LANDSCAPE = [1200, 900];
  const PORTRAIT = [900, 1200];
  let WIDTH = canvas.width;
  let HEIGHT = canvas.height;
  const PAPER = '#ffffff';
  const COLORS = [
    ['#1b1733', 'Preto'],
    ['#e5484d', 'Vermelho'],
    ['#f76b15', 'Laranja'],
    ['#ffc53d', 'Amarelo'],
    ['#30a46c', 'Verde'],
    ['#0090ff', 'Azul'],
    ['#6d4aff', 'Roxo'],
    ['#e93d82', 'Rosa'],
    ['#8d5a3b', 'Marrom'],
  ];

  const state = {
    tool: 'pen',
    color: COLORS[0][0],
    size: 8,
    ops: [], // traços e limpezas, em ordem
    redo: [],
    current: null,
    pointerId: null,
  };

  let saveHandler = null;

  /* ---------- Renderização ---------- */
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function paper() {
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  function applyStyle(op) {
    const color = op.tool === 'eraser' ? PAPER : op.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = op.size;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  }

  function drawDot(op, point) {
    applyStyle(op);
    ctx.beginPath();
    ctx.arc(point.x, point.y, op.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Curva suave entre pontos médios (evita o traço "quebrado")
  function drawSegment(op, index) {
    const pts = op.points;
    const start = index >= 2 ? midpoint(pts[index - 2], pts[index - 1]) : pts[0];
    const control = pts[index - 1];
    const end = midpoint(pts[index - 1], pts[index]);
    applyStyle(op);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    ctx.stroke();
  }

  function drawTail(op) {
    const pts = op.points;
    const n = pts.length;
    if (n < 2) return;
    const from = midpoint(pts[n - 2], pts[n - 1]);
    applyStyle(op);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
    ctx.stroke();
  }

  function replay(op) {
    drawDot(op, op.points[0]);
    for (let i = 1; i < op.points.length; i++) drawSegment(op, i);
    drawTail(op);
  }

  function redraw() {
    paper();
    for (const op of state.ops) {
      if (op.type === 'clear') paper();
      else replay(op);
    }
  }

  function isBlank() {
    for (let i = state.ops.length - 1; i >= 0; i--) {
      if (state.ops[i].type === 'clear') return true;
      if (state.ops[i].type === 'stroke') return false;
    }
    return true;
  }

  function refreshUi() {
    const blank = isBlank();
    ui.undo.disabled = state.ops.length === 0;
    ui.redo.disabled = state.redo.length === 0;
    ui.clear.disabled = blank;
    ui.save.disabled = blank;
    hint.classList.toggle('is-hidden', !blank);
  }

  /* ---------- Entrada (mouse, toque, caneta) ---------- */
  function toCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) * (WIDTH / rect.width)) * 10) / 10,
      y: Math.round(((event.clientY - rect.top) * (HEIGHT / rect.height)) * 10) / 10,
    };
  }

  function addPoint(point) {
    const pts = state.current.points;
    const last = pts[pts.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    pts.push(point);
    drawSegment(state.current, pts.length - 1);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (state.current) return; // ignora o segundo dedo
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const op = {
      type: 'stroke',
      tool: state.tool,
      color: state.color,
      size: state.size,
      points: [toCanvasPoint(event)],
    };
    state.current = op;
    state.pointerId = event.pointerId;
    state.ops.push(op);
    state.redo = [];
    drawDot(op, op.points[0]);
    refreshUi();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!state.current || event.pointerId !== state.pointerId) return;
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
    (events.length ? events : [event]).forEach((e) => addPoint(toCanvasPoint(e)));
  });

  function endStroke(event) {
    if (!state.current || event.pointerId !== state.pointerId) return;
    drawTail(state.current);
    state.current = null;
    state.pointerId = null;
    refreshUi();
  }

  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);

  /* ---------- Ações ---------- */
  function undo() {
    if (state.current || !state.ops.length) return;
    state.redo.push(state.ops.pop());
    redraw();
    refreshUi();
  }

  function redo() {
    if (state.current || !state.redo.length) return;
    state.ops.push(state.redo.pop());
    redraw();
    refreshUi();
  }

  function clear() {
    if (isBlank()) return;
    state.ops.push({ type: 'clear' });
    state.redo = [];
    paper();
    refreshUi();
  }

  function reset() {
    state.ops = [];
    state.redo = [];
    state.current = null;
    paper();
    refreshUi();
  }

  function setTool(tool) {
    state.tool = tool;
    ui.tools.forEach((button) => {
      const active = button.dataset.tool === tool;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateSizePreview();
  }

  function setColor(color, swatch) {
    state.color = color;
    ui.swatches.querySelectorAll('.swatch').forEach((el) => {
      const active = el === swatch;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    });
    setTool('pen');
  }

  function setSize(size) {
    state.size = Math.max(2, Math.min(64, Math.round(size)));
    ui.sizeInput.value = state.size;
    ui.sizeValue.textContent = state.size;
    updateSizePreview();
    updateCursor();
  }

  function updateSizePreview() {
    const px = Math.max(4, Math.min(30, state.size * 0.55));
    ui.sizeDot.style.width = `${px}px`;
    ui.sizeDot.style.height = `${px}px`;
    ui.sizeDot.style.setProperty('--dot', state.tool === 'eraser' ? PAPER : state.color);
  }

  // Cursor redondo do tamanho real do pincel
  function updateCursor() {
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width ? rect.width / WIDTH : 1;
    const diameter = Math.max(6, Math.min(100, Math.round(state.size * scale)));
    const box = diameter + 4;
    const c = box / 2;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}">` +
      `<circle cx="${c}" cy="${c}" r="${diameter / 2}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.5"/>` +
      `<circle cx="${c}" cy="${c}" r="${Math.max(1, diameter / 2 - 1.5)}" fill="none" stroke="#fff" stroke-opacity=".9"/>` +
      '</svg>';
    canvas.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, crosshair`;
  }

  // Encaixa a tela (4:3) no espaço disponível
  function fit() {
    const rect = wrap.getBoundingClientRect();
    const pad = window.innerWidth < 600 ? 12 : 24;
    const availableW = Math.max(0, rect.width - pad * 2);
    const availableH = Math.max(0, rect.height - pad * 2);
    let width = availableW;
    let height = (width * HEIGHT) / WIDTH;
    if (height > availableH) {
      height = availableH;
      width = (height * WIDTH) / HEIGHT;
    }
    canvas.style.width = `${Math.floor(width)}px`;
    canvas.style.height = `${Math.floor(height)}px`;
    updateCursor();
  }

  new ResizeObserver(fit).observe(wrap);

  /* ---------- Paleta de cores ---------- */
  COLORS.forEach(([color, name], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.style.setProperty('--swatch', color);
    button.title = name;
    button.setAttribute('aria-label', `Cor ${name}`);
    button.setAttribute('aria-pressed', String(index === 0));
    if (index === 0) button.classList.add('is-active');
    button.addEventListener('click', () => setColor(color, button));
    ui.swatches.append(button);
  });

  const custom = document.createElement('label');
  custom.className = 'swatch swatch-custom';
  custom.title = 'Escolher outra cor';
  custom.innerHTML = '<input type="color" value="#6d4aff" aria-label="Escolher outra cor">';
  const customInput = custom.querySelector('input');
  customInput.addEventListener('input', () => {
    custom.style.setProperty('--swatch', customInput.value);
    setColor(customInput.value, custom);
  });
  ui.swatches.append(custom);

  /* ---------- Eventos da barra ---------- */
  ui.tools.forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
  ui.sizeInput.addEventListener('input', () => setSize(Number(ui.sizeInput.value)));
  ui.undo.addEventListener('click', undo);
  ui.redo.addEventListener('click', redo);
  ui.clear.addEventListener('click', clear);

  ui.save.addEventListener('click', () => {
    if (isBlank()) return;
    ui.save.disabled = true;
    canvas.toBlob((blob) => {
      ui.save.disabled = false;
      if (!blob) return;
      if (saveHandler) saveHandler(blob);
      close();
    }, 'image/png');
  });

  dialog.addEventListener('keydown', (event) => {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (mod && key === 'y') {
      event.preventDefault();
      redo();
    } else if (!mod && event.target.tagName !== 'INPUT') {
      if (key === 'b') setTool('pen');
      else if (key === 'e') setTool('eraser');
      else if (key === '[') setSize(state.size - 2);
      else if (key === ']') setSize(state.size + 2);
    }
  });

  /* ---------- Abrir / fechar ---------- */
  // Só troca a orientação com a tela vazia (trocar o tamanho apaga o canvas)
  function chooseOrientation() {
    if (state.ops.length) return;
    const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 700;
    const [width, height] = portrait ? PORTRAIT : LANDSCAPE;
    if (width === WIDTH && height === HEIGHT) return;
    canvas.width = WIDTH = width;
    canvas.height = HEIGHT = height;
    paper();
  }

  function open() {
    if (dialog.open) return;
    chooseOrientation();
    dialog.showModal();
    requestAnimationFrame(fit);
    refreshUi();
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, UI.reducedMotion() ? 0 : 210);
  }

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault(); // Esc: fecha com animação
    close();
  });

  dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));

  // Clique no fundo escuro fecha (o rascunho continua guardado)
  let downOnBackdrop = false;
  dialog.addEventListener('pointerdown', (event) => {
    downOnBackdrop = event.target === dialog;
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && downOnBackdrop) close();
  });

  // Estado inicial
  paper();
  setSize(state.size);
  refreshUi();

  return {
    open,
    close,
    reset,
    hasDrawing: () => !isBlank(),
    onSave(handler) {
      saveHandler = handler;
    },
  };
})();
