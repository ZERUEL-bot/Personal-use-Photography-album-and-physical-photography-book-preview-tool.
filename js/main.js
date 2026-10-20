/* A Glimpse of Trees — gallery, detail view and local editor */
(() => {
  "use strict";

  const SEED_URL = "./data/default-portfolio.json";
  const HELP_SEEN_KEY = "photo.pwa.help.v1";
  const IMAGE_BASE = "./assets/images/";
  const IMAGE_MANIFEST = IMAGE_BASE + "manifest.json";
  const STORE_LABEL = "本机浏览器数据库（IndexedDB）";
  const EMPTY_DATA = {
    meta: {
      title: "A Glimpse of Trees",
      subtitle: "",
      year: String(new Date().getFullYear()),
      intro: "",
      cover_photo: "",
      updated: ""
    },
    theme: { preset: "warm", accent: "#c5b393", background: "#0f0f0f" },
    groups: [{ id: "all", label: "全部作品", label_en: "All plates", description: "" }],
    photos: [],
    book_afterword: { title: "", body: [], signature: "" }
  };
  const LAYOUT_PATTERNS = {
    water: [
      { span: 7, col: 1, offset: "0vh" },
      { span: 4, col: 9, offset: "11vh" },
      { span: 9, col: 3, offset: "4vh" }
    ],
    woods: [
      { span: 6, col: 1, offset: "0vh" },
      { span: 5, col: 8, offset: "12vh" },
      { span: 4, col: 2, offset: "-2vh" },
      { span: 4, col: 8, offset: "5vh" }
    ],
    field: [
      { span: 7, col: 1, offset: "0vh" },
      { span: 4, col: 9, offset: "10vh" },
      { span: 8, col: 4, offset: "5vh" }
    ],
    light: [
      { span: 5, col: 1, offset: "0vh" },
      { span: 4, col: 8, offset: "11vh" },
      { span: 8, col: 4, offset: "5vh" }
    ],
    default: [
      { span: 7, col: 1, offset: "0vh" },
      { span: 4, col: 9, offset: "10vh" },
      { span: 6, col: 2, offset: "-1vh" },
      { span: 6, col: 7, offset: "7vh" },
      { span: 8, col: 1, offset: "2vh" },
      { span: 4, col: 9, offset: "10vh" }
    ]
  };

  const THEME_PRESETS = {
    warm: {
      label: "夜色暖褐",
      hint: "默认 · 暖白文字",
      bg: "#0f0f0f",
      bgSoft: "#151514",
      ink: "#ece7dd",
      muted: "#8d887e",
      faint: "#5f5b54",
      accent: "#c5b393"
    },
    graphite: {
      label: "冷调石墨",
      hint: "冷灰 · 银蓝强调",
      bg: "#0b0d0e",
      bgSoft: "#121517",
      ink: "#e7e9ea",
      muted: "#90979b",
      faint: "#5c6367",
      accent: "#a9bcc4"
    },
    forest: {
      label: "深林墨绿",
      hint: "墨绿 · 苔金强调",
      bg: "#0a100d",
      bgSoft: "#111a14",
      ink: "#e9e7da",
      muted: "#8f9788",
      faint: "#586152",
      accent: "#c0ad7d"
    },
    indigo: {
      label: "靛蓝夜色",
      hint: "深蓝 · 雾蓝强调",
      bg: "#0a0c14",
      bgSoft: "#11141f",
      ink: "#e7e6e2",
      muted: "#8f93a3",
      faint: "#585d6e",
      accent: "#9fb3df"
    }
  };
  const DEFAULT_THEME = "warm";

  const grid = document.getElementById("galleryGrid");
  const detail = document.getElementById("detail");
  const detailImage = document.getElementById("detailImage");
  const detailImageAlt = document.getElementById("detailImageAlt");
  const detailFrame = document.getElementById("detailFrame");
  const detailCounter = document.getElementById("detailCounter");
  const detailGroup = document.getElementById("detailGroup");
  const detailKicker = document.getElementById("detailKicker");
  const detailTitle = document.getElementById("detailTitle");
  const detailNote = document.getElementById("detailNote");
  const detailEssay = document.getElementById("detailEssay");
  const detailPrev = document.getElementById("detailPrev");
  const detailNext = document.getElementById("detailNext");
  const detailClose = document.getElementById("detailClose");
  const adminToggle = document.getElementById("adminToggle");
  const editorBar = document.getElementById("editorBar");
  const editorStatus = document.getElementById("editorStatus");
  const addPhotoBtn = document.getElementById("addPhotoBtn");
  const groupsBtn = document.getElementById("groupsBtn");
  const layoutBtn = document.getElementById("layoutBtn");
  const resetLayoutBtn = document.getElementById("resetLayoutBtn");
  const boardBtn = document.getElementById("boardBtn");
  const boardModal = document.getElementById("boardModal");
  const boardEl = document.getElementById("board");
  const layoutBar = document.getElementById("layoutBar");
  const layoutSelection = document.getElementById("layoutSelection");
  const rotateRange = document.getElementById("rotateRange");
  const rotateValue = document.getElementById("rotateValue");
  const scaleRange = document.getElementById("scaleRange");
  const scaleValue = document.getElementById("scaleValue");
  const resetTransformBtn = document.getElementById("resetTransformBtn");
  const groupsModal = document.getElementById("groupsModal");
  const groupList = document.getElementById("groupList");
  const addGroupBtn = document.getElementById("addGroupBtn");
  const themeBtn = document.getElementById("themeBtn");
  const helpBtn = document.getElementById("helpBtn");
  const saveBtn = document.getElementById("saveBtn");
  const exportBackupBtn = document.getElementById("exportBackupBtn");
  const importBackupBtn = document.getElementById("importBackupBtn");
  const importFile = document.getElementById("importFile");
  const photoFileInput = document.getElementById("photoFileInput");
  const uploadPreview = document.getElementById("uploadPreview");
  const discardBtn = document.getElementById("discardBtn");
  const addPhotoModal = document.getElementById("addPhotoModal");
  const addPhotoForm = document.getElementById("addPhotoForm");
  const addPhotoGroup = document.getElementById("addPhotoGroup");
  const addPhotoNewGroup = document.getElementById("addPhotoNewGroup");
  const helpModal = document.getElementById("helpModal");
  const themeModal = document.getElementById("themeModal");
  const themePresets = document.getElementById("themePresets");
  const accentColor = document.getElementById("accentColor");
  const bgColor = document.getElementById("bgColor");
  const themePreview = document.getElementById("themePreview");
  const toastEl = document.getElementById("toast");
  const editEssayBtn = document.getElementById("editEssayBtn");
  const essayModal = document.getElementById("essayModal");
  const essayEditorEl = document.getElementById("essayEditor");
  const essayDoneBtn = document.getElementById("essayDone");
  const essayCancelBtn = document.getElementById("essayCancel");
  const essayCloseBtn = document.getElementById("essayClose");
  const photoPicker = document.getElementById("photoPicker");
  const pickerStatus = document.getElementById("pickerStatus");
  const pickerRefresh = document.getElementById("pickerRefresh");
  const addPhotoSubmit = document.getElementById("addPhotoSubmit");

  const state = {
    data: null,
    admin: false,
    freeLayout: false,
    selectedId: null,
    overviewOpen: false,
    dirty: false,
    saved: false,
    currentId: null,
    detailOpen: false,
    lastFocus: null,
    baseUpdated: ""
  };

  let toastTimer = 0;
  let draftTimer = 0;
  let revealObserver = null;
  let detailLayer = null;
  let detailToken = 0;
  let editBaseline = null;
  const history = { past: [], future: [] };
  const HISTORY_LIMIT = 60;

  if (!grid) return;

  const pad = (value) => String(value).padStart(2, "0");
  const isInlineImage = (file) => /^(data:|blob:)/i.test(String(file || ""));
  const imageUrl = (file) => {
    const value = String(file || "");
    if (isInlineImage(value)) return value;
    return IMAGE_BASE + value.replace(/^\.?\/?assets\/images\//, "");
  };
  const PLACEHOLDER_IMAGE = IMAGE_BASE + "_placeholder.svg";

  const transformCss = (photo) => {
    const t = (photo && photo.transform) || {};
    const r = Number(t.r) || 0;
    const s = Number(t.s) || 1;
    return "rotate(" + r + "deg) scale(" + s + ")";
  };

  const applyImageFallback = (image) => {
    if (!image || image.dataset.fallback === "1") return;
    image.dataset.fallback = "1";
    image.src = PLACEHOLDER_IMAGE;
    const frame = image.closest(".plate-media, .detail-frame, .photo-frame, .cover-plate, .picker-item");
    if (frame) {
      frame.classList.add("is-fallback");
      frame.classList.remove("is-missing");
    }
  };

  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target && target.tagName === "IMG") applyImageFallback(target);
    },
    true
  );

  const escapeHtml = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const ALLOWED_TAGS = new Set([
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "blockquote", "ul", "ol", "li", "h2", "h3", "a"
  ]);

  const cleanNode = (node) => {
    if (node.nodeType === 3) return escapeHtml(node.nodeValue);
    if (node.nodeType !== 1) return "";
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return Array.from(node.childNodes).map(cleanNode).join("");
    }
    if (tag === "br") return "<br>";
    const inner = Array.from(node.childNodes).map(cleanNode).join("");
    if (tag === "a") {
      const href = String(node.getAttribute("href") || "");
      if (/^(https?:|mailto:)/i.test(href)) {
        return '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + inner + "</a>";
      }
      return inner;
    }
    const list = tag === "li" && node.getAttribute("data-list")
      ? ' data-list="' + escapeHtml(node.getAttribute("data-list")) + '"'
      : "";
    return "<" + tag + list + ">" + inner + "</" + tag + ">";
  };

  const sanitizeHtml = (html) => {
    const template = document.createElement("template");
    template.innerHTML = String(html == null ? "" : html);
    return Array.from(template.content.childNodes).map(cleanNode).join("");
  };

  const paragraphsToHtml = (paragraphs) =>
    paragraphs
      .map((paragraph) => String(paragraph == null ? "" : paragraph).trim())
      .filter(Boolean)
      .map((paragraph) => "<p>" + escapeHtml(paragraph).replace(/\n/g, "<br>") + "</p>")
      .join("");

  const essayHtml = (value) => {
    if (Array.isArray(value)) return paragraphsToHtml(value);
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return "";
      if (/<[a-z][\s\S]*>/i.test(text)) return sanitizeHtml(text);
      return paragraphsToHtml(text.split(/\n{2,}/));
    }
    return "";
  };

  const essayIsEmpty = (html) => {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    return !template.content.textContent.replace(/[\s\u00a0]/g, "").length;
  };

  const groupById = (id) => (state.data ? state.data.groups.find((group) => group.id === id) : null);
  const photoById = (id) => (state.data ? state.data.photos.find((photo) => photo.id === id) : null);
  const currentPhoto = () => (state.data ? state.data.photos.find((photo) => photo.id === state.currentId) : null);
  const photoIndex = (id) => (state.data ? state.data.photos.findIndex((photo) => photo.id === id) : -1);

  const showToast = (message, duration = 3600) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    window.requestAnimationFrame(() => toastEl.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
      window.setTimeout(() => { toastEl.hidden = true; }, 360);
    }, duration);
  };

  /* Undo / redo ----------------------------------------------------------- */
  const pushHistory = (label) => {
    if (!state.data) return;
    history.past.push({ label, data: JSON.parse(JSON.stringify(state.data)) });
    if (history.past.length > HISTORY_LIMIT) history.past.shift();
    history.future.length = 0;
  };

  const restoreSnapshot = (entry, action) => {
    if (!entry || !state.data) return;
    const theme = JSON.parse(JSON.stringify(state.data.theme || {}));
    state.data = normaliseData(JSON.parse(JSON.stringify(entry.data)));
    if (Object.keys(theme).length) {
      state.data.theme = theme;
      applyTheme(theme);
    }
    if (state.detailOpen && !photoById(state.currentId)) closeDetail();
    if (state.detailOpen) renderDetail();
    renderGallery();
    renderGroupManager();
    markDirty();
    showToast((entry.label || "操作") + "已" + action, 2600);
  };

  const undo = () => {
    if (!history.past.length) {
      showToast("没有可撤销的操作", 2200);
      return;
    }
    const entry = history.past.pop();
    history.future.push({ label: entry.label, data: JSON.parse(JSON.stringify(state.data)) });
    restoreSnapshot(entry, "撤销");
  };

  const redo = () => {
    if (!history.future.length) {
      showToast("没有可重做的操作", 2200);
      return;
    }
    const entry = history.future.pop();
    history.past.push({ label: entry.label, data: JSON.parse(JSON.stringify(state.data)) });
    restoreSnapshot(entry, "重做");
  };

  /* ---------------------------------------------------------------------- */
  /* Theme palette                                                           */
  /* ---------------------------------------------------------------------- */
  const hexToRgb = (hex) => {
    let value = String(hex || "").replace("#", "").trim();
    if (value.length === 3) {
      value = value.split("").map((part) => part + part).join("");
    }
    const number = Number.parseInt(value, 16);
    if (!Number.isFinite(number)) return { r: 15, g: 15, b: 15 };
    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255
    };
  };

  const hexToRgba = (hex, alpha) => {
    const { r, g, b } = hexToRgb(hex);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  };

  const luminance = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const channels = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };

  const toneForBackground = (background) =>
    luminance(background) > 0.52
      ? { ink: "#1c1b18", muted: "#5f5b54", faint: "#8a8276" }
      : { ink: "#ece7dd", muted: "#8d887e", faint: "#5f5b54" };

  const themeValues = (theme) => {
    const source = theme && typeof theme === "object" ? theme : {};
    const preset = THEME_PRESETS[source.preset] || null;
    const background = source.background || (preset ? preset.bg : THEME_PRESETS.warm.bg);
    const accent = source.accent || (preset ? preset.accent : THEME_PRESETS.warm.accent);
    const fallback = preset || toneForBackground(background);
    return {
      background,
      bgSoft: source.bgSoft || (preset ? preset.bgSoft : background),
      ink: source.ink || fallback.ink,
      muted: source.muted || fallback.muted,
      faint: source.faint || fallback.faint,
      accent
    };
  };

  const updateThemeControls = (theme, values) => {
    if (themePresets) {
      const active = theme && theme.preset;
      themePresets.querySelectorAll(".theme-preset").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.theme === active);
      });
    }
    if (accentColor) accentColor.value = values.accent;
    if (bgColor) bgColor.value = values.background;
  };

  const applyTheme = (theme) => {
    const values = themeValues(theme);
    const root = document.documentElement.style;
    root.setProperty("--bg", values.background);
    root.setProperty("--bg-soft", values.bgSoft);
    root.setProperty("--ink", values.ink);
    root.setProperty("--muted", values.muted);
    root.setProperty("--faint", values.faint);
    root.setProperty("--warm", values.accent);
    root.setProperty("--line", hexToRgba(values.ink, 0.13));

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", values.background);

    if (themePreview) {
      themePreview.style.background = values.background;
      themePreview.style.color = values.ink;
      themePreview.style.setProperty("--preview-accent", values.accent);
    }
    updateThemeControls(theme, values);
  };

  const buildThemePresets = () => {
    if (!themePresets || themePresets.dataset.built === "1") return;
    Object.entries(THEME_PRESETS).forEach(([id, preset]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-preset";
      button.dataset.theme = id;

      const dots = document.createElement("span");
      dots.className = "theme-dots";
      [preset.bg, preset.bgSoft, preset.accent, preset.ink].forEach((color) => {
        const dot = document.createElement("span");
        dot.className = "theme-dot";
        dot.style.background = color;
        dots.append(dot);
      });

      const copy = document.createElement("span");
      copy.className = "theme-copy";
      const name = document.createElement("strong");
      name.textContent = preset.label;
      const hint = document.createElement("small");
      hint.textContent = preset.hint;
      copy.append(name, hint);

      button.append(dots, copy);
      button.addEventListener("click", () => selectThemePreset(id));
      themePresets.append(button);
    });
    themePresets.dataset.built = "1";
  };

  const selectThemePreset = (id) => {
    const preset = THEME_PRESETS[id];
    if (!preset || !state.data) return;
    state.data.theme = {
      preset: id,
      accent: preset.accent,
      background: preset.bg
    };
    applyTheme(state.data.theme);
    markDirty();
  };

  const applyCustomTheme = () => {
    if (!state.data || !bgColor || !accentColor) return;
    const background = bgColor.value;
    const accent = accentColor.value;
    const tone = toneForBackground(background);
    state.data.theme = {
      preset: "custom",
      background,
      accent,
      ink: tone.ink,
      muted: tone.muted,
      faint: tone.faint
    };
    applyTheme(state.data.theme);
    markDirty();
  };

  const openThemeModal = () => {
    if (!themeModal) return;
    buildThemePresets();
    applyTheme(state.data ? state.data.theme : { preset: DEFAULT_THEME });
    themeModal.hidden = false;
  };

  const closeThemeModal = () => {
    if (themeModal) themeModal.hidden = true;
  };

  const resetTheme = () => {
    selectThemePreset(DEFAULT_THEME);
  };

  const openHelp = () => {
    if (!helpModal) return;
    helpModal.hidden = false;
    try {
      window.localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch (error) {
      /* ignore */
    }
  };

  const closeHelp = () => {
    if (helpModal) helpModal.hidden = true;
  };

  const bookFileFor = (file) =>
    String(file || "").replace(/-2000\.(webp|jpe?g|png|avif)$/i, "-1000.$1");

  const normaliseData = (raw) => {
    const data = raw && typeof raw === "object" ? raw : {};
    data.meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    data.theme = data.theme && typeof data.theme === "object" ? data.theme : { preset: DEFAULT_THEME };
    if (!data.theme.preset) data.theme.preset = DEFAULT_THEME;
    if (!THEME_PRESETS[data.theme.preset] && !data.theme.background) {
      data.theme.preset = DEFAULT_THEME;
    }
    data.groups = Array.isArray(data.groups) && data.groups.length
      ? data.groups
      : [{ id: "all", label: "全部作品", label_en: "All plates", description: "" }];
    data.photos = Array.isArray(data.photos) ? data.photos : [];
    data.book_afterword = data.book_afterword && typeof data.book_afterword === "object"
      ? data.book_afterword
      : { title: "", body: [], signature: "" };

    data.groups.forEach((group, index) => {
      if (!group.id) group.id = "group-" + (index + 1);
      if (!group.label) group.label = group.label_en || group.id;
      if (!group.label_en) group.label_en = "";
      if (!group.description) group.description = "";
    });

    const groupIds = new Set(data.groups.map((group) => group.id));

    data.photos.forEach((photo, index) => {
      if (!photo.id) photo.id = "photo-" + (index + 1);
      photo.title = String(photo.title || "Untitled");
      photo.note = String(photo.note || "");
      photo.alt = String(photo.alt || photo.note || photo.title);
      photo.file = String(photo.file || photo.full || "");
      photo.book_file = String(
        photo.book_file ||
          photo.book ||
          (isInlineImage(photo.file) ? "" : bookFileFor(photo.file))
      );
      photo.essay = essayHtml(photo.essay);
      photo.width = Number(photo.width) || 1000;
      photo.height = Number(photo.height) || 667;
      photo.orientation = photo.orientation || (photo.height > photo.width ? "portrait" : "landscape");
      if (!groupIds.has(photo.group)) photo.group = data.groups[0].id;

      if (photo.layout && typeof photo.layout === "object") {
        const x = Number(photo.layout.x);
        const y = Number(photo.layout.y);
        const w = Number(photo.layout.w);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w)) {
          photo.layout = {
            x: Math.min(0.96, Math.max(0, x)),
            y: Math.max(0, y),
            w: Math.min(0.96, Math.max(0.08, w))
          };
          photo.layout.x = Math.min(photo.layout.x, 0.98 - photo.layout.w);
        } else {
          delete photo.layout;
        }
      } else if (photo.layout) {
        delete photo.layout;
      }

      if (photo.transform && typeof photo.transform === "object") {
        const rotation = Number(photo.transform.r);
        const scale = Number(photo.transform.s);
        const nextR = Number.isFinite(rotation) ? Math.max(-180, Math.min(180, rotation)) : 0;
        const nextS = Number.isFinite(scale) ? Math.max(0.4, Math.min(2, scale)) : 1;
        if (Math.round(nextR) === 0 && Math.abs(nextS - 1) < 0.001) {
          delete photo.transform;
        } else {
          photo.transform = { r: Math.round(nextR), s: Math.round(nextS * 100) / 100 };
        }
      } else if (photo.transform) {
        delete photo.transform;
      }
    });

    return data;
  };

  const storeSupported = !!(window.PortfolioStore && window.PortfolioStore.isSupported());

  const storageErrorMessage = (error) => {
    if (error && (error.name === "QuotaExceededError" || /quota/i.test(error.message || ""))) {
      return "浏览器存储空间不足，请先导出备份，再删除部分本机照片";
    }
    return (error && error.message) || "未知错误";
  };

  const persistDraft = async () => {
    if (!state.data) return false;
    if (!storeSupported) {
      showToast("当前浏览器不支持 IndexedDB，修改无法保存", 5600);
      return false;
    }
    try {
      await window.PortfolioStore.write(state.data);
      state.dirty = false;
      state.saved = true;
      updateEditorStatus();
      return true;
    } catch (error) {
      showToast("保存失败：" + storageErrorMessage(error), 6200);
      return false;
    }
  };

  const scheduleDraft = () => {
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(persistDraft, 700);
  };

  const updateEditorStatus = () => {
    if (!editorStatus) return;
    editorStatus.classList.toggle("is-dirty", state.dirty);
    if (state.dirty) {
      editorStatus.textContent = "正在写入本机浏览器数据库…";
    } else if (state.saved) {
      editorStatus.textContent = "已保存到 " + STORE_LABEL + " · 仅当前设备可见";
    } else {
      editorStatus.textContent = "编辑模式：点击文字修改，拖动 ⠿ 调整分组";
    }
  };

  const markDirty = () => {
    state.dirty = true;
    state.saved = false;
    updateEditorStatus();
    scheduleDraft();
  };

  const loadStoredData = async () => {
    if (!storeSupported) return null;
    try {
      const stored = await window.PortfolioStore.read();
      return stored && Array.isArray(stored.photos) ? stored : null;
    } catch (error) {
      return null;
    }
  };

  const loadSeedData = async () => {
    try {
      const response = await fetch(SEED_URL, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && Array.isArray(payload.photos) ? payload : null;
    } catch (error) {
      return null;
    }
  };

  const buildPayload = () => {
    const payload = JSON.parse(JSON.stringify(state.data));
    payload.meta = payload.meta || {};
    payload.meta.updated = new Date().toISOString().slice(0, 10);
    payload.meta.revision = new Date().toISOString();
    payload.photos.forEach((photo) => {
      photo.essay = essayHtml(photo.essay);
      photo.alt = photo.alt || photo.note || photo.title;
    });
    return payload;
  };

  const saveToStorage = async () => {
    if (!state.data || !saveBtn) return;
    const original = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "保存中…";
    state.data.meta = state.data.meta || {};
    state.data.meta.updated = new Date().toISOString().slice(0, 10);
    state.data.meta.revision = new Date().toISOString();
    const ok = await persistDraft();
    if (ok) {
      state.baseUpdated = state.data.meta.updated;
      showToast("已保存到本机浏览器 · 数据只在这台设备", 4200);
    }
    saveBtn.disabled = false;
    saveBtn.textContent = original;
  };

  const setEditable = (element) => {
    if (!element) return;
    if (state.admin) {
      element.setAttribute("contenteditable", "true");
      element.spellcheck = false;
    } else {
      element.removeAttribute("contenteditable");
    }
  };

  const findFigure = (id) =>
    Array.from(grid.querySelectorAll(".plate")).find((figure) => figure.dataset.id === id) || null;

  const updateGalleryCaption = (photo) => {
    const figure = findFigure(photo.id);
    if (!figure) return;
    const title = figure.querySelector(".plate-title");
    const note = figure.querySelector(".plate-note");
    const open = figure.querySelector(".plate-open");
    if (title && document.activeElement !== title) title.textContent = photo.title;
    if (note && document.activeElement !== note) note.textContent = photo.note;
    if (open) open.setAttribute("aria-label", "View " + photo.title + ", plate " + pad(photoIndex(photo.id) + 1));
  };

  const createPlate = (photo, indexInGroup, groupId) => {
    const pattern = LAYOUT_PATTERNS[groupId] || LAYOUT_PATTERNS.default;
    const layout = pattern[indexInGroup] || LAYOUT_PATTERNS.default[indexInGroup % LAYOUT_PATTERNS.default.length];
    const figure = document.createElement("figure");
    figure.className = "plate reveal";
    figure.dataset.id = photo.id;
    figure.style.setProperty("--plate-col", layout.col);
    figure.style.setProperty("--plate-span", layout.span);
    figure.style.setProperty("--plate-offset", layout.offset);
    if (photo.layout) {
      figure.classList.add("plate--free");
      figure.style.left = photo.layout.x * 100 + "%";
      figure.style.width = photo.layout.w * 100 + "%";
    }

    const media = document.createElement("div");
    media.className = "plate-media";
    media.dataset.file = photo.file;
    media.style.setProperty("--ratio", photo.width + " / " + photo.height);

    const img = document.createElement("img");
    img.src = imageUrl(photo.file);
    img.alt = photo.alt;
    img.width = photo.width;
    img.height = photo.height;
    img.loading = indexInGroup < 2 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("load", () => media.classList.remove("is-missing"));
    img.addEventListener("error", () => media.classList.add("is-missing"));

    const number = document.createElement("span");
    number.className = "plate-num";
    number.textContent = "[ " + pad(photoIndex(photo.id) + 1) + " ]";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "plate-open";
    open.dataset.id = photo.id;
    open.setAttribute("aria-label", "View " + photo.title + ", plate " + pad(photoIndex(photo.id) + 1));

    const caption = document.createElement("div");
    caption.className = "plate-caption";

    const rule = document.createElement("span");
    rule.className = "plate-rule";

    const title = document.createElement("h3");
    title.className = "plate-title";
    title.dataset.field = "title";
    title.textContent = photo.title;

    const note = document.createElement("p");
    note.className = "plate-note";
    note.dataset.field = "note";
    note.textContent = photo.note;

    setEditable(title);
    setEditable(note);
    caption.append(rule, title, note);

    if (state.admin && state.data.groups.length) {
      const groupWrap = document.createElement("span");
      groupWrap.className = "plate-group-wrap";

      const groupTag = document.createElement("span");
      groupTag.className = "plate-group-tag";
      groupTag.textContent = "分组";

      const groupSelect = document.createElement("select");
      groupSelect.className = "plate-group-select";
      groupSelect.dataset.id = photo.id;
      groupSelect.setAttribute("aria-label", "调整这张照片的分组");
      groupSelect.title = "调整这张照片的分组";
      state.data.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.label;
        groupSelect.append(option);
      });
      groupSelect.value = photo.group;
      groupSelect.addEventListener("change", () => {
        const nextGroup = groupById(groupSelect.value);
        if (!nextGroup || nextGroup.id === photo.group) return;
        pushHistory("调整分组");
        photo.group = nextGroup.id;
        if (state.data.layout_mode) {
          delete photo.layout;
          assignLayoutsForGroup(nextGroup.id);
        }
        renderGallery();
        markDirty();
        showToast("已移动到「" + nextGroup.label + "」", 2800);
      });

      groupWrap.append(groupTag, groupSelect);
      caption.append(groupWrap);
    }

    const tools = document.createElement("div");
    tools.className = "plate-tools";

    const drag = document.createElement("button");
    drag.type = "button";
    drag.className = "plate-tool plate-tool--drag";
    drag.dataset.id = photo.id;
    drag.setAttribute("aria-label", "拖动调整分组");
    drag.title = "拖动调整分组";
    drag.textContent = "⠿";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "plate-tool plate-tool--delete";
    remove.dataset.id = photo.id;
    remove.setAttribute("aria-label", "移除这张照片");
    remove.title = "移除这张照片";
    remove.textContent = "×";

    tools.append(drag, remove);
    const photoWrap = document.createElement("div");
    photoWrap.className = "plate-photo";
    if (photo.transform) {
      media.classList.add("has-transform");
      photoWrap.style.transform = transformCss(photo);
    }
    photoWrap.append(img);
    media.append(photoWrap, number, open, caption, tools);
    figure.append(media);

    if (state.freeLayout) {
      figure.addEventListener("click", (event) => {
        if (event.target.closest(".plate-tool--delete")) return;
        selectPhoto(photo.id);
      });
    }

    if (state.freeLayout && photo.layout) {
      drag.title = "拖动这张照片（自由排版）";
      drag.setAttribute("aria-label", "拖动这张照片（自由排版）");
      const resize = document.createElement("span");
      resize.className = "plate-resize";
      resize.title = "拖动右下角调整宽度";
      resize.setAttribute("aria-label", "拖动调整照片宽度");
      figure.append(resize);
      bindFreeDrag(figure, photo, resize);
    }

    return figure;
  };

  const updateIntro = () => {
    const count = document.getElementById("introCount");
    if (count) {
      count.textContent = state.data.photos.length
        ? "Plates 01—" + pad(state.data.photos.length)
        : "No plates yet";
    }
    const introText = document.getElementById("introText");
    if (introText && state.data.meta.intro_text) {
      introText.textContent = state.data.meta.intro_text;
    }
  };

  /* Free layout ----------------------------------------------------------- */
  const FREE_GUTTER = 0.045;
  const FREE_WIDTH = 0.44;

  const freeBounds = (photos) => {
    let bottom = 0.6;
    photos.forEach((photo) => {
      if (!photo.layout) return;
      const box = layoutBox(photo);
      bottom = Math.max(bottom, photo.layout.y + box.h + 0.05);
    });
    return bottom;
  };

  const layoutBox = (photo) => {
    const ratio = photo.width > 0 ? photo.height / photo.width : 0.66;
    const t = photo.transform || {};
    const scale = Number(t.s) || 1;
    const angle = ((Number(t.r) || 0) * Math.PI) / 180;
    const w = photo.layout.w * scale;
    const h = photo.layout.w * ratio * scale;
    return {
      w: Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle)),
      h: Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle))
    };
  };

  const layoutFreeGrid = (gridEl, groupId) => {
    if (!state.data) return;
    const photos = state.data.photos.filter((photo) => photo.group === groupId && photo.layout);
    if (!photos.length) return;
    const bounds = freeBounds(photos);
    gridEl.style.setProperty("aspect-ratio", "1 / " + bounds.toFixed(4));
    photos.forEach((photo) => {
      const plate = Array.from(gridEl.children).find((node) => node.dataset.id === photo.id);
      if (!plate) return;
      plate.style.top = ((photo.layout.y / bounds) * 100).toFixed(4) + "%";
    });
  };

  const assignLayoutsForGroup = (groupId) => {
    if (!state.data) return;
    const photos = state.data.photos.filter((photo) => photo.group === groupId);
    const bottoms = [FREE_GUTTER, FREE_GUTTER];

    photos.forEach((photo) => {
      if (!photo.layout) return;
      const ratio = photo.width > 0 ? photo.height / photo.width : 0.66;
      const column = photo.layout.x < 0.5 ? 0 : 1;
      bottoms[column] = Math.max(
        bottoms[column],
        photo.layout.y + photo.layout.w * ratio + FREE_GUTTER
      );
    });

    photos.forEach((photo) => {
      if (photo.layout) return;
      const ratio = photo.width > 0 ? photo.height / photo.width : 0.66;
      const column = bottoms[0] <= bottoms[1] ? 0 : 1;
      photo.layout = {
        x: column === 0 ? FREE_GUTTER : 0.5 + FREE_GUTTER / 2,
        y: Math.round(bottoms[column] * 10000) / 10000,
        w: FREE_WIDTH
      };
      bottoms[column] += FREE_WIDTH * ratio + FREE_GUTTER;
    });
  };

  const bindFreeDrag = (figure, photo, resizeHandle) => {
    const handle = figure.querySelector(".plate-tool--drag");
    if (!handle) return;

    const begin = (event, mode) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (!state.freeLayout || !photo.layout) return;
      const gridEl = figure.closest(".group-grid");
      if (!gridEl) return;
      const width = gridEl.getBoundingClientRect().width || 1;
      const origin = { x: photo.layout.x, y: photo.layout.y, w: photo.layout.w };
      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;

      event.preventDefault();
      event.stopPropagation();
      figure.setPointerCapture(pointerId);
      figure.classList.add("is-free-dragging");
      freeDragging = true;

      const onMove = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const dx = (moveEvent.clientX - startX) / width;
        const dy = (moveEvent.clientY - startY) / width;
        if (mode === "resize") {
          photo.layout.w = Math.min(0.98 - photo.layout.x, Math.max(0.12, origin.w + dx));
        } else {
          photo.layout.w = origin.w;
          photo.layout.x = Math.max(0, Math.min(0.98 - photo.layout.w, origin.x + dx));
          photo.layout.y = Math.max(0, origin.y + dy);
        }
        figure.style.left = photo.layout.x * 100 + "%";
        figure.style.width = photo.layout.w * 100 + "%";
        const bounds = freeBounds(
          state.data.photos.filter((item) => item.group === photo.group && item.layout)
        );
        layoutFreeGrid(gridEl, photo.group);
        figure.style.top = (photo.layout.y / bounds) * 100 + "%";
      };

      const end = (endEvent) => {
        if (endEvent.pointerId !== pointerId) return;
        figure.removeEventListener("pointermove", onMove);
        figure.removeEventListener("pointerup", end);
        figure.removeEventListener("pointercancel", end);
        try {
          figure.releasePointerCapture(pointerId);
        } catch (error) {
          /* ignore */
        }
        figure.classList.remove("is-free-dragging");
        freeDragging = false;
        photo.layout.x = Math.round(photo.layout.x * 10000) / 10000;
        photo.layout.y = Math.round(photo.layout.y * 10000) / 10000;
        photo.layout.w = Math.round(photo.layout.w * 10000) / 10000;
        markDirty();
      };

      figure.addEventListener("pointermove", onMove);
      figure.addEventListener("pointerup", end);
      figure.addEventListener("pointercancel", end);
    };

    handle.addEventListener("pointerdown", (event) => begin(event, "move"));
    if (resizeHandle) {
      resizeHandle.addEventListener("pointerdown", (event) => begin(event, "resize"));
    }
  };

  const setFreeLayout = (on) => {
    if (!state.data) return;
    const next = !!on;
    if (next && !state.freeLayout) {
      state.data.layout_mode = true;
      state.data.groups.forEach((group) => assignLayoutsForGroup(group.id));
      showToast("自由排版已开启：拖动照片右上角 ⠿ 移动，拖动右下角圆点缩放", 6000);
    }
    state.freeLayout = next;
    document.body.classList.toggle("is-free-editing", next);
    if (layoutBtn) layoutBtn.textContent = next ? "退出自由排版" : "自由排版";
    if (resetLayoutBtn) resetLayoutBtn.hidden = !next;
    if (!next && state.overviewOpen) closeBoard();
    if (!next) state.selectedId = null;
    renderGallery();
    updateLayoutBar();
    markDirty();
  };

  const clearFreeLayout = () => {
    if (!state.data) return;
    if (!window.confirm("清除所有自由排版位置，恢复默认的杂志式排列？照片与文字不会删除。")) return;
    pushHistory("清除自由排版");
    state.data.layout_mode = false;
    state.data.photos.forEach((photo) => {
      delete photo.layout;
      delete photo.transform;
    });
    state.freeLayout = false;
    state.selectedId = null;
    if (state.overviewOpen) closeBoard();
    document.body.classList.remove("is-free-editing");
    if (layoutBtn) layoutBtn.textContent = "自由排版";
    if (resetLayoutBtn) resetLayoutBtn.hidden = true;
    renderGallery();
    updateLayoutBar();
    markDirty();
    showToast("已恢复默认排列", 3200);
  };

  /* Selection + transform + overview board -------------------------------- */
  const currentSelectedPhoto = () => (state.selectedId ? photoById(state.selectedId) : null);

  const updateLayoutBar = () => {
    const active = !!state.freeLayout || !!state.overviewOpen;
    if (layoutBar) layoutBar.hidden = !active;
    if (!active) return;

    const photo = currentSelectedPhoto();
    if (layoutSelection) {
      layoutSelection.textContent = photo ? photo.title : "点击照片后可旋转 / 缩放";
    }
    const t = (photo && photo.transform) || { r: 0, s: 1 };
    if (rotateRange) {
      rotateRange.disabled = !photo;
      rotateRange.value = String(Math.round(Number(t.r) || 0));
    }
    if (rotateValue) rotateValue.textContent = Math.round(Number(t.r) || 0) + "°";
    if (scaleRange) {
      scaleRange.disabled = !photo;
      scaleRange.value = String(Math.round((Number(t.s) || 1) * 100));
    }
    if (scaleValue) scaleValue.textContent = Math.round((Number(t.s) || 1) * 100) + "%";
    if (resetTransformBtn) resetTransformBtn.disabled = !photo;
  };

  const selectPhoto = (id) => {
    state.selectedId = id;
    grid.querySelectorAll(".plate.is-selected").forEach((item) => item.classList.remove("is-selected"));
    const figure = findFigure(id);
    if (figure) figure.classList.add("is-selected");
    if (boardEl) {
      boardEl.querySelectorAll(".board-item.is-selected").forEach((item) => item.classList.remove("is-selected"));
      const item = boardEl.querySelector('.board-item[data-id="' + id + '"]');
      if (item) item.classList.add("is-selected");
    }
    updateLayoutBar();
  };

  const syncPhotoTransform = (photo) => {
    const figure = findFigure(photo.id);
    const photoWrap = figure ? figure.querySelector(".plate-photo") : null;
    if (photoWrap) {
      photoWrap.style.transform = transformCss(photo);
      const mediaEl = photoWrap.parentElement;
      if (mediaEl) mediaEl.classList.toggle("has-transform", !!photo.transform);
    }

    if (boardEl) {
      const item = boardEl.querySelector('.board-item[data-id="' + photo.id + '"]');
      const image = item ? item.querySelector("img") : null;
      if (image) image.style.transform = transformCss(photo);
    }

    if (photo.layout) {
      const gridEl = grid.querySelector('.group-grid[data-group="' + photo.group + '"]');
      if (gridEl) layoutFreeGrid(gridEl, photo.group);
      const canvas = boardEl
        ? boardEl.querySelector('.board-canvas[data-group="' + photo.group + '"]')
        : null;
      if (canvas) layoutBoardCanvas(canvas, photo.group);
    }
  };

  const setPhotoTransform = (photo, rotation, scale) => {
    if (!photo) return;
    const nextR = Math.round(Math.max(-180, Math.min(180, rotation)));
    const nextS = Math.round(Math.max(0.4, Math.min(2, scale)) * 100) / 100;
    if (nextR === 0 && Math.abs(nextS - 1) < 0.001) {
      delete photo.transform;
    } else {
      photo.transform = { r: nextR, s: nextS };
    }
    syncPhotoTransform(photo);
    updateLayoutBar();
    markDirty();
  };

  const layoutBoardCanvas = (canvas, groupId) => {
    if (!canvas || !state.data) return;
    const photos = state.data.photos.filter((photo) => photo.group === groupId && photo.layout);
    const bounds = freeBounds(photos);
    canvas.style.setProperty("aspect-ratio", "1 / " + bounds.toFixed(4));
    canvas._bounds = bounds;
    photos.forEach((photo) => {
      const item = canvas.querySelector('.board-item[data-id="' + photo.id + '"]');
      if (item) item.style.top = ((photo.layout.y / bounds) * 100).toFixed(4) + "%";
    });
  };

  const applyLayoutToFigure = (photo) => {
    const figure = findFigure(photo.id);
    if (!figure || !photo.layout) return;
    figure.style.left = photo.layout.x * 100 + "%";
    figure.style.width = photo.layout.w * 100 + "%";
    const gridEl = figure.closest(".group-grid");
    if (gridEl) layoutFreeGrid(gridEl, photo.group);
  };

  const findBoardCanvas = (clientX, clientY) => {
    const stack = document.elementsFromPoint(clientX, clientY) || [];
    for (const element of stack) {
      const canvas = element.closest ? element.closest(".board-canvas") : null;
      if (!canvas) continue;
      const rect = canvas.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return canvas;
      }
    }
    return null;
  };

  const bindBoardDrag = (item, photo, canvas, handle) => {
    const begin = (event, mode) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (!photo.layout) return;
      event.preventDefault();
      event.stopPropagation();

      const startCanvas = canvas;
      const startRect = startCanvas.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const grabX = (event.clientX - itemRect.left) / (startRect.width || 1);
      const grabY = (event.clientY - itemRect.top) / (startRect.width || 1);
      const startW = photo.layout.w;
      const startX = event.clientX;
      const pointerId = event.pointerId;
      const originalGroup = photo.group;
      let activeCanvas = startCanvas;
      let activeGroup = photo.group;

      item.setPointerCapture(pointerId);
      item.classList.add("is-dragging");

      const refreshCanvases = (groups) => {
        groups.forEach((groupId) => {
          const target = boardEl.querySelector('.board-canvas[data-group="' + groupId + '"]');
          if (target) layoutBoardCanvas(target, groupId);
        });
      };

      const move = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        let previousGroup = null;

        if (mode === "resize") {
          const width = activeCanvas.getBoundingClientRect().width || 1;
          const dx = (moveEvent.clientX - startX) / width;
          photo.layout.w = Math.min(0.96 - photo.layout.x, Math.max(0.12, startW + dx));
        } else {
          const target = findBoardCanvas(moveEvent.clientX, moveEvent.clientY);
          if (target) {
            const targetGroup = target.dataset.group;
            const targetRect = target.getBoundingClientRect();
            if (target !== activeCanvas) {
              previousGroup = activeGroup;
              target.append(item);
              activeCanvas = target;
              activeGroup = targetGroup;
              photo.group = targetGroup;
              boardEl.querySelectorAll(".board-canvas.is-drop-target").forEach((node) => {
                if (node !== target) node.classList.remove("is-drop-target");
              });
              target.classList.add("is-drop-target");
            }
            const width = targetRect.width || 1;
            const nextX = (moveEvent.clientX - targetRect.left) / width - grabX;
            const nextY = (moveEvent.clientY - targetRect.top) / width - grabY;
            photo.layout.x = Math.max(0, Math.min(0.96 - photo.layout.w, nextX));
            photo.layout.y = Math.max(0, nextY);
          }
        }

        item.style.left = photo.layout.x * 100 + "%";
        item.style.width = photo.layout.w * 100 + "%";
        const groups = [activeGroup];
        if (previousGroup && previousGroup !== activeGroup) groups.push(previousGroup);
        refreshCanvases(groups);
        const mainGrid = grid.querySelector('.group-grid[data-group="' + photo.group + '"]');
        if (mainGrid) layoutFreeGrid(mainGrid, photo.group);
      };

      const end = (endEvent) => {
        if (endEvent.pointerId !== pointerId) return;
        item.removeEventListener("pointermove", move);
        item.removeEventListener("pointerup", end);
        item.removeEventListener("pointercancel", end);
        try {
          item.releasePointerCapture(pointerId);
        } catch (error) {
          /* ignore */
        }
        item.classList.remove("is-dragging");
        boardEl.querySelectorAll(".board-canvas.is-drop-target").forEach((node) => {
          node.classList.remove("is-drop-target");
        });
        photo.layout.x = Math.round(photo.layout.x * 10000) / 10000;
        photo.layout.y = Math.round(photo.layout.y * 10000) / 10000;
        photo.layout.w = Math.round(photo.layout.w * 10000) / 10000;

        if (originalGroup !== photo.group) {
          renderGallery();
          renderBoard();
          selectPhoto(photo.id);
        } else {
          const gridEl = grid.querySelector('.group-grid[data-group="' + photo.group + '"]');
          if (gridEl) layoutFreeGrid(gridEl, photo.group);
        }
        markDirty();
      };

      item.addEventListener("pointermove", move);
      item.addEventListener("pointerup", end);
      item.addEventListener("pointercancel", end);
    };

    item.addEventListener("pointerdown", (event) => {
      if (event.target === handle) return;
      begin(event, "move");
    });
    handle.addEventListener("pointerdown", (event) => begin(event, "resize"));
  };

  const renderBoard = () => {
    if (!boardEl || !state.data) return;
    boardEl.innerHTML = "";

    state.data.groups.forEach((group, index) => {
      const photos = state.data.photos.filter((photo) => photo.group === group.id && photo.layout);

      const section = document.createElement("section");
      section.className = "board-group";

      const head = document.createElement("div");
      head.className = "board-head";
      const name = document.createElement("span");
      name.textContent = "Chapter " + pad(index + 1) + " · " + group.label;
      const count = document.createElement("span");
      count.textContent = photos.length + " 张";
      head.append(name, count);

      const canvas = document.createElement("div");
      canvas.className = "board-canvas";
      canvas.dataset.group = group.id;

      if (!photos.length) {
        const hint = document.createElement("p");
        hint.className = "board-empty";
        hint.textContent = "空章节 · 把照片拖到这里即可换组";
        canvas.append(hint);
      }

      photos.forEach((photo) => {
        const item = document.createElement("div");
        item.className = "board-item";
        item.dataset.id = photo.id;
        item.style.left = photo.layout.x * 100 + "%";
        item.style.width = photo.layout.w * 100 + "%";

        const image = document.createElement("img");
        image.src = imageUrl(photo.file);
        image.alt = photo.title;
        image.loading = "lazy";
        image.style.transformOrigin = "center";
        if (photo.transform) image.style.transform = transformCss(photo);

        const handle = document.createElement("span");
        handle.className = "board-resize";
        handle.setAttribute("aria-label", "调整宽度");

        item.append(image, handle);
        bindBoardDrag(item, photo, canvas, handle);
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          selectPhoto(photo.id);
        });

        canvas.append(item);
      });

      section.append(head, canvas);
      boardEl.append(section);
      layoutBoardCanvas(canvas, group.id);
    });
  };

  const openBoard = () => {
    if (!state.data) return;
    if (!state.data.layout_mode) setFreeLayout(true);
    state.overviewOpen = true;
    renderBoard();
    if (boardModal) boardModal.hidden = false;
    updateLayoutBar();
  };

  const closeBoard = () => {
    state.overviewOpen = false;
    if (boardModal) boardModal.hidden = true;
    updateLayoutBar();
  };

  const renderGallery = () => {
    if (!state.data) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    state.data.groups.forEach((group, groupIndex) => {
      const photos = state.data.photos.filter((photo) => photo.group === group.id);
      const section = document.createElement("section");
      section.className = "group";
      section.dataset.group = group.id;
      section.dataset.chapter = pad(groupIndex + 1);

      const head = document.createElement("div");
      head.className = "group-head";

      const index = document.createElement("p");
      index.className = "group-index";
      index.textContent = "Chapter " + pad(groupIndex + 1);

      const label = document.createElement("h2");
      label.className = "group-label";
      label.textContent = group.label;
      if (group.label_en) {
        const labelEn = document.createElement("span");
        labelEn.className = "group-label-en";
        labelEn.textContent = group.label_en;
        label.append(labelEn);
      }

      const count = document.createElement("p");
      count.className = "group-count";
      count.textContent = photos.length + (photos.length === 1 ? " plate" : " plates");

      const description = document.createElement("p");
      description.className = "group-desc";
      description.textContent = group.description;

      head.append(index, label, count, description);

      const groupGrid = document.createElement("div");
      groupGrid.className = "group-grid";
      groupGrid.dataset.group = group.id;

      if (photos.length) {
        photos.forEach((photo, indexInGroup) => groupGrid.append(createPlate(photo, indexInGroup, group.id)));
      } else {
        const empty = document.createElement("p");
        empty.className = "group-empty";
        empty.textContent = "暂无照片 · 将照片拖到这里";
        groupGrid.append(empty);
      }

      const hasFreeLayout = photos.some((photo) => photo.layout);
      if (hasFreeLayout) {
        groupGrid.classList.add("group-grid--free");
        layoutFreeGrid(groupGrid, group.id);
      }

      section.append(head, groupGrid);
      fragment.append(section);
    });

    grid.append(fragment);
    setupSortables();
    observeReveals();
    updateIntro();
    updateLayoutBar();
  };

  const updateNumbers = () => {
    state.data.photos.forEach((photo, index) => {
      const figure = findFigure(photo.id);
      if (!figure) return;
      const number = figure.querySelector(".plate-num");
      const open = figure.querySelector(".plate-open");
      if (number) number.textContent = "[ " + pad(index + 1) + " ]";
      if (open) open.setAttribute("aria-label", "View " + photo.title + ", plate " + pad(index + 1));
    });
  };

  const updateGroupCounts = () => {
    state.data.groups.forEach((group) => {
      const section = Array.from(grid.querySelectorAll(".group")).find((item) => item.dataset.group === group.id);
      if (!section) return;
      const count = state.data.photos.filter((photo) => photo.group === group.id).length;
      const label = section.querySelector(".group-count");
      if (label) label.textContent = count + (count === 1 ? " plate" : " plates");
    });
  };

  const refreshEmptyStates = () => {
    grid.querySelectorAll(".group-grid").forEach((groupGrid) => {
      const hasPlate = !!groupGrid.querySelector(".plate");
      const empty = groupGrid.querySelector(".group-empty");
      if (hasPlate && empty) empty.remove();
      if (!hasPlate && !empty) {
        const placeholder = document.createElement("p");
        placeholder.className = "group-empty";
        placeholder.textContent = "暂无照片 · 将照片拖到这里";
        groupGrid.append(placeholder);
      }
    });
  };

  const syncOrderFromDom = () => {
    if (!state.data) return;
    const before = JSON.stringify(state.data);
    const ordered = [];
    const seen = new Set();

    grid.querySelectorAll(".group-grid").forEach((groupGrid) => {
      const groupId = groupGrid.dataset.group;
      groupGrid.querySelectorAll(":scope > .plate").forEach((figure) => {
        const photo = photoById(figure.dataset.id);
        if (!photo || seen.has(photo.id)) return;
        photo.group = groupId;
        seen.add(photo.id);
        ordered.push(photo);
      });
    });

    state.data.photos.forEach((photo) => {
      if (!seen.has(photo.id)) ordered.push(photo);
    });

    state.data.photos = ordered;
    refreshEmptyStates();
    updateNumbers();
    updateGroupCounts();
    if (JSON.stringify(state.data) !== before) {
      history.past.push({ label: "调整顺序", data: JSON.parse(before) });
      if (history.past.length > HISTORY_LIMIT) history.past.shift();
      history.future.length = 0;
      markDirty();
    }
  };

  let sortDragging = false;
  let freeDragging = false;

  const startDragScroll = () => {
    sortDragging = true;
    document.documentElement.style.scrollBehavior = "auto";
  };

  const stopDragScroll = () => {
    sortDragging = false;
    document.documentElement.style.scrollBehavior = "";
  };

  const handleDragWheel = (event) => {
    if (sortDragging) {
      event.preventDefault();
      const scroller = document.scrollingElement || document.documentElement;
      scroller.scrollTop += event.deltaY;
      return;
    }
    if (freeDragging) event.preventDefault();
  };

  const handleDragKey = (event) => {
    if (!sortDragging) return;
    const step = { ArrowDown: 90, ArrowUp: -90, PageDown: 520, PageUp: -520 }[event.key];
    if (!step) return;
    event.preventDefault();
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTop += step;
  };

  const highlightDropGroup = (target) => {
    const section = target && target.closest ? target.closest(".group") : null;
    grid.querySelectorAll(".group.is-drop-target").forEach((item) => {
      if (item !== section) item.classList.remove("is-drop-target");
    });
    if (section) section.classList.add("is-drop-target");
  };

  const setupSortables = () => {
    grid.querySelectorAll(".group-grid").forEach((groupGrid) => {
      if (groupGrid._sortable) {
        groupGrid._sortable.destroy();
        groupGrid._sortable = null;
      }
      if (!state.admin || state.freeLayout || !window.Sortable) return;
      groupGrid._sortable = new window.Sortable(groupGrid, {
        group: { name: "plates", pull: true, put: true },
        animation: 180,
        handle: ".plate-tool--drag",
        draggable: ".plate",
        ghostClass: "is-drag-ghost",
        chosenClass: "is-dragging",
        emptyInsertThreshold: 96,
        fallbackTolerance: 4,
        scroll: false,
        onStart: startDragScroll,
        onMove: (event) => {
          highlightDropGroup(event.to);
          return true;
        },
        onEnd: () => {
          stopDragScroll();
          grid.querySelectorAll(".group.is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
          syncOrderFromDom();
        }
      });
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Detail view + essay                                                     */
  /* ---------------------------------------------------------------------- */
  const setDetailEditing = () => {
    if (!detail) return;
    detail.querySelectorAll("[data-detail-field]").forEach((element) => setEditable(element));
  };

  const preloadNeighbour = (id) => {
    const photo = photoById(id);
    if (!photo) return;
    const image = new Image();
    image.src = imageUrl(photo.file);
  };

  const showDetailPhoto = (photo) => {
    if (!detailImage || !detailFrame) return;
    const token = ++detailToken;
    const incoming = detailLayer === detailImage && detailImageAlt ? detailImageAlt : detailImage;
    const previous = detailLayer;

    incoming.classList.remove("is-active");
    incoming.alt = photo.alt;
    incoming.width = photo.width;
    incoming.height = photo.height;
    detailFrame.classList.remove("is-missing");
    detailFrame.classList.remove("is-fallback");

    const reveal = () => {
      if (token !== detailToken) return;
      if (!incoming.naturalWidth) {
        detailFrame.classList.add("is-missing");
        return;
      }
      incoming.classList.add("is-active");
      if (previous && previous !== incoming) previous.classList.remove("is-active");
      detailLayer = incoming;
    };

    incoming.onload = reveal;
    incoming.onerror = () => {
      applyImageFallback(incoming);
      if (token === detailToken) {
        detailFrame.classList.add("is-fallback");
        detailFrame.classList.remove("is-missing");
        incoming.classList.add("is-active");
      }
    };
    incoming.removeAttribute("src");
    delete incoming.dataset.fallback;
    incoming.src = imageUrl(photo.file);
    if (incoming.complete && incoming.naturalWidth > 0) {
      window.requestAnimationFrame(reveal);
    }
  };

  const renderDetail = () => {
    const photo = currentPhoto();
    if (!photo || !detail) return;

    const index = photoIndex(photo.id);
    const group = groupById(photo.group);

    detail.dataset.photoId = photo.id;
    detailCounter.textContent = pad(index + 1) + " / " + pad(state.data.photos.length);
    detailGroup.textContent = group ? group.label : "";
    detailKicker.textContent = "Plate " + pad(index + 1) + (group ? " — " + (group.label_en || group.label) : "");
    detailTitle.textContent = photo.title;
    detailNote.textContent = photo.note;

    detailFrame.dataset.file = photo.file;
    showDetailPhoto(photo);

    detailEssay.innerHTML = essayHtml(photo.essay);

    setDetailEditing();
    preloadNeighbour((state.data.photos[(index + 1) % state.data.photos.length] || {}).id);
    preloadNeighbour((state.data.photos[(index - 1 + state.data.photos.length) % state.data.photos.length] || {}).id);
  };

  const openDetail = (id) => {
    if (!photoById(id) || !detail) return;
    state.currentId = id;
    state.lastFocus = document.activeElement;
    state.detailOpen = true;
    renderDetail();
    detail.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    window.setTimeout(() => detailClose && detailClose.focus({ preventScroll: true }), 60);
  };

  const closeDetail = () => {
    if (!detail) return;
    state.detailOpen = false;
    detail.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus({ preventScroll: true });
    }
  };

  const stepDetail = (direction) => {
    if (!state.data || !state.data.photos.length) return;
    const index = photoIndex(state.currentId);
    const next = (index + direction + state.data.photos.length) % state.data.photos.length;
    state.currentId = state.data.photos[next].id;
    renderDetail();
  };

  /* ---------------------------------------------------------------------- */
  /* Editing                                                                 */
  /* ---------------------------------------------------------------------- */
  const applyFieldEdit = (fieldEl, finalize) => {
    if (!fieldEl || !state.admin || !state.data) return;

    const detailField = fieldEl.dataset.detailField;
    if (detailField) {
      const photo = currentPhoto();
      if (!photo) return;
      photo[detailField] = fieldEl.textContent.trim();
      if (detailField === "title" && finalize && !photo.title) {
        photo.title = "Untitled";
        fieldEl.textContent = "Untitled";
      }
      if (detailField === "note") photo.alt = photo.note || photo.title;
      updateGalleryCaption(photo);
      markDirty();
      return;
    }

    const field = fieldEl.dataset.field;
    const figure = fieldEl.closest(".plate");
    const photo = figure ? photoById(figure.dataset.id) : null;
    if (!photo || !field) return;

    photo[field] = fieldEl.textContent.trim();
    if (field === "title" && finalize && !photo.title) {
      photo.title = "Untitled";
      fieldEl.textContent = "Untitled";
    }
    if (field === "note") photo.alt = photo.note || photo.title;

    const open = figure.querySelector(".plate-open");
    if (open) open.setAttribute("aria-label", "View " + photo.title + ", plate " + pad(photoIndex(photo.id) + 1));
    markDirty();
  };

  const handleFieldFocusOut = (event) => {
    const fieldEl = event.target.closest("[data-field], [data-detail-field]");
    if (fieldEl) applyFieldEdit(fieldEl, true);
    if (editBaseline) {
      if (JSON.stringify(state.data) !== editBaseline) {
        history.past.push({ label: "文字编辑", data: JSON.parse(editBaseline) });
        if (history.past.length > HISTORY_LIMIT) history.past.shift();
        history.future.length = 0;
      }
      editBaseline = null;
    }
  };

  const handleFieldFocusIn = (event) => {
    if (!state.admin || !state.data) return;
    const fieldEl = event.target.closest("[data-field], [data-detail-field]");
    if (fieldEl) editBaseline = JSON.stringify(state.data);
  };

  const handleFieldInput = (event) => {
    if (!state.admin) return;
    const fieldEl = event.target.closest("[data-field], [data-detail-field]");
    if (fieldEl) applyFieldEdit(fieldEl, false);
  };

  const bindInlineEditing = (root) => {
    if (!root) return;
    root.addEventListener("focusin", handleFieldFocusIn);
    root.addEventListener("focusout", handleFieldFocusOut);
    root.addEventListener("input", handleFieldInput);
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !state.admin) return;
      const fieldEl = event.target.closest("[data-field]");
      if (!fieldEl) return;
      event.preventDefault();
      fieldEl.blur();
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Scroll reveal + reading progress                                        */
  /* ---------------------------------------------------------------------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observeReveals = () => {
    const reveals = grid.querySelectorAll(".reveal");
    if (state.admin || reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
      );
    }
    reveals.forEach((element) => {
      if (!element.classList.contains("is-visible")) revealObserver.observe(element);
    });
  };

  const bar = document.getElementById("scrollBar");
  let ticking = false;

  const paintProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (bar) bar.style.transform = "scaleX(" + progress + ")";
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paintProgress);
    },
    { passive: true }
  );
  paintProgress();

  /* ---------------------------------------------------------------------- */
  /* Admin mode + data actions                                               */
  /* ---------------------------------------------------------------------- */
  const setAdmin = (on) => {
    state.admin = !!on;
    document.body.classList.toggle("is-editing", state.admin);
    if (adminToggle) {
      adminToggle.setAttribute("aria-pressed", String(state.admin));
      const label = adminToggle.querySelector(".admin-toggle-label");
      const icon = adminToggle.querySelector(".admin-toggle-icon");
      if (label) label.textContent = state.admin ? "编辑模式已开启" : "管理员模式";
      if (icon) icon.textContent = state.admin ? "✎" : "🔒";
    }
    if (editorBar) editorBar.hidden = !state.admin;
    if (!state.admin && state.detailOpen) closeDetail();
    if (!state.admin) closeGroups();
    if (!state.admin && state.freeLayout) setFreeLayout(false);
    if (state.data) renderGallery();
    updateEditorStatus();
    if (state.admin) {
      showToast("管理员模式已开启：点击文字修改，拖动 ⠿ 调整分组", 4200);
      let helpSeen = false;
      try {
        helpSeen = window.localStorage.getItem(HELP_SEEN_KEY) === "1";
      } catch (error) {
        helpSeen = false;
      }
      if (!helpSeen) {
        window.setTimeout(() => {
          if (state.admin && helpModal && helpModal.hidden) openHelp();
        }, 420);
      }
    }
  };

  /* Group management ------------------------------------------------------ */
  const nextGroupId = () =>
    "group-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);

  const groupPhotoCount = (id) =>
    state.data ? state.data.photos.filter((photo) => photo.group === id).length : 0;

  const fillGroupOptions = (selectedId) => {
    if (!addPhotoGroup || !state.data) return;
    addPhotoGroup.innerHTML = "";
    state.data.groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.label + (group.label_en ? " · " + group.label_en : "");
      addPhotoGroup.append(option);
    });
    if (selectedId) addPhotoGroup.value = selectedId;
  };

  const createGroup = (name) => {
    if (!state.data) return null;
    const label = String(name || "").trim() || "新分组 " + pad(state.data.groups.length + 1);
    pushHistory("新增分组");
    const group = { id: nextGroupId(), label, label_en: "", description: "" };
    state.data.groups.push(group);
    renderGroupManager();
    renderGallery();
    markDirty();
    showToast("已新增分组「" + label + "」", 3000);
    return group;
  };

  const moveGroup = (id, delta) => {
    if (!state.data) return;
    const groups = state.data.groups;
    const index = groups.findIndex((group) => group.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= groups.length) return;
    pushHistory("调整分组顺序");
    const [moved] = groups.splice(index, 1);
    groups.splice(target, 0, moved);
    renderGroupManager();
    renderGallery();
    markDirty();
  };

  const deleteGroup = (id) => {
    if (!state.data) return;
    if (state.data.groups.length <= 1) {
      showToast("至少需要保留一个分组");
      return;
    }
    const group = groupById(id);
    if (!group) return;
    const fallback = state.data.groups.find((item) => item.id !== id);
    const count = groupPhotoCount(id);
    const confirmed = window.confirm(
      "删除分组「" + group.label + "」？" +
        (count ? "\n\n其中 " + count + " 张照片会移动到「" + fallback.label + "」。" : "")
    );
    if (!confirmed) return;
    pushHistory("删除分组");
    state.data.groups = state.data.groups.filter((item) => item.id !== id);
    state.data.photos.forEach((photo) => {
      if (photo.group === id) {
        photo.group = fallback.id;
        delete photo.layout;
      }
    });
    if (state.data.layout_mode) assignLayoutsForGroup(fallback.id);
    renderGroupManager();
    renderGallery();
    markDirty();
    showToast("已删除分组「" + group.label + "」", 3200);
  };

  const applyGroupField = (id, field, value) => {
    const group = groupById(id);
    if (!group) return;
    const next = String(value || "").trim();
    if (field === "label" && !next) {
      showToast("分组名称不能为空");
      renderGroupManager();
      return;
    }
    if (next === String(group[field] || "")) return;
    pushHistory("修改分组");
    group[field] = next;
    renderGroupManager();
    renderGallery();
    markDirty();
  };

  const syncGroupOrderFromDom = () => {
    if (!state.data || !groupList) return;
    const ids = Array.from(groupList.querySelectorAll(".group-row")).map((row) => row.dataset.group);
    const lookup = new Map(state.data.groups.map((group) => [group.id, group]));
    const ordered = ids.map((id) => lookup.get(id)).filter(Boolean);
    if (ordered.length !== state.data.groups.length) return;
    pushHistory("调整分组顺序");
    state.data.groups = ordered;
    renderGallery();
    markDirty();
    const rows = Array.from(groupList.querySelectorAll(".group-row"));
    rows.forEach((row, index) => {
      const badge = row.querySelector(".group-badge");
      if (badge) badge.textContent = "Chapter " + pad(index + 1);
      const actions = row.querySelectorAll(".group-action");
      if (actions[0]) actions[0].disabled = index === 0;
      if (actions[1]) actions[1].disabled = index === rows.length - 1;
    });
  };

  const openGroups = () => {
    if (!state.data) return;
    renderGroupManager();
    if (groupsModal) groupsModal.hidden = false;
  };

  const closeGroups = () => {
    if (groupsModal) groupsModal.hidden = true;
  };

  const renderGroupManager = () => {
    if (!groupList || !state.data) return;
    groupList.innerHTML = "";

    state.data.groups.forEach((group, index) => {
      const row = document.createElement("div");
      row.className = "group-row";
      row.dataset.group = group.id;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "group-handle";
      handle.textContent = "⠿";
      handle.title = "拖动调整章节顺序";
      handle.setAttribute("aria-label", "拖动调整章节顺序");

      const badge = document.createElement("span");
      badge.className = "group-badge";
      badge.textContent = "Chapter " + pad(index + 1);

      const fields = document.createElement("div");
      fields.className = "group-fields";

      const label = document.createElement("input");
      label.type = "text";
      label.className = "field-input group-input";
      label.value = group.label;
      label.placeholder = "分组名称";
      label.setAttribute("aria-label", "分组名称");
      label.addEventListener("change", () => applyGroupField(group.id, "label", label.value));

      const labelEn = document.createElement("input");
      labelEn.type = "text";
      labelEn.className = "field-input group-input group-input--en";
      labelEn.value = group.label_en || "";
      labelEn.placeholder = "英文名（可选）";
      labelEn.setAttribute("aria-label", "分组英文名");
      labelEn.addEventListener("change", () => applyGroupField(group.id, "label_en", labelEn.value));

      const desc = document.createElement("input");
      desc.type = "text";
      desc.className = "field-input group-input group-input--desc";
      desc.value = group.description || "";
      desc.placeholder = "描述（可选）";
      desc.setAttribute("aria-label", "分组描述");
      desc.addEventListener("change", () => applyGroupField(group.id, "description", desc.value));

      fields.append(label, labelEn, desc);

      const meta = document.createElement("span");
      meta.className = "group-photos";
      meta.textContent = groupPhotoCount(group.id) + " 张";

      const actions = document.createElement("div");
      actions.className = "group-actions";

      const up = document.createElement("button");
      up.type = "button";
      up.className = "group-action";
      up.textContent = "↑";
      up.title = "上移";
      up.setAttribute("aria-label", "上移分组");
      up.disabled = index === 0;
      up.addEventListener("click", () => moveGroup(group.id, -1));

      const down = document.createElement("button");
      down.type = "button";
      down.className = "group-action";
      down.textContent = "↓";
      down.title = "下移";
      down.setAttribute("aria-label", "下移分组");
      down.disabled = index === state.data.groups.length - 1;
      down.addEventListener("click", () => moveGroup(group.id, 1));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "group-action group-action--delete";
      remove.textContent = "×";
      remove.title = "删除分组";
      remove.setAttribute("aria-label", "删除分组");
      remove.addEventListener("click", () => deleteGroup(group.id));

      actions.append(up, down, remove);
      row.append(handle, badge, fields, meta, actions);
      groupList.append(row);
    });

    if (groupList._sortable) {
      groupList._sortable.destroy();
      groupList._sortable = null;
    }
    if (window.Sortable) {
      groupList._sortable = new window.Sortable(groupList, {
        animation: 160,
        handle: ".group-handle",
        draggable: ".group-row",
        ghostClass: "group-row--ghost",
        onEnd: syncGroupOrderFromDom
      });
    }
  };

  const closeAddPhoto = () => {
    if (addPhotoModal) addPhotoModal.hidden = true;
  };

  const photoTitleFromFile = (file) =>
    String(file || "")
      .replace(/\.(webp|jpe?g|png|avif)$/i, "")
      .replace(/-\d{3,4}$/, "")
      .replace(/^\d+[-_]/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase()) || "Untitled";

  const pickerSelected = new Set();
  let pickerImages = [];
  let pendingUploads = [];

  const resetUploads = () => {
    pendingUploads = [];
    if (photoFileInput) photoFileInput.value = "";
    renderUploadPreview();
  };

  const renderUploadPreview = () => {
    if (!uploadPreview) return;
    uploadPreview.innerHTML = "";
    uploadPreview.hidden = pendingUploads.length === 0;
    pendingUploads.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "upload-item";

      const thumb = document.createElement("img");
      thumb.src = item.dataUrl;
      thumb.alt = item.name;
      thumb.loading = "lazy";

      const name = document.createElement("span");
      name.className = "upload-name";
      name.textContent = item.name + " · " + Math.max(1, Math.round(item.bytes / 1024)) + " KB";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "upload-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "移除 " + item.name);
      remove.addEventListener("click", () => {
        pendingUploads.splice(index, 1);
        renderUploadPreview();
        updatePickerStatus();
      });

      card.append(thumb, name, remove);
      uploadPreview.append(card);
    });
    updatePickerStatus();
  };

  const readUploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!window.ImageTools) {
      showToast("图片压缩模块未加载，请刷新页面后重试");
      return;
    }
    if (pickerStatus) pickerStatus.textContent = "正在压缩 " + files.length + " 张图片…";
    let failed = 0;
    for (const file of files) {
      try {
        const result = await window.ImageTools.compress(file);
        pendingUploads.push({
          name: result.name,
          title: window.ImageTools.titleFromName(result.name),
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
          orientation: result.orientation,
          bytes: result.bytes
        });
      } catch (error) {
        failed += 1;
        showToast("「" + (file.name || "图片") + "」导入失败：" + error.message, 5200);
      }
    }
    renderUploadPreview();
    updatePickerStatus();
    if (!failed && pendingUploads.length) {
      showToast("已压缩 " + files.length + " 张图片，点「导入所选」写入作品集", 4200);
    }
  };

  const updatePickerStatus = () => {
    if (pickerStatus) {
      pickerStatus.textContent =
        "内置 " + pickerImages.length + " 张 · 已选 " + pickerSelected.size + " 张" +
        (pendingUploads.length ? " · 待上传 " + pendingUploads.length + " 张" : "");
    }
    if (addPhotoSubmit) {
      addPhotoSubmit.disabled = pickerSelected.size === 0 && pendingUploads.length === 0;
    }
  };

  const renderPicker = () => {
    if (!photoPicker || !state.data) return;
    photoPicker.innerHTML = "";
    const used = new Set(state.data.photos.map((photo) => photo.file));

    if (!pickerImages.length) {
      const empty = document.createElement("p");
      empty.className = "picker-empty";
      empty.textContent = "内置示例图片为空，可直接从本机上传";
      photoPicker.append(empty);
      updatePickerStatus();
      return;
    }

    pickerImages.forEach((image) => {
      const isUsed = used.has(image.file);
      const item = document.createElement("label");
      item.className = "picker-item" + (isUsed ? " is-used" : "");

      const box = document.createElement("input");
      box.type = "checkbox";
      box.value = image.file;
      box.disabled = isUsed;

      const thumb = document.createElement("img");
      thumb.src = IMAGE_BASE + image.thumb;
      thumb.alt = image.file;
      thumb.loading = "lazy";

      const name = document.createElement("span");
      name.className = "picker-name";
      name.textContent = image.file.replace(/-2000\.[a-z0-9]+$/i, "");
      name.title = image.file;

      box.addEventListener("change", () => {
        if (box.checked) pickerSelected.add(image.file);
        else pickerSelected.delete(image.file);
        item.classList.toggle("is-selected", box.checked);
        updatePickerStatus();
      });

      item.append(box, thumb, name);
      photoPicker.append(item);
    });

    updatePickerStatus();
  };

  const loadPicker = async () => {
    if (!photoPicker || !state.data) return;
    photoPicker.innerHTML = '<p class="picker-empty">正在读取内置示例图片…</p>';
    pickerSelected.clear();
    try {
      const response = await fetch(IMAGE_MANIFEST, { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      pickerImages = Array.isArray(payload.images) ? payload.images : [];
      renderPicker();
    } catch (error) {
      pickerImages = [];
      photoPicker.innerHTML =
        '<p class="picker-empty">内置示例图片未找到；可直接从本机上传照片。</p>';
      updatePickerStatus();
    }
  };

  const openAddPhoto = () => {
    if (!state.data) return;
    fillGroupOptions();
    if (addPhotoModal) addPhotoModal.hidden = false;
    resetUploads();
    loadPicker();
  };

  const addPhotosFromPicker = async (event) => {
    event.preventDefault();
    if (!state.data || !addPhotoForm) return;
    const files = Array.from(pickerSelected);
    if (!files.length && !pendingUploads.length) {
      showToast("请先选择或上传要添加的照片");
      return;
    }

    const groupId = addPhotoGroup && addPhotoGroup.value ? addPhotoGroup.value : state.data.groups[0].id;
    const original = addPhotoSubmit ? addPhotoSubmit.textContent : "";
    if (addPhotoSubmit) {
      addPhotoSubmit.disabled = true;
      addPhotoSubmit.textContent = "导入中…";
    }

    pushHistory("导入照片");
    let imported = 0;

    files.forEach((file, offset) => {
      const meta = pickerImages.find((item) => item.file === file) || {};
      const title = photoTitleFromFile(file);
      state.data.photos.push({
        id: "plate-" + Date.now().toString(36) + "-" + offset,
        file,
        book_file: bookFileFor(file),
        group: groupId,
        title,
        note: "",
        essay: "",
        alt: title,
        width: Number(meta.width) || 1000,
        height: Number(meta.height) || 667,
        orientation: meta.orientation || "landscape"
      });
      imported += 1;
    });

    pendingUploads.forEach((upload, offset) => {
      state.data.photos.push({
        id: "plate-" + Date.now().toString(36) + "-u" + offset,
        file: upload.dataUrl,
        book_file: "",
        group: groupId,
        title: upload.title,
        note: "",
        essay: "",
        alt: upload.title,
        width: upload.width,
        height: upload.height,
        orientation: upload.orientation
      });
      imported += 1;
    });

    if (state.data.layout_mode) {
      assignLayoutsForGroup(groupId);
    }

    const group = groupById(groupId);
    pickerSelected.clear();
    resetUploads();
    closeAddPhoto();
    renderGallery();
    state.dirty = true;
    state.saved = false;
    updateEditorStatus();
    await persistDraft();
    if (addPhotoSubmit) {
      addPhotoSubmit.textContent = original;
      updatePickerStatus();
    }
    showToast(
      "已导入 " + imported + " 张照片" + (group ? "到「" + group.label + "」" : "") + " · 已存入本机数据库",
      4600
    );
  };

  /* Rich-text essay ------------------------------------------------------- */
  let essayQuill = null;

  const ensureEssayQuill = () => {
    if (essayQuill) return essayQuill;
    if (!window.Quill || !essayEditorEl) return null;
    essayQuill = new window.Quill(essayEditorEl, {
      theme: "snow",
      placeholder: "写一段完整的文字…",
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          [{ header: [2, 3, false] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link"],
          ["clean"]
        ]
      }
    });
    return essayQuill;
  };

  const openEssayEditor = () => {
    const photo = currentPhoto();
    if (!photo) {
      showToast("请先打开一张照片");
      return;
    }
    const quill = ensureEssayQuill();
    if (!quill) {
      showToast("富文本编辑器未加载，请刷新页面");
      return;
    }
    quill.root.innerHTML = essayHtml(photo.essay);
    if (essayModal) essayModal.hidden = false;
    window.setTimeout(() => quill.focus(), 80);
  };

  const closeEssayEditor = () => {
    if (essayModal) essayModal.hidden = true;
  };

  const applyEssayEdit = () => {
    const photo = currentPhoto();
    const quill = ensureEssayQuill();
    if (!photo || !quill) return;
    const next = essayIsEmpty(quill.root.innerHTML) ? "" : sanitizeHtml(quill.root.innerHTML);
    if (next !== photo.essay) {
      pushHistory("长文编辑");
      photo.essay = next;
      markDirty();
    }
    closeEssayEditor();
    if (state.detailOpen) renderDetail();
    showToast("长文已更新", 2400);
  };

  const removePhoto = (id) => {
    const photo = photoById(id);
    if (!photo) return;
    const confirmed = window.confirm(
      "移除「" + photo.title + "」？\n\n只会从本机作品集数据中移除，不影响其它设备。"
    );
    if (!confirmed) return;

    pushHistory("移除照片");
    if (state.detailOpen && state.currentId === id) closeDetail();
    state.data.photos = state.data.photos.filter((item) => item.id !== id);
    renderGallery();
    markDirty();
    showToast("已移除「" + photo.title + "」");
  };

  const exportBackup = () => {
    if (!state.data) return;

    const payload = buildPayload();
    const text = JSON.stringify(payload, null, 2) + "\n";
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
    link.href = url;
    link.download = "portfolio-backup-" + stamp + ".json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);

    state.data.meta = state.data.meta || {};
    state.data.meta.updated = payload.meta.updated;
    state.data.meta.revision = payload.meta.revision;
    state.baseUpdated = payload.meta.updated;
    updateEditorStatus();
    persistDraft();
    showToast("备份已导出 · 请把 JSON 文件保存到其它位置", 5200);
  };

  const importBackup = async (file) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      showToast("备份文件超过 200 MB，浏览器无法载入", 6000);
      return;
    }
    const confirmed = window.confirm(
      "导入会【覆盖】当前设备上的全部作品集数据（含照片）。\n\n建议先点「导出备份」保存当前数据。继续吗？"
    );
    if (!confirmed) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.photos) || !Array.isArray(parsed.groups)) {
        throw new Error("这不是有效的作品集备份文件");
      }
      pushHistory("导入备份");
      state.data = normaliseData(parsed);
      if (state.data.layout_mode) {
        state.data.groups.forEach((group) => assignLayoutsForGroup(group.id));
      }
      state.data.meta = state.data.meta || {};
      state.data.meta.updated = new Date().toISOString().slice(0, 10);
      state.baseUpdated = String(state.data.meta.updated || "");
      if (state.detailOpen) closeDetail();
      buildThemePresets();
      applyTheme(state.data.theme);
      renderGallery();
      renderGroupManager();
      state.dirty = true;
      state.saved = false;
      updateEditorStatus();
      const ok = await persistDraft();
      showToast(
        ok
          ? "备份已导入 · 共 " + state.data.photos.length + " 张照片"
          : "备份已载入，但写入本机数据库失败",
        5600
      );
    } catch (error) {
      showToast("导入失败：" + (error && error.message ? error.message : "文件无法解析"), 6200);
    }
  };

  const discardDraft = () => {
    const confirmed = window.confirm(
      "重新载入会丢弃未保存的修改，并从本机浏览器数据库读取已保存内容。\n\n数据库内容不会被删除。继续吗？"
    );
    if (!confirmed) return;
    window.location.reload();
  };

  /* ---------------------------------------------------------------------- */
  /* Events                                                                  */
  /* ---------------------------------------------------------------------- */
  const bindEvents = () => {
    if (adminToggle) adminToggle.addEventListener("click", () => setAdmin(!state.admin));
    if (addPhotoBtn) addPhotoBtn.addEventListener("click", openAddPhoto);
    if (groupsBtn) groupsBtn.addEventListener("click", openGroups);
    if (layoutBtn) layoutBtn.addEventListener("click", () => setFreeLayout(!state.freeLayout));
    if (resetLayoutBtn) resetLayoutBtn.addEventListener("click", clearFreeLayout);
    if (boardBtn) boardBtn.addEventListener("click", openBoard);
    const boardClose = document.getElementById("boardClose");
    const boardDone = document.getElementById("boardDone");
    if (boardClose) boardClose.addEventListener("click", closeBoard);
    if (boardDone) boardDone.addEventListener("click", closeBoard);
    if (boardModal) {
      boardModal.addEventListener("click", (event) => {
        if (event.target === boardModal) closeBoard();
      });
    }
    if (rotateRange) {
      rotateRange.addEventListener("input", () => {
        const photo = currentSelectedPhoto();
        if (!photo) return;
        const t = photo.transform || { r: 0, s: 1 };
        setPhotoTransform(photo, Number(rotateRange.value), Number(t.s) || 1);
      });
    }
    if (scaleRange) {
      scaleRange.addEventListener("input", () => {
        const photo = currentSelectedPhoto();
        if (!photo) return;
        const t = photo.transform || { r: 0, s: 1 };
        setPhotoTransform(photo, Number(t.r) || 0, Number(scaleRange.value) / 100);
      });
    }
    if (resetTransformBtn) {
      resetTransformBtn.addEventListener("click", () => {
        const photo = currentSelectedPhoto();
        if (photo) setPhotoTransform(photo, 0, 1);
      });
    }
    if (themeBtn) themeBtn.addEventListener("click", openThemeModal);
    if (helpBtn) helpBtn.addEventListener("click", openHelp);
    if (saveBtn) saveBtn.addEventListener("click", saveToStorage);
    if (exportBackupBtn) exportBackupBtn.addEventListener("click", exportBackup);
    if (importBackupBtn) {
      importBackupBtn.addEventListener("click", () => {
        if (importFile) importFile.click();
      });
    }
    if (importFile) {
      importFile.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        await importBackup(file);
      });
    }
    if (photoFileInput) {
      photoFileInput.addEventListener("change", (event) => {
        readUploadFiles(event.target.files);
      });
    }
    if (discardBtn) discardBtn.addEventListener("click", discardDraft);
    window.addEventListener("wheel", handleDragWheel, { passive: false });
    window.addEventListener("keydown", handleDragKey);
    window.addEventListener("pointerup", stopDragScroll);
    window.addEventListener("pointercancel", stopDragScroll);

    if (grid) {
      grid.addEventListener("click", (event) => {
        const open = event.target.closest(".plate-open");
        if (open) {
          event.preventDefault();
          openDetail(open.dataset.id);
          return;
        }
        const remove = event.target.closest(".plate-tool--delete");
        if (remove) {
          event.preventDefault();
          removePhoto(remove.dataset.id);
        }
      });
    }

    bindInlineEditing(grid);
    bindInlineEditing(detail);

    if (detailClose) detailClose.addEventListener("click", closeDetail);
    if (detailPrev) detailPrev.addEventListener("click", () => stepDetail(-1));
    if (detailNext) detailNext.addEventListener("click", () => stepDetail(1));
    if (detail) {
      detail.addEventListener("click", (event) => {
        if (event.target === detail) closeDetail();
      });
    }

    if (addPhotoForm) addPhotoForm.addEventListener("submit", addPhotosFromPicker);
    if (pickerRefresh) pickerRefresh.addEventListener("click", loadPicker);
    if (editEssayBtn) editEssayBtn.addEventListener("click", openEssayEditor);
    if (essayDoneBtn) essayDoneBtn.addEventListener("click", applyEssayEdit);
    if (essayCancelBtn) essayCancelBtn.addEventListener("click", closeEssayEditor);
    if (essayCloseBtn) essayCloseBtn.addEventListener("click", closeEssayEditor);
    if (essayModal) {
      essayModal.addEventListener("click", (event) => {
        if (event.target === essayModal) closeEssayEditor();
      });
    }
    const addPhotoClose = document.getElementById("addPhotoClose");
    const addPhotoCancel = document.getElementById("addPhotoCancel");
    if (addPhotoClose) addPhotoClose.addEventListener("click", closeAddPhoto);
    if (addPhotoCancel) addPhotoCancel.addEventListener("click", closeAddPhoto);
    if (addPhotoModal) {
      addPhotoModal.addEventListener("click", (event) => {
        if (event.target === addPhotoModal) closeAddPhoto();
      });
    }

    if (addPhotoNewGroup) {
      addPhotoNewGroup.addEventListener("click", () => {
        if (!state.data) return;
        const suggestion = "新分组 " + pad(state.data.groups.length + 1);
        const name = window.prompt("新分组名称（可稍后在「分组管理」里修改）", suggestion);
        if (name === null) return;
        const group = createGroup(name);
        if (group) fillGroupOptions(group.id);
      });
    }

    const groupsClose = document.getElementById("groupsClose");
    const groupsDone = document.getElementById("groupsDone");
    if (groupsClose) groupsClose.addEventListener("click", closeGroups);
    if (groupsDone) groupsDone.addEventListener("click", closeGroups);
    if (groupsModal) {
      groupsModal.addEventListener("click", (event) => {
        if (event.target === groupsModal) closeGroups();
      });
    }
    if (addGroupBtn) {
      addGroupBtn.addEventListener("click", () => {
        if (!state.data) return;
        const suggestion = "新分组 " + pad(state.data.groups.length + 1);
        const name = window.prompt("新分组名称", suggestion);
        if (name === null) return;
        createGroup(name);
      });
    }

    const helpClose = document.getElementById("helpClose");
    const helpDone = document.getElementById("helpDone");
    if (helpClose) helpClose.addEventListener("click", closeHelp);
    if (helpDone) helpDone.addEventListener("click", closeHelp);
    if (helpModal) {
      helpModal.addEventListener("click", (event) => {
        if (event.target === helpModal) closeHelp();
      });
    }

    const themeClose = document.getElementById("themeClose");
    const themeDone = document.getElementById("themeDone");
    const themeReset = document.getElementById("themeReset");
    if (themeClose) themeClose.addEventListener("click", closeThemeModal);
    if (themeDone) themeDone.addEventListener("click", closeThemeModal);
    if (themeReset) themeReset.addEventListener("click", resetTheme);
    if (accentColor) accentColor.addEventListener("input", applyCustomTheme);
    if (bgColor) bgColor.addEventListener("input", applyCustomTheme);
    if (themeModal) {
      themeModal.addEventListener("click", (event) => {
        if (event.target === themeModal) closeThemeModal();
      });
    }

    document.addEventListener("keydown", (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      const shortcut = String(event.key || "").toLowerCase();
      if (modifier && (shortcut === "z" || shortcut === "y") && state.admin) {
        const target = event.target;
        const typing = target && (
          target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          (target.closest && target.closest(".ql-editor"))
        );
        if (!typing) {
          event.preventDefault();
          if (shortcut === "y" || event.shiftKey) redo();
          else undo();
          return;
        }
      }

      if (event.key === "Escape") {
        if (addPhotoModal && !addPhotoModal.hidden) {
          closeAddPhoto();
          return;
        }
        if (essayModal && !essayModal.hidden) {
          closeEssayEditor();
          return;
        }
        if (groupsModal && !groupsModal.hidden) {
          closeGroups();
          return;
        }
        if (boardModal && !boardModal.hidden) {
          closeBoard();
          return;
        }
        if (themeModal && !themeModal.hidden) {
          closeThemeModal();
          return;
        }
        if (helpModal && !helpModal.hidden) {
          closeHelp();
          return;
        }
        if (state.detailOpen) closeDetail();
        return;
      }

      if (!state.detailOpen) return;
      if (event.target && event.target.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepDetail(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepDetail(-1);
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    if (detail) {
      detail.addEventListener(
        "touchstart",
        (event) => {
          const touch = event.changedTouches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        },
        { passive: true }
      );
      detail.addEventListener(
        "touchend",
        (event) => {
          if (!state.detailOpen) return;
          const touch = event.changedTouches[0];
          const deltaX = touch.clientX - touchStartX;
          const deltaY = touch.clientY - touchStartY;
          if (Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY)) {
            stepDetail(deltaX < 0 ? 1 : -1);
          }
        },
        { passive: true }
      );
    }

    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
    window.addEventListener("pagehide", () => {
      if (state.dirty) persistDraft();
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                    */
  /* ---------------------------------------------------------------------- */
  const init = async () => {
    let raw = await loadStoredData();
    let seeded = false;

    if (!raw) {
      raw = await loadSeedData();
      seeded = !!raw;
    }
    if (!raw) raw = JSON.parse(JSON.stringify(EMPTY_DATA));

    state.data = normaliseData(raw);
    state.baseUpdated = String(state.data.meta.updated || "");

    buildThemePresets();
    applyTheme(state.data.theme);
    renderGallery();
    updateEditorStatus();

    if (seeded) {
      const saved = await persistDraft();
      if (saved) showToast("已载入默认作品集，并写入本机浏览器数据库", 4600);
    } else if (!storeSupported) {
      showToast("当前浏览器不支持 IndexedDB，修改无法保存", 6200);
    }

    if (!state.data.photos.length) {
      showToast("作品集目前是空的：开启管理员模式后点「＋ 添加新照片」", 5200);
    }
  };

  bindEvents();
  init();
})();
