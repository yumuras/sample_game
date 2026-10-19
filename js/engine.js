// ノベルゲームの進行エンジン
(() => {
  const { scenes, endings, start } = window.SCENARIO;
  const { backgrounds, characters } = window.ASSETS;

  const SAVE_KEY = "senbon-torii:save";
  const ENDINGS_KEY = "senbon-torii:endings";
  const TEXT_SPEED_MS = 28;

  const $ = (id) => document.getElementById(id);
  const el = {
    screens: document.querySelectorAll(".screen"),
    bg: $("bg"),
    bgLabel: $("bg-label"),
    chars: $("characters"),
    time: $("hud-time"),
    torii: $("hud-torii"),
    effect: $("effect"),
    choices: $("choices"),
    textbox: $("textbox"),
    name: $("namebox"),
    text: $("text"),
    next: $("next-mark"),
    log: $("log-overlay"),
    logList: $("log-list"),
  };

  let state = null;
  let typing = null; // { full, timer }
  let waiting = null; // クリック待ちのときに呼ぶ関数
  let log = [];

  // ───────── 保存 ─────────
  const storage = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 保存できなくても遊べる */ }
    },
  };

  function save() {
    storage.set(SAVE_KEY, state);
  }

  function seenEndings() {
    return storage.get(ENDINGS_KEY) || [];
  }

  function markEnding(id) {
    const seen = seenEndings();
    if (!seen.includes(id)) storage.set(ENDINGS_KEY, [...seen, id]);
  }

  // ───────── 画面切り替え ─────────
  function showScreen(id) {
    el.screens.forEach((s) => s.classList.toggle("active", s.id === id));
  }

  function refreshTitle() {
    $("btn-continue").disabled = !storage.get(SAVE_KEY);
  }

  // ───────── 表示 ─────────
  function silhouette(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <circle cx="100" cy="80" r="46" fill="${color}"/>
      <path d="M100 130c-55 0-82 38-88 95l-12 175h200l-12-175c-6-57-33-95-88-95z" fill="${color}"/>
    </svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function renderBg() {
    const bg = backgrounds[state.bg] || backgrounds.black;
    el.bg.style.backgroundImage = bg.image ? `url("${bg.image}")` : bg.placeholder;
    el.bgLabel.textContent = bg.image ? "" : bg.label;
  }

  function renderChars() {
    el.chars.innerHTML = "";
    for (const [id, pos] of Object.entries(state.chars)) {
      const c = characters[id];
      if (!c) continue;
      const div = document.createElement("div");
      div.className = `chara pos-${pos}`;
      div.style.backgroundImage = c.image ? `url("${c.image}")` : silhouette(c.color);
      if (!c.image) div.dataset.label = c.name;
      el.chars.appendChild(div);
    }
  }

  function renderHud() {
    el.time.textContent = state.time || "";
    el.torii.textContent = "⛩".repeat(state.torii) + "・".repeat(Math.max(0, 3 - state.torii));
  }

  function renderAll() {
    renderBg();
    renderChars();
    renderHud();
  }

  // ───────── 文字送り ─────────
  function typeText(name, text) {
    el.name.textContent = name || "";
    el.name.hidden = !name;
    el.textbox.classList.toggle("narration", !name);
    el.text.textContent = "";
    el.next.hidden = true;
    log.push({ name, text });

    return new Promise((resolve) => {
      let i = 0;
      const finish = () => {
        clearInterval(typing.timer);
        typing = null;
        el.text.textContent = text;
        el.next.hidden = false;
        waiting = () => { waiting = null; resolve(); };
      };
      typing = {
        finish,
        timer: setInterval(() => {
          i += 1;
          el.text.textContent = text.slice(0, i);
          if (i >= text.length) finish();
        }, TEXT_SPEED_MS),
      };
    });
  }

  function advance() {
    if (!el.log.hidden) return;
    if (typing) typing.finish();
    else if (waiting) waiting();
  }

  function showChoices(options) {
    el.textbox.hidden = true;
    el.choices.innerHTML = "";
    return new Promise((resolve) => {
      options.forEach((opt) => {
        const b = document.createElement("button");
        b.textContent = opt.text;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          el.choices.innerHTML = "";
          el.textbox.hidden = false;
          log.push({ name: "", text: `▶ ${opt.text}` });
          resolve(opt);
        });
        el.choices.appendChild(b);
      });
    });
  }

  function playEffect(kind) {
    el.effect.className = "";
    void el.effect.offsetWidth; // アニメーションを毎回やり直す
    el.effect.className = `fx-${kind}`;
    const ms = kind === "torii" ? 2600 : 700;
    return new Promise((r) => setTimeout(() => { el.effect.className = ""; r(); }, ms));
  }

  // ───────── 進行 ─────────
  function jump(scene) {
    if (!scenes[scene]) throw new Error(`シーン「${scene}」がありません`);
    state.scene = scene;
    state.index = 0;
  }

  async function run() {
    const token = (run.token = {});
    while (token === run.token) {
      const step = scenes[state.scene][state.index];
      if (!step) throw new Error(`シーン「${state.scene}」が goto か ending で終わっていません`);
      save();

      if (step.bg) { state.bg = step.bg; renderBg(); }
      if (step.time !== undefined) state.time = step.time;
      if (step.show) Object.assign(state.chars, step.show);
      if (step.hide) {
        if (step.hide === "all") state.chars = {};
        else delete state.chars[step.hide];
      }
      if (step.set) Object.assign(state.flags, step.set);
      if (step.effect) {
        el.textbox.hidden = true;
        await playEffect(step.effect);
        el.textbox.hidden = false;
      }
      if (step.torii !== undefined) state.torii = step.torii;
      renderChars();
      renderHud();
      if (token !== run.token) return;

      if (step.text) {
        await typeText(step.name, step.text);
        if (token !== run.token) return;
      }

      if (step.choice) {
        const opt = await showChoices(step.choice.filter((o) => !o.if || state.flags[o.if]));
        if (token !== run.token) return;
        if (opt.set) Object.assign(state.flags, opt.set);
        jump(opt.goto);
        continue;
      }
      if (step.goto) { jump(step.goto); continue; }
      if (step.ending) { finishEnding(step.ending); return; }

      state.index += 1;
    }
  }

  function finishEnding(id) {
    markEnding(id);
    storage.set(SAVE_KEY, null);
    const e = endings[id];
    $("ending-title").textContent = e.title;
    $("ending-hint").textContent = e.hint ? `ヒント：${e.hint}` : "最後まで遊んでくれて、ありがとうございました。";
    showScreen("ending-screen");
  }

  function startGame(saved) {
    state = saved || { scene: start, index: 0, flags: {}, torii: 3, time: "", bg: "black", chars: {} };
    log = [];
    el.choices.innerHTML = "";
    el.textbox.hidden = false;
    renderAll();
    showScreen("play-screen");
    run();
  }

  function stopGame() {
    run.token = null;
    if (typing) { clearInterval(typing.timer); typing = null; }
    waiting = null;
  }

  // ───────── エンディング一覧 ─────────
  function showEndings() {
    const seen = seenEndings();
    const list = $("endings-list");
    list.innerHTML = "";
    for (const [id, e] of Object.entries(endings)) {
      const li = document.createElement("li");
      li.textContent = seen.includes(id) ? e.title : "？？？";
      li.classList.toggle("locked", !seen.includes(id));
      list.appendChild(li);
    }
    showScreen("endings-screen");
  }

  // ───────── ログ ─────────
  function openLog() {
    el.logList.innerHTML = "";
    for (const { name, text } of log) {
      const p = document.createElement("p");
      if (name) {
        const b = document.createElement("b");
        b.textContent = `${name}　`;
        p.appendChild(b);
      }
      p.appendChild(document.createTextNode(text));
      el.logList.appendChild(p);
    }
    el.log.hidden = false;
    el.logList.scrollTop = el.logList.scrollHeight;
  }

  // ───────── 操作 ─────────
  $("btn-new").addEventListener("click", () => startGame(null));
  $("btn-continue").addEventListener("click", () => startGame(storage.get(SAVE_KEY)));
  $("btn-endings").addEventListener("click", showEndings);
  $("btn-endings-back").addEventListener("click", () => { refreshTitle(); showScreen("title-screen"); });
  $("btn-ending-back").addEventListener("click", () => { refreshTitle(); showScreen("title-screen"); });
  $("btn-title").addEventListener("click", (e) => {
    e.stopPropagation();
    stopGame();
    refreshTitle();
    showScreen("title-screen");
  });
  $("btn-log").addEventListener("click", (e) => { e.stopPropagation(); openLog(); });
  $("btn-log-close").addEventListener("click", (e) => { e.stopPropagation(); el.log.hidden = true; });

  $("play-screen").addEventListener("click", advance);
  document.addEventListener("keydown", (e) => {
    if (!$("play-screen").classList.contains("active")) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
    if (e.key === "Escape") el.log.hidden = true;
  });

  refreshTitle();
})();
