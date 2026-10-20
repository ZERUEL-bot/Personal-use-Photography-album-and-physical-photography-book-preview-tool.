/* A Glimpse of Trees — print proof interactions */
(() => {
  "use strict";

  const SEED_URL = "../data/default-portfolio.json";
  const IMAGE_BASE = "../assets/images/";

  const bookElement = document.getElementById("book");
  const loader = document.getElementById("loader");
  const loaderText = loader ? loader.querySelector(".loader-text") : null;
  const pagerCurrent = document.getElementById("pagerCurrent");
  const pagerTotal = document.getElementById("pagerTotal");
  const pageCountLabel = document.getElementById("bookPageCount");
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");

  let collection = null;
  let pageFlip = null;
  let portfolioRaw = null;
  let currentPageIndex = 0;
  let pageElements = [];

  const pad = (value) => String(value).padStart(2, "0");

  const PLACEHOLDER_IMAGE = IMAGE_BASE + "_placeholder.svg";

  const isInlineImage = (value) => /^(data:|blob:|https?:)/i.test(String(value || ""));

  const imageUrl = (file) => {
    const value = String(file || "");
    if (!value) return PLACEHOLDER_IMAGE;
    if (isInlineImage(value)) return value;
    return IMAGE_BASE + value.replace(/^\.?\/?assets\/images\//, "");
  };

  const applyImageFallback = (image) => {
    if (!image || image.dataset.fallback === "1") return;
    image.dataset.fallback = "1";
    image.src = PLACEHOLDER_IMAGE;
    const frame = image.closest(".photo-frame, .cover-plate, .plate-media, .detail-frame");
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

  /* Per-element text overrides and drag offsets, stored in book_settings.editor.
     The 3D proof always uses them; the print PDF uses them when pdf.sync is true. */
  const EDIT_KEY_PATTERN = /^[a-z0-9:_.-]{1,140}$/i;

  /* Presets are shared with print.js via js/ornaments.js. */
  const ORNAMENT_PRESETS =
    (window.GlimpseOrnaments && window.GlimpseOrnaments.presets) || {};
  const ORNAMENT_TYPES = new Set(Object.keys(ORNAMENT_PRESETS));


  const readEditorSettings = (raw) => {
    const result = { texts: {}, offsets: {}, placements: {}, transforms: {}, decorations: [] };
    if (!raw || typeof raw !== "object") return result;

    const texts = raw.texts && typeof raw.texts === "object" ? raw.texts : {};
    Object.keys(texts).slice(0, 400).forEach((key) => {
      if (!EDIT_KEY_PATTERN.test(key)) return;
      const entry = texts[key];
      const html = typeof entry === "string"
        ? entry
        : entry && typeof entry.html === "string" ? entry.html : "";
      result.texts[key] = { html: sanitizeHtml(html) };
    });

    const offsets = raw.offsets && typeof raw.offsets === "object" ? raw.offsets : {};
    Object.keys(offsets).slice(0, 400).forEach((key) => {
      if (!EDIT_KEY_PATTERN.test(key)) return;
      const entry = offsets[key];
      const x = Number(entry && entry.x);
      const y = Number(entry && entry.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      result.offsets[key] = {
        x: Math.max(-1.5, Math.min(1.5, x)),
        y: Math.max(-1.5, Math.min(1.5, y))
      };
    });

    const placements = raw.placements && typeof raw.placements === "object" ? raw.placements : {};
    Object.keys(placements).slice(0, 400).forEach((key) => {
      if (!EDIT_KEY_PATTERN.test(key)) return;
      const entry = placements[key];
      if (!entry || typeof entry !== "object") return;
      const page = String(entry.page == null ? "" : entry.page).trim();
      const x = Number(entry.x);
      const y = Number(entry.y);
      const w = Number(entry.w);
      if (!EDIT_KEY_PATTERN.test(page)) return;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      result.placements[key] = {
        page,
        x: Math.max(-0.5, Math.min(1.5, x)),
        y: Math.max(-0.5, Math.min(1.5, y)),
        w: Math.max(0.002, Math.min(1.5, Number.isFinite(w) && w > 0 ? w : 1))
      };
    });

    const transforms = raw.transforms && typeof raw.transforms === "object" ? raw.transforms : {};
    Object.keys(transforms).slice(0, 400).forEach((key) => {
      if (!EDIT_KEY_PATTERN.test(key)) return;
      const entry = transforms[key];
      if (!entry || typeof entry !== "object") return;
      const r = Number(entry.r);
      const s = Number(entry.s);
      if (!Number.isFinite(r) || !Number.isFinite(s)) return;
      result.transforms[key] = {
        r: Math.max(-180, Math.min(180, r)),
        s: Math.max(0.25, Math.min(3, s))
      };
    });

    const decorations = Array.isArray(raw.decorations) ? raw.decorations.slice(0, 60) : [];
    const seen = new Set();
    decorations.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = String(item.id == null ? "" : item.id).trim();
      const page = String(item.page == null ? "" : item.page).trim();
      const type = String(item.type == null ? "" : item.type).trim().toLowerCase();
      if (!/^[a-z0-9_-]{1,40}$/i.test(id) || seen.has(id)) return;
      if (!EDIT_KEY_PATTERN.test(page) || !ORNAMENT_TYPES.has(type)) return;
      seen.add(id);
      result.decorations.push({ id, page, type });
    });

    return result;
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

  const fail = (message) => {
    if (loaderText) loaderText.textContent = message;
  };

  /* ---------------------------------------------------------------------- */
  /* Book design settings                                                   */
  /* ---------------------------------------------------------------------- */

  const TEXTURE_URL = 'url("../assets/textures/paper-noise.png")';

  const TEXTURES = {
    none: { image: "none", size: "256px 256px", opacity: "0" },
    light: { image: TEXTURE_URL, size: "256px 256px", opacity: "0.9" },
    strong: { image: TEXTURE_URL + ", " + TEXTURE_URL, size: "230px 230px", opacity: "1" }
  };

  const FONT_STACKS = {
    heading: {
      playfair: '"Playfair Display", "Songti SC", "SimSun", serif',
      sans: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
      songti: '"Songti SC", "STSong", "SimSun", serif'
    },
    body: {
      inter: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
      kaiti: '"Kaiti SC", "KaiTi", "STKaiti", serif',
      songti: '"Songti SC", "STSong", "SimSun", serif'
    }
  };

  const DESIGN_DEFAULTS = {
    cover: {
      color: "#1d2a22",
      image: "",
      subtitle: "",
      author: "",
      kicker: "Photographs",
      photo: "",
      photo_custom: "",
      layout: "framed"
    },
    paper: { color: "#f5f2eb", texture: "light" },
    type: { heading: "playfair", body: "inter" },
    scene: { background: "wood" },
    pdf: { sync: false }
  };

  let bookSettings = null;

  const stringValue = (value, fallback = "") =>
    value == null ? fallback : String(value).trim();

  const pickOption = (value, options, fallback) => {
    const key = String(value == null ? "" : value).trim().toLowerCase();
    return options.includes(key) ? key : fallback;
  };

  const pickHex = (value, fallback) => {
    const hex = String(value == null ? "" : value).trim();
    return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : fallback;
  };

  const readBookSettings = (raw) => {
    const meta = raw && raw.meta && typeof raw.meta === "object" ? raw.meta : {};
    const saved = raw && raw.book_settings && typeof raw.book_settings === "object"
      ? raw.book_settings
      : {};
    const cover = saved.cover && typeof saved.cover === "object" ? saved.cover : {};
    const paper = saved.paper && typeof saved.paper === "object" ? saved.paper : {};
    const type = saved.type && typeof saved.type === "object" ? saved.type : {};
    const scene = saved.scene && typeof saved.scene === "object" ? saved.scene : {};
    const pdf = saved.pdf && typeof saved.pdf === "object" ? saved.pdf : {};
    const syncPdf = pdf.sync === true || pdf.sync === "true" || pdf.sync === 1 || pdf.sync === "1";

    return {
      cover: {
        title: stringValue(cover.title, "") || stringValue(meta.title, "A Glimpse of Trees"),
        subtitle: cover.subtitle == null ? stringValue(meta.subtitle, "") : stringValue(cover.subtitle),
        author: stringValue(cover.author, stringValue(meta.author, "")),
        kicker: cover.kicker == null ? DESIGN_DEFAULTS.cover.kicker : stringValue(cover.kicker),
        color: pickHex(cover.color, DESIGN_DEFAULTS.cover.color),
        image: stringValue(cover.image, ""),
        photo: stringValue(cover.photo, "") || stringValue(meta.cover_photo, ""),
        photo_custom: stringValue(cover.photo_custom, ""),
        layout: pickOption(cover.layout, ["framed", "full", "text"], DESIGN_DEFAULTS.cover.layout)
      },
      paper: {
        color: pickHex(paper.color, DESIGN_DEFAULTS.paper.color),
        texture: pickOption(paper.texture, Object.keys(TEXTURES), DESIGN_DEFAULTS.paper.texture)
      },
      type: {
        heading: pickOption(type.heading, Object.keys(FONT_STACKS.heading), DESIGN_DEFAULTS.type.heading),
        body: pickOption(type.body, Object.keys(FONT_STACKS.body), DESIGN_DEFAULTS.type.body)
      },
      scene: {
        background: pickOption(scene.background, ["wood", "black", "light"], DESIGN_DEFAULTS.scene.background)
      },
      pdf: {
        sync: syncPdf
      },
      editor: readEditorSettings(saved.editor)
    };
  };

  const titleMarkup = (rawTitle) => {
    const title = stringValue(rawTitle, "A Glimpse of Trees");
    const parts = title.split(" of ");
    return parts.length === 2
      ? escapeHtml(parts[0]) + "<br><em>of</em> " + escapeHtml(parts[1])
      : escapeHtml(title);
  };

  const backBlurbFor = (data) => {
    const afterword = data.book_afterword || {};
    const body = Array.isArray(afterword.body)
      ? afterword.body.join(" ")
      : String(afterword.body || "");
    const plain = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const source = plain || stringValue(data.meta && data.meta.intro_text, "");
    if (!source) return "";
    return source.length > 180 ? source.slice(0, 180).replace(/[，。；、\s]+$/, "") + "…" : source;
  };

  const coverPhotoFor = (settings, data = collection) => {
    const photos = data && Array.isArray(data.photos) ? data.photos : [];
    const wanted = settings && settings.cover ? settings.cover.photo : "";
    const fallbackId = data && data.meta ? data.meta.cover_photo : "";
    return (
      photos.find((photo) => photo.id === wanted) ||
      photos.find((photo) => photo.id === fallbackId) ||
      photos.find((photo) => photo.orientation === "portrait") ||
      photos[0] ||
      null
    );
  };

  const coverPhotoSource = (settings, data = collection) => {
    const raw = String(settings && settings.cover ? settings.cover.photo_custom : "").trim();
    if (/^data:image\//i.test(raw)) return raw;
    const custom = resolveLocalAsset(raw);
    if (custom) return custom;
    const photo = coverPhotoFor(settings, data);
    return photo ? imageUrl(photo.book_file || photo.file) : PLACEHOLDER_IMAGE;
  };

  const resolveLocalAsset = (value) => {
    let path = String(value == null ? "" : value).trim().replace(/\\/g, "/");
    if (!path || /^(https?:|data:|\/\/)/i.test(path)) return "";
    if (/^[a-z]:\//i.test(path)) return "";
    path = path.replace(/["'()\r\n]/g, "");
    path = path.replace(/^\.?\//, "");
    while (path.startsWith("../")) path = path.slice(3);
    if (!path) return "";
    return "/" + path;
  };

  const coverImageValue = (value) => {
    const raw = String(value == null ? "" : value).trim();
    if (/^data:image\//i.test(raw)) return 'url("' + raw + '")';
    const path = resolveLocalAsset(value);
    return path ? 'url("' + path + '")' : "none";
  };

  const updateCoverText = (settings) => {
    if (!bookElement) return;
    const cover = bookElement.querySelector(".cover");
    if (cover) {
      cover.classList.remove("cover--framed", "cover--full", "cover--text");
      cover.classList.add("cover--" + settings.cover.layout);

      const kicker = cover.querySelector(".cover-kicker");
      if (kicker) kicker.textContent = settings.cover.kicker;

      const source = coverPhotoSource(settings);
      const photo = coverPhotoFor(settings);
      const alt = settings.cover.photo_custom ? settings.cover.title : (photo ? photo.alt : settings.cover.title);
      cover.querySelectorAll(".cover-plate img, .cover-fullbleed img").forEach((image) => {
        const frame = image.closest(".cover-plate");
        const stale = image.getAttribute("src") !== source || image.dataset.fallback === "1" ||
          (frame && frame.classList.contains("is-fallback"));
        if (stale) {
          delete image.dataset.fallback;
          if (frame) frame.classList.remove("is-fallback");
          image.src = source;
        }
        image.alt = frame ? alt : "";
      });
    }

    const title = bookElement.querySelector(".cover-title");
    if (title) title.innerHTML = titleMarkup(settings.cover.title);

    const subtitle = bookElement.querySelector(".cover-subtitle");
    if (subtitle) subtitle.textContent = settings.cover.subtitle;

    const author = bookElement.querySelector(".cover-author");
    if (author) author.textContent = settings.cover.author;

    const backTitle = bookElement.querySelector(".back-title");
    if (backTitle) backTitle.textContent = settings.cover.title;

    const backAuthor = bookElement.querySelector(".back-author");
    if (backAuthor) backAuthor.textContent = settings.cover.author;

    [".cover-kicker", ".cover-title", ".cover-subtitle", ".cover-author", ".back-title", ".back-author"]
      .forEach((selector) => rememberBaseText(bookElement.querySelector(selector)));
  };

  const applyBookSettings = (settings) => {
    if (!settings) return;
    const root = document.documentElement;
    const texture = TEXTURES[settings.paper.texture] || TEXTURES.light;

    root.style.setProperty("--paper-bg", settings.paper.color);
    root.style.setProperty("--paper-texture", texture.image);
    root.style.setProperty("--paper-texture-size", texture.size);
    root.style.setProperty("--paper-texture-opacity", texture.opacity);
    root.style.setProperty("--font-heading", FONT_STACKS.heading[settings.type.heading]);
    root.style.setProperty("--font-body", FONT_STACKS.body[settings.type.body]);
    root.style.setProperty("--cover-bg", settings.cover.color);
    root.style.setProperty("--cover-image", coverImageValue(settings.cover.image));
    document.body.dataset.scene = settings.scene.background;

    updateCoverText(settings);
  };

  const refitText = () => {
    window.requestAnimationFrame(() => {
      fitTextBlocks();
      window.setTimeout(fitTextBlocks, 180);
    });
  };


  const bookFileFor = (file) =>
    String(file || "").replace(/-2000\.(webp|jpe?g|png|avif)$/i, "-1000.$1");

  const normaliseData = (raw) => {
    const data = raw && typeof raw === "object" ? raw : {};
    data.meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    data.groups = Array.isArray(data.groups) && data.groups.length
      ? data.groups
      : [{ id: "all", label: "全部作品", label_en: "All plates", description: "" }];
    data.photos = Array.isArray(data.photos) ? data.photos : [];
    data.book_afterword = data.book_afterword && typeof data.book_afterword === "object"
      ? data.book_afterword
      : { title: "", body: [], signature: "" };
    if (data.book_afterword.body == null) data.book_afterword.body = "";

    const groupIds = new Set(data.groups.map((group) => group.id));
    data.groups.forEach((group, index) => {
      if (!group.id) group.id = "group-" + (index + 1);
      if (!group.label) group.label = group.label_en || group.id;
      if (!group.label_en) group.label_en = "";
    });

    data.photos.forEach((photo, index) => {
      if (!photo.id) photo.id = "photo-" + (index + 1);
      photo.title = String(photo.title || "Untitled");
      photo.note = String(photo.note || "");
      photo.alt = String(photo.alt || photo.note || photo.title);
      photo.file = String(photo.file || photo.full || "");
      photo.book_file = String(
        photo.book_file ||
          photo.book ||
          (isInlineImage(photo.file) ? photo.file : bookFileFor(photo.file))
      );
      photo.essay = essayHtml(photo.essay);
      photo.width = Number(photo.width) || 1000;
      photo.height = Number(photo.height) || 667;
      if (!groupIds.has(photo.group)) photo.group = data.groups[0].id;
    });

    return data;
  };

  const readStoredData = async () => {
    try {
      if (!window.PortfolioStore) return null;
      const stored = await window.PortfolioStore.read();
      return stored && Array.isArray(stored.photos) ? stored : null;
    } catch (error) {
      return null;
    }
  };

  const readSeedData = async () => {
    try {
      const response = await fetch(SEED_URL, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && Array.isArray(payload.photos) ? payload : null;
    } catch (error) {
      return null;
    }
  };

  const fetchData = async () => (await readStoredData()) || (await readSeedData());

  const sideFor = (index) => (index % 2 === 0 ? "page--right" : "page--left");

  const buildPages = (data) => {
    const photos = data.photos;
    const meta = data.meta;
    const settings = bookSettings || readBookSettings(data);
    const pages = [];

    const rawTitle = settings.cover.title;
    const coverTitle = titleMarkup(rawTitle);
    const backBlurb = backBlurbFor(data);
    const coverPhoto = coverPhotoFor(settings, data);
    const coverSrc = coverPhotoSource(settings, data);
    const coverAlt = settings.cover.photo_custom ? rawTitle : (coverPhoto ? coverPhoto.alt : rawTitle);
    const coverLayout = settings.cover.layout;

    const photoNumber = new Map();
    photos.forEach((photo, index) => photoNumber.set(photo.id, index + 1));

    const chapterGroups = data.groups.filter((group) =>
      photos.some((photo) => photo.group === group.id)
    );

    /* Cover(0) + inside front(1) + contents(2), then one divider per chapter. */
    const plan = [];
    let cursor = 3;
    chapterGroups.forEach((group) => {
      const items = photos.filter((photo) => photo.group === group.id);
      plan.push({
        group,
        items,
        divider: cursor,
        startPlate: photoNumber.get(items[0].id)
      });
      cursor += 1 + items.length;
    });

    /* Front cover --------------------------------------------------------- */
    pages.push(`
      <div class="page page--cover" data-page-key="cover" data-density="hard">
        <div class="cover cover--${coverLayout}">
          <div class="cover-fullbleed" aria-hidden="true"><img src="${coverSrc}" alt=""></div>
          <div class="cover-shade" aria-hidden="true"></div>
          <p class="cover-kicker" data-edit="t:cover:kicker" data-edit-label="封面小标题">${escapeHtml(settings.cover.kicker)}</p>
          <div class="cover-plate" data-decor="d:cover:plate" data-decor-label="封面装裱照片">
            <img src="${coverSrc}" alt="${escapeHtml(coverAlt)}">
          </div>
          <h1 class="cover-title" data-edit="t:cover:title" data-edit-label="书名">${coverTitle}</h1>
          <p class="cover-subtitle" data-edit="t:cover:subtitle" data-edit-label="封面副标题">${escapeHtml(settings.cover.subtitle)}</p>
          <p class="cover-foot"><span class="cover-author" data-edit="t:cover:author" data-edit-label="封面作者">${escapeHtml(settings.cover.author)}</span><span class="cover-foot-meta">Vol. I &nbsp;·&nbsp; ${escapeHtml(meta.year || "2026")}</span></p>
        </div>
      </div>
    `);

    /* Inside front cover -------------------------------------------------- */
    pages.push(`
      <div class="page page--inside page--left" data-page-key="inside">
        <div class="page-inner">
          <p class="smallcaps" data-edit="t:inside:kicker" data-edit-label="扉页小标题">${escapeHtml(rawTitle)}</p>
          <h2 class="text-page-title" data-edit="t:inside:title" data-edit-label="扉页标题">Notes<br>on light</h2>
          <p class="text-page-body" data-edit="t:inside:body" data-edit-label="扉页正文">
            ${photos.length} frames made on film between early spring and late autumn.
            Left uncropped, and coloured as the emulsion recorded it.
          </p>
          <span class="text-page-mark" data-decor="d:inside:mark" data-decor-label="扉页装饰短线" aria-hidden="true"></span>
          <p class="imprint" data-edit="t:inside:imprint" data-edit-label="扉页版本信息">Proof copy<br>Not for sale</p>
        </div>
      </div>
    `);

    /* Contents ------------------------------------------------------------ */
    pages.push(`
      <div class="page page--toc ${sideFor(2)}" data-page-key="toc">
        <div class="page-inner toc-page">
          <p class="smallcaps" data-edit="t:toc:kicker" data-edit-label="目录小标题">Contents</p>
          <h2 class="text-page-title toc-title" data-edit="t:toc:title" data-edit-label="目录标题">Chapters</h2>
          <ol class="toc-list">
            ${plan.map((entry, index) => `
              <li class="toc-entry">
                <button class="toc-link" type="button" data-page="${entry.divider}">
                  <span class="toc-number">${pad(index + 1)}</span>
                  <span class="toc-label" data-toc-group="${escapeHtml(entry.group.id)}">${escapeHtml(entry.group.label)}<em>${escapeHtml(entry.group.label_en || "")}</em></span>
                  <span class="toc-plate">Plate ${pad(entry.startPlate)}</span>
                </button>
              </li>
            `).join("")}
          </ol>
          <p class="toc-note" data-edit="t:toc:note" data-edit-label="目录提示">点击章节跳转 · Tap a chapter to jump</p>
          <p class="folio">${pad(3)}</p>
        </div>
      </div>
    `);

    /* Chapter dividers + plates ------------------------------------------- */
    plan.forEach((entry, chapterIndex) => {
      const dividerIndex = pages.length;
      const chapterKey = entry.group.id;
      pages.push(`
        <div class="page page--chapter ${sideFor(dividerIndex)}" data-page-key="chapter:${escapeHtml(chapterKey)}">
          <div class="page-inner chapter-page">
            <p class="chapter-index" data-edit="t:chapter:${chapterKey}:index" data-edit-label="章节序号">Chapter ${pad(chapterIndex + 1)}</p>
            <h2 class="chapter-title" data-edit="t:chapter:${chapterKey}:title" data-edit-label="章节标题">${escapeHtml(entry.group.label)}</h2>
            <p class="chapter-title-en" data-edit="t:chapter:${chapterKey}:titleEn" data-edit-label="章节英文名">${escapeHtml(entry.group.label_en || "")}</p>
            <span class="chapter-rule" data-decor="d:chapter:${chapterKey}:rule" data-decor-label="章节分隔线" aria-hidden="true"></span>
            <p class="chapter-desc" data-edit="t:chapter:${chapterKey}:desc" data-edit-label="章节说明">${escapeHtml(entry.group.description || "")}</p>
            <p class="chapter-count" data-edit="t:chapter:${chapterKey}:count" data-edit-label="章节数量">${entry.items.length} plates</p>
            <p class="folio">${pad(dividerIndex + 1)}</p>
          </div>
        </div>
      `);

      entry.items.forEach((photo) => {
        const plateNo = photoNumber.get(photo.id);
        const pageIndex = pages.length;
        const essay = photo.essay
          ? photo.essay
          : `<p class="photo-quote">${escapeHtml(photo.note)}</p>`;

        pages.push(`
          <div class="page page--photo ${sideFor(pageIndex)}" data-page-key="photo:${escapeHtml(photo.id)}">
            <div class="page-inner">
              <div class="photo-frame">
                <img src="${imageUrl(photo.book_file || photo.file)}" alt="${escapeHtml(photo.alt)}"
                     width="${photo.width}" height="${photo.height}"
                     loading="${plateNo <= 3 ? "eager" : "lazy"}" decoding="async">
              </div>
              <div class="photo-note">
                <div class="photo-meta">
                  <p class="plate-label" data-edit="t:photo:${photo.id}:label" data-edit-label="作品编号">Plate ${pad(plateNo)} · ${escapeHtml(entry.group.label)}</p>
                  <p class="photo-title" data-edit="t:photo:${photo.id}:title" data-edit-label="作品标题">${escapeHtml(photo.title)}</p>
                </div>
                <div class="photo-essay" data-edit="t:photo:${photo.id}:essay" data-edit-label="作品长文">${essay}</div>
                <p class="folio">${pad(plateNo)}</p>
              </div>
            </div>
          </div>
        `);
      });
    });

    /* Afterword from data.json ------------------------------------------- */
    const afterword = data.book_afterword;
    const afterwordTitle = String(afterword.title || "");
    const afterwordBody = essayHtml(afterword.body);
    const afterwordSignature = String(afterword.signature || "");
    const afterwordIndex = pages.length;
    pages.push(`
      <div class="page page--afterword ${sideFor(afterwordIndex)}" data-page-key="afterword">
        <div class="page-inner afterword-page">
          <p class="smallcaps" data-edit="t:afterword:kicker" data-edit-label="后记小标题">Afterword</p>
          <h2 class="text-page-title afterword-title" data-edit="t:afterword:title" data-edit-label="后记标题">${escapeHtml(afterwordTitle || "关于这本影集")}</h2>
          <div class="afterword-body" data-edit="t:afterword:body" data-edit-label="后记正文">
            ${afterwordBody}
          </div>
          <p class="afterword-signature" data-edit="t:afterword:signature" data-edit-label="后记署名">${escapeHtml(afterwordSignature)}</p>
        </div>
      </div>
    `);

    /* Closing + back cover ------------------------------------------------ */
    const closingIndex = pages.length;
    pages.push(`
      <div class="page page--closing ${sideFor(closingIndex)}" data-page-key="closing">
        <div class="page-inner">
          <p class="smallcaps" data-edit="t:closing:kicker" data-edit-label="版权页小标题">Colophon</p>
          <h2 class="text-page-title" data-edit="t:closing:title" data-edit-label="版权页标题">Made slowly,<br>in natural light.</h2>
          <p class="text-page-body" data-edit="t:closing:body" data-edit-label="版权页正文">
            Photographed on 35mm and medium format film. Scanned, sequenced and
            proofed as a clothbound volume — a small record of weather, water
            and trees.
          </p>
          <span class="text-page-mark" data-decor="d:closing:mark" data-decor-label="版权页装饰短线" aria-hidden="true"></span>
          <p class="imprint" data-edit="t:closing:imprint" data-edit-label="版权页版本信息">${escapeHtml(rawTitle)}<br>Proof edition · ${escapeHtml(meta.year || "2026")}</p>
        </div>
      </div>
    `);

    /* Keep a physical, even page count when the number of plates changes. */
    if (pages.length % 2 === 0) {
      pages.push(`
        <div class="page page--blank ${sideFor(pages.length)}" data-page-key="blank">
          <div class="page-inner"></div>
        </div>
      `);
    }

    pages.push(`
      <div class="page page--back" data-page-key="back" data-density="hard">
        <div class="back-cover">
          <span class="back-mark" data-decor="d:back:mark" data-decor-label="封底装饰线" aria-hidden="true"></span>
          <p class="back-title" data-edit="t:back:title" data-edit-label="封底书名">${escapeHtml(rawTitle)}</p>
          <p class="back-blurb" data-edit="t:back:blurb" data-edit-label="封底节选">${escapeHtml(backBlurb)}</p>
          <p class="back-author" data-edit="t:back:author" data-edit-label="封底作者">${escapeHtml(settings.cover.author)}</p>
        </div>
      </div>
    `);

    return pages;
  };

  const markMissingImages = () => {
    bookElement.querySelectorAll("img").forEach((image) => {
      if (image.complete && image.naturalWidth === 0) applyImageFallback(image);
    });
  };

  const fitText = (element) => {
    if (!element) return;
    element.style.fontSize = "";
    const computed = parseFloat(window.getComputedStyle(element).fontSize);
    let size = Number.isFinite(computed) ? computed : 9;
    let guard = 0;
    while (element.scrollHeight > element.clientHeight + 1 && size > 6 && guard < 40) {
      size = Math.max(6, size - 0.25);
      element.style.fontSize = size.toFixed(2) + "px";
      guard += 1;
    }
  };

  const fitTextBlocks = () => {
    bookElement.querySelectorAll(".photo-essay, .afterword-body").forEach(fitText);
  };

  const init = async () => {
    const raw = await fetchData();
    if (!raw) {
      fail("数据未加载：请确认浏览器已启用 IndexedDB，并刷新页面后重试");
      return;
    }

    collection = normaliseData(raw);
    portfolioRaw = raw;
    if (!collection.photos.length) {
      fail("本机作品集中没有照片，请先在画廊中添加内容");
      return;
    }

    bookSettings = readBookSettings(raw);
    applyBookSettings(bookSettings);

    const pages = buildPages(collection);
    bookElement.innerHTML = pages.join("");
    pageElements = Array.from(bookElement.querySelectorAll(".page"));
    captureEditorOriginals();
    applyBookSettings(bookSettings);
    applyEditorState();
    if (pagerTotal) pagerTotal.textContent = pad(pages.length);
    if (pageCountLabel) pageCountLabel.textContent = String(pages.length);
    markMissingImages();

    const preload = (file) =>
      new Promise((resolve) => {
        if (!file) {
          resolve();
          return;
        }
        const image = new Image();
        image.onload = resolve;
        image.onerror = resolve;
        image.src = imageUrl(file);
      });

    const files = Array.from(new Set(collection.photos.map((photo) => photo.book_file)));
    const imageReady = Promise.all(files.map(preload));
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 3200));

    const updatePager = (index) => {
      if (!pageFlip) return;
      const page = Math.max(0, Math.min(index, pageFlip.getPageCount() - 1));
      currentPageIndex = page;
      if (pagerCurrent) pagerCurrent.textContent = pad(page + 1);
      if (prevButton) prevButton.disabled = page <= 0;
      if (nextButton) nextButton.disabled = page >= pageFlip.getPageCount() - 1;
    };

    const bind = () => {
      if (pageFlip) return;

      if (typeof window.St === "undefined" || !window.St.PageFlip) {
        fail("The page-flip library could not be loaded");
        return;
      }

      const wrap = bookElement.closest(".book-wrap");
      const wantsPortrait = () => window.innerWidth <= 820 || window.innerHeight < 700;
      if (wrap) wrap.classList.toggle("is-portrait", wantsPortrait());

      pageFlip = new window.St.PageFlip(bookElement, {
        width: 540,
        height: 720,
        size: "stretch",
        minWidth: 320,
        maxWidth: 620,
        minHeight: 420,
        maxHeight: 840,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        showCover: true,
        mobileScrollSupport: false,
        usePortrait: true,
        autoSize: true,
        flippingTime: 1000,
        useMouseEvents: true,
        clickEventForward: true,
        swipeDistance: 24,
        showPageCorners: true,
        disableFlipByClick: false,
        startPage: 0
      });

      pageFlip.loadFromHTML(bookElement.querySelectorAll(".page"));
      window.requestAnimationFrame(applyEditorOffsets);
      window.setTimeout(applyEditorOffsets, 160);

      bookElement.addEventListener(
        "click",
        (event) => {
          const link = event.target.closest(".toc-link");
          if (!link || !pageFlip) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const target = Number(link.dataset.page);
          if (!Number.isInteger(target)) return;
          pageFlip.turnToPage(target);
          window.setTimeout(() => updatePager(pageFlip.getCurrentPageIndex()), 80);
        },
        true
      );

      pageFlip.on("flip", (event) => {
        updatePager(typeof event.data === "number" ? event.data : pageFlip.getCurrentPageIndex());
        window.setTimeout(applyEditorOffsets, 80);
      });
      pageFlip.on("changeState", (event) => {
        if (event.data === "read") {
          updatePager(pageFlip.getCurrentPageIndex());
          window.setTimeout(applyEditorOffsets, 80);
        }
      });

      updatePager(0);
      window.requestAnimationFrame(() => window.requestAnimationFrame(fitTextBlocks));
      window.setTimeout(fitTextBlocks, 450);
      window.setTimeout(fitTextBlocks, 1200);
      window.setTimeout(applyEditorOffsets, 520);
      window.setTimeout(applyEditorOffsets, 1280);

      const syncOrientation = () => {
        if (!wrap) return;
        const portrait = wantsPortrait();
        if (wrap.classList.contains("is-portrait") === portrait) {
          fitTextBlocks();
          applyEditorOffsets();
          return;
        }
        wrap.classList.toggle("is-portrait", portrait);
        window.dispatchEvent(new Event("resize"));
        window.setTimeout(fitTextBlocks, 320);
        window.setTimeout(applyEditorOffsets, 360);
      };

      window.addEventListener("resize", () => {
        window.setTimeout(syncOrientation, 220);
      });

      window.setTimeout(() => {
        if (loader) loader.classList.add("is-hidden");
      }, 320);
    };

    const start = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => window.requestAnimationFrame(bind));
      } else {
        window.requestAnimationFrame(bind);
      }
    };

    imageReady.then(start);
    timeout.then(() => {
      if (!pageFlip) start();
    });

    if (prevButton) prevButton.addEventListener("click", () => pageFlip && pageFlip.flipPrev());
    if (nextButton) nextButton.addEventListener("click", () => pageFlip && pageFlip.flipNext());

    document.addEventListener("keydown", (event) => {
      if (designDrawer && designDrawer.classList.contains("is-open")) return;
      if (event.target && event.target.isContentEditable) return;
      if (event.target && /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
      if (!pageFlip) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        pageFlip.flipPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        pageFlip.flipNext();
      }
    });
  };

  const exportPdfBtn = document.getElementById("exportPdfBtn");

  const exportPrintPdf = async () => {
    if (!exportPdfBtn || exportPdfBtn.disabled) return;
    const original = exportPdfBtn.textContent;
    const printWindow = window.open("print.html?print=1", "_blank");
    if (!printWindow) {
      window.alert("浏览器拦截了新窗口，请允许弹出窗口后重试。");
      return;
    }
    exportPdfBtn.textContent = "已打开打印视图";
    window.setTimeout(() => {
      exportPdfBtn.textContent = original;
    }, 2600);
  };

  if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportPrintPdf);

  /* ---------------------------------------------------------------------- */
  /* Design drawer                                                          */
  /* ---------------------------------------------------------------------- */

  const designBtn = document.getElementById("designBtn");
  const designDrawer = document.getElementById("designDrawer");
  const designBackdrop = document.getElementById("designBackdrop");
  const designClose = document.getElementById("designClose");
  const designSave = document.getElementById("designSave");
  const designStatus = document.getElementById("designStatus");
  const designTitleInput = document.getElementById("designTitle");
  const designSubtitleInput = document.getElementById("designSubtitle");
  const designAuthorInput = document.getElementById("designAuthor");
  const designKickerInput = document.getElementById("designKicker");
  const designImageInput = document.getElementById("designImage");
  const designCoverPhoto = document.getElementById("designCoverPhoto");
  const designPhotoDrop = document.getElementById("designPhotoDrop");
  const designPhotoFile = document.getElementById("designPhotoFile");
  const designImageDrop = document.getElementById("designImageDrop");
  const designImageFile = document.getElementById("designImageFile");
  const designHeadingFont = document.getElementById("designHeadingFont");
  const designBodyFont = document.getElementById("designBodyFont");

  let designSettings = null;
  let refitTimer = 0;

  const cloneSettings = (value) => JSON.parse(JSON.stringify(value));

  const setDesignStatus = (message, state) => {
    if (!designStatus) return;
    designStatus.textContent = message;
    designStatus.classList.toggle("is-saved", state === "saved");
    designStatus.classList.toggle("is-error", state === "error");
  };

  const scheduleRefit = () => {
    window.clearTimeout(refitTimer);
    refitTimer = window.setTimeout(refitText, 120);
  };

  const syncCoverPhotoSelect = () => {
    if (!designCoverPhoto || !designSettings) return;
    const photos = collection && Array.isArray(collection.photos) ? collection.photos : [];
    const custom = designSettings.cover.photo_custom;
    const selected = custom ? "__custom__" : designSettings.cover.photo;

    designCoverPhoto.innerHTML = "";
    photos.forEach((photo, index) => {
      const option = document.createElement("option");
      option.value = photo.id;
      option.textContent = pad(index + 1) + " · " + (photo.title || photo.id);
      designCoverPhoto.append(option);
    });

    if (custom) {
      const option = document.createElement("option");
      let name = String(custom).split("/").pop() || "自定义上传";
      try {
        name = decodeURIComponent(name);
      } catch (error) {
        /* keep the raw filename if it is not valid percent-encoding */
      }
      option.value = "__custom__";
      option.textContent = "自定义上传 · " + name;
      designCoverPhoto.append(option);
    }

    if (!designCoverPhoto.options.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "没有可用照片";
      designCoverPhoto.append(option);
      return;
    }

    if (selected && Array.from(designCoverPhoto.options).some((option) => option.value === selected)) {
      designCoverPhoto.value = selected;
    } else {
      const fallbackPhoto = coverPhotoFor(designSettings);
      if (fallbackPhoto && Array.from(designCoverPhoto.options).some((option) => option.value === fallbackPhoto.id)) {
        designSettings.cover.photo = fallbackPhoto.id;
        designCoverPhoto.value = fallbackPhoto.id;
      } else {
        designCoverPhoto.selectedIndex = 0;
        if (!designSettings.cover.photo && designCoverPhoto.value) {
          designSettings.cover.photo = designCoverPhoto.value;
        }
      }
    }
  };

  const markDesignControls = () => {
    if (!designDrawer || !designSettings) return;
    designDrawer.querySelectorAll("[data-setting]").forEach((button) => {
      const parts = String(button.dataset.setting || "").split(".");
      const section = designSettings[parts[0]];
      const value = section ? section[parts[1]] : undefined;
      button.classList.toggle("is-selected", String(value) === String(button.dataset.value));
    });
    if (designHeadingFont) designHeadingFont.value = designSettings.type.heading;
    if (designBodyFont) designBodyFont.value = designSettings.type.body;
    syncCoverPhotoSelect();
  };

  const syncDesignControls = () => {
    if (!designSettings) return;
    if (designTitleInput) designTitleInput.value = designSettings.cover.title;
    if (designSubtitleInput) designSubtitleInput.value = designSettings.cover.subtitle;
    if (designAuthorInput) designAuthorInput.value = designSettings.cover.author;
    if (designKickerInput) designKickerInput.value = designSettings.cover.kicker;
    if (designImageInput) designImageInput.value = designSettings.cover.image;
    markDesignControls();
  };

  const applyDraft = () => {
    if (!designSettings) return;
    applyBookSettings(designSettings);
    applyEditorState();
    scheduleRefit();
    setDesignStatus("预览中 · 未保存", "");
  };

  const nudgeBookLayout = () => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 620);
  };

  const openDesignDrawer = () => {
    if (!designDrawer) return;
    exitEditMode();
    if (!designSettings) {
      designSettings = cloneSettings(bookSettings || readBookSettings(portfolioRaw || {}));
    }
    const state = ensureEditorDraft();
    const plainOverride = (key) =>
      state.texts[key] ? htmlToPlain(state.texts[key].html) : null;
    const titleOverride = plainOverride("t:cover:title");
    const subtitleOverride = plainOverride("t:cover:subtitle");
    const authorOverride = plainOverride("t:cover:author");
    const kickerOverride = plainOverride("t:cover:kicker");
    if (titleOverride != null) designSettings.cover.title = titleOverride;
    if (subtitleOverride != null) designSettings.cover.subtitle = subtitleOverride;
    if (authorOverride != null) designSettings.cover.author = authorOverride;
    if (kickerOverride != null) designSettings.cover.kicker = kickerOverride;
    syncDesignControls();
    designDrawer.classList.add("is-open");
    designDrawer.setAttribute("aria-hidden", "false");
    if (designBackdrop) designBackdrop.classList.add("is-open");
    if (designBtn) designBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("design-open");
    if (designClose) designClose.focus({ preventScroll: true });
    nudgeBookLayout();
  };

  const closeDesignDrawer = () => {
    if (!designDrawer) return;
    designDrawer.classList.remove("is-open");
    designDrawer.setAttribute("aria-hidden", "true");
    if (designBackdrop) designBackdrop.classList.remove("is-open");
    if (designBtn) {
      designBtn.setAttribute("aria-expanded", "false");
      designBtn.focus({ preventScroll: true });
    }
    document.body.classList.remove("design-open");
    nudgeBookLayout();
  };

  if (designBtn) {
    designBtn.addEventListener("click", () => {
      if (designDrawer && designDrawer.classList.contains("is-open")) closeDesignDrawer();
      else openDesignDrawer();
    });
  }

  if (designClose) designClose.addEventListener("click", closeDesignDrawer);
  if (designBackdrop) designBackdrop.addEventListener("click", closeDesignDrawer);

  if (designTitleInput) {
    designTitleInput.addEventListener("input", () => {
      if (!designSettings) return;
      designSettings.cover.title = designTitleInput.value;
      clearEditorText("t:cover:title");
      applyDraft();
    });
  }

  if (designSubtitleInput) {
    designSubtitleInput.addEventListener("input", () => {
      if (!designSettings) return;
      designSettings.cover.subtitle = designSubtitleInput.value;
      clearEditorText("t:cover:subtitle");
      applyDraft();
    });
  }

  if (designAuthorInput) {
    designAuthorInput.addEventListener("input", () => {
      if (!designSettings) return;
      designSettings.cover.author = designAuthorInput.value;
      clearEditorText("t:cover:author");
      clearEditorText("t:back:author");
      applyDraft();
    });
  }

  if (designKickerInput) {
    designKickerInput.addEventListener("input", () => {
      if (!designSettings) return;
      designSettings.cover.kicker = designKickerInput.value;
      clearEditorText("t:cover:kicker");
      applyDraft();
    });
  }

  if (designCoverPhoto) {
    designCoverPhoto.addEventListener("change", () => {
      if (!designSettings) return;
      const value = designCoverPhoto.value;
      if (!value || value === "__custom__") return;
      designSettings.cover.photo = value;
      designSettings.cover.photo_custom = "";
      applyDraft();
    });
  }

  if (designImageInput) {
    designImageInput.addEventListener("input", () => {
      if (!designSettings) return;
      designSettings.cover.image = designImageInput.value;
      applyDraft();
    });
  }

  if (designHeadingFont) {
    designHeadingFont.addEventListener("change", () => {
      if (!designSettings) return;
      designSettings.type.heading = designHeadingFont.value;
      applyDraft();
    });
  }

  if (designBodyFont) {
    designBodyFont.addEventListener("change", () => {
      if (!designSettings) return;
      designSettings.type.body = designBodyFont.value;
      applyDraft();
    });
  }

  if (designDrawer) {
    designDrawer.querySelectorAll("[data-setting]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!designSettings) return;
        const parts = String(button.dataset.setting || "").split(".");
        if (!parts[0] || !parts[1]) return;
        const rawValue = button.dataset.value || "";
        designSettings[parts[0]][parts[1]] =
          rawValue === "true" ? true : rawValue === "false" ? false : rawValue;
        markDesignControls();
        applyDraft();
      });
    });
  }


  const uploadDesignFile = async (file) => {
    if (!file) throw new Error("没有选择文件");
    if (!/^image\//i.test(file.type)) throw new Error("请选择图片文件");
    if (!window.ImageTools) throw new Error("图片压缩模块未加载，请刷新页面后重试");
    const result = await window.ImageTools.compress(file);
    return result.dataUrl;
  };

  const handleDesignUpload = async (kind, file) => {
    if (!designSettings) return;
    const zone = kind === "background" ? designImageDrop : designPhotoDrop;
    if (zone && zone.classList.contains("is-busy")) return;
    if (zone) zone.classList.add("is-busy");
    setDesignStatus("上传中…", "");

    try {
      const url = await uploadDesignFile(file);
      if (kind === "background") {
        designSettings.cover.image = url;
        if (designImageInput) designImageInput.value = url;
      } else {
        designSettings.cover.photo_custom = url;
      }
      applyBookSettings(designSettings);
      scheduleRefit();
      markDesignControls();
      setDesignStatus("已上传 · 请保存设计", "");
    } catch (error) {
      setDesignStatus("上传失败：" + error.message, "error");
    } finally {
      if (zone) zone.classList.remove("is-busy");
    }
  };

  const bindDesignDrop = (zone, input, kind) => {
    if (!zone || !input) return;
    let depth = 0;

    const choose = () => input.click();
    zone.addEventListener("click", choose);
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (file) handleDesignUpload(kind, file);
    });

    zone.addEventListener("dragenter", (event) => {
      event.preventDefault();
      depth += 1;
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragleave", (event) => {
      event.preventDefault();
      depth = Math.max(0, depth - 1);
      if (!depth) zone.classList.remove("is-dragover");
    });
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      depth = 0;
      zone.classList.remove("is-dragover");
      const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
      if (file) handleDesignUpload(kind, file);
    });
  };

  bindDesignDrop(designImageDrop, designImageFile, "background");
  bindDesignDrop(designPhotoDrop, designPhotoFile, "photo");

  const fetchFreshPortfolio = async () => {
    const stored = await readStoredData();
    return stored || portfolioRaw;
  };

  const persistBookSettings = async () => {
    const fresh = (await readStoredData()) || portfolioRaw;
    if (!fresh) {
      throw new Error("本机作品集为空，请先在画廊中添加内容");
    }
    if (!window.PortfolioStore) {
      throw new Error("当前浏览器不支持 IndexedDB");
    }

    const payload = Object.assign({}, fresh, { book_settings: cloneSettings(designSettings) });
    await window.PortfolioStore.write(payload);

    try {
      const channel = new BroadcastChannel("glimpse-portfolio");
      channel.postMessage({ type: "saved", source: "book" });
      channel.close();
    } catch (error) {
      /* older browsers simply keep the current proof until a manual reload */
    }

    portfolioRaw = payload;
    bookSettings = cloneSettings(designSettings);
    applyBookSettings(bookSettings);
    applyEditorState();
    scheduleRefit();
    return payload;
  };

  const saveDesignSettings = async () => {
    if (!designSave || designSave.disabled || !designSettings) return;
    designSave.disabled = true;
    setDesignStatus("保存中…", "");

    try {
      await persistBookSettings();
      const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setDesignStatus("已保存 · " + time, "saved");
      editDirty = false;
      setEditStatus("已保存 · " + time, "saved");
    } catch (error) {
      setDesignStatus("保存失败：" + error.message, "error");
    } finally {
      designSave.disabled = false;
    }
  };

  if (designSave) designSave.addEventListener("click", saveDesignSettings);

  /* ---------------------------------------------------------------------- */
  /* Layout editor: edit wording in place, drag text / decorations          */
  /* ---------------------------------------------------------------------- */

  const editBtn = document.getElementById("editBtn");
  const editBar = document.getElementById("editBar");
  const editStatus = document.getElementById("editStatus");
  const editTip = document.getElementById("editTip");
  const editUndo = document.getElementById("editUndo");
  const editReset = document.getElementById("editReset");
  const editSave = document.getElementById("editSave");
  const editDone = document.getElementById("editDone");
  const editDelete = document.getElementById("editDelete");
  const editOrnamentBtn = document.getElementById("editOrnamentBtn");
  const editOrnamentPanel = document.getElementById("editOrnamentPanel");
  const editOrnamentList = document.getElementById("editOrnamentList");
  const editOrnamentClose = document.getElementById("editOrnamentClose");
  const editDecorPanel = document.getElementById("editDecorPanel");
  const decorRotate = document.getElementById("decorRotate");
  const decorRotateValue = document.getElementById("decorRotateValue");
  const decorScale = document.getElementById("decorScale");
  const decorScaleValue = document.getElementById("decorScaleValue");
  const decorReset = document.getElementById("decorReset");

  const originalHtml = new WeakMap();
  const homeHosts = new WeakMap();
  const homeNextSiblings = new WeakMap();
  const DRAG_THRESHOLD = 3;
  const HISTORY_LIMIT = 60;

  let selectedElement = null;
  let dragState = null;
  let editDirty = false;
  let editHistory = [];
  let offsetTimer = 0;
  let transformHistoryActive = false;

  const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

  const editorKeyOf = (element) =>
    element ? element.getAttribute("data-edit") || element.getAttribute("data-decor") || "" : "";

  const htmlToPlain = (html) => {
    const holder = document.createElement("div");
    holder.innerHTML = String(html == null ? "" : html).replace(/<br\s*\/?>/gi, " ");
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
  };

  const normaliseEditableHtml = (html) =>
    sanitizeHtml(String(html == null ? "" : html))
      .replace(/^(<br\s*\/?>)+/i, "")
      .replace(/(<br\s*\/?>)+$/i, "")
      .trim();

  function rememberBaseText(element) {
    if (!element || element.isContentEditable) return;
    originalHtml.set(element, element.innerHTML);
  }

  function ensureEditorDraft() {
    if (!designSettings) {
      designSettings = cloneSettings(bookSettings || readBookSettings(portfolioRaw || {}));
    }
    if (!designSettings.editor || typeof designSettings.editor !== "object") {
      designSettings.editor = { texts: {}, offsets: {} };
    }
    if (!designSettings.editor.texts || typeof designSettings.editor.texts !== "object") {
      designSettings.editor.texts = {};
    }
    if (!designSettings.editor.offsets || typeof designSettings.editor.offsets !== "object") {
      designSettings.editor.offsets = {};
    }
    if (!designSettings.editor.placements || typeof designSettings.editor.placements !== "object") {
      designSettings.editor.placements = {};
    }
    if (!designSettings.editor.transforms || typeof designSettings.editor.transforms !== "object") {
      designSettings.editor.transforms = {};
    }
    if (!Array.isArray(designSettings.editor.decorations)) {
      designSettings.editor.decorations = [];
    }
    return designSettings.editor;
  }

  const serialiseEditor = (state) => {
    const texts = state && state.texts && typeof state.texts === "object" ? state.texts : {};
    const offsets = state && state.offsets && typeof state.offsets === "object" ? state.offsets : {};
    const placements = state && state.placements && typeof state.placements === "object" ? state.placements : {};
    const transforms = state && state.transforms && typeof state.transforms === "object" ? state.transforms : {};
    const decorations = state && Array.isArray(state.decorations) ? state.decorations : [];
    return JSON.stringify({
      texts: Object.keys(texts).sort().map((key) => [key, texts[key] && texts[key].html ? texts[key].html : ""]),
      offsets: Object.keys(offsets).sort().map((key) => [
        key,
        Number(offsets[key] && offsets[key].x) || 0,
        Number(offsets[key] && offsets[key].y) || 0
      ]),
      placements: Object.keys(placements).sort().map((key) => [
        key,
        String(placements[key] && placements[key].page || ""),
        Number(placements[key] && placements[key].x) || 0,
        Number(placements[key] && placements[key].y) || 0,
        Number(placements[key] && placements[key].w) || 0
      ]),
      transforms: Object.keys(transforms).sort().map((key) => [
        key,
        Number(transforms[key] && transforms[key].r) || 0,
        Number(transforms[key] && transforms[key].s) || 1
      ]),
      decorations: decorations
        .map((item) => [String(item.id || ""), String(item.page || ""), String(item.type || "")])
        .sort((a, b) => a[0].localeCompare(b[0]))
    });
  };

  const editorHasChanges = () => {
    const saved = bookSettings && bookSettings.editor
      ? readEditorSettings(bookSettings.editor)
      : { texts: {}, offsets: {}, placements: {}, transforms: {}, decorations: [] };
    return serialiseEditor(ensureEditorDraft()) !== serialiseEditor(saved);
  };

  const setEditStatus = (message, state) => {
    if (!editStatus) return;
    editStatus.textContent = message;
    editStatus.classList.toggle("is-saved", state === "saved");
    editStatus.classList.toggle("is-error", state === "error");
  };

  const setEditTip = (message) => {
    if (editTip) editTip.textContent = message;
  };

  const markEditorDirty = (message) => {
    editDirty = true;
    setEditStatus(message || "有未保存修改");
  };

  function applyOffset(element, offset) {
    if (!element) return;
    if (!offset || (!offset.x && !offset.y)) {
      element.style.translate = "";
      return;
    }
    const page = element.closest(".page");
    const width = page ? page.clientWidth : 0;
    const height = page ? page.clientHeight : 0;
    if (!width || !height) {
      element.style.translate = "";
      window.requestAnimationFrame(() => {
        const nextPage = element.closest(".page");
        const nextWidth = nextPage ? nextPage.clientWidth : 0;
        const nextHeight = nextPage ? nextPage.clientHeight : 0;
        if (nextWidth && nextHeight) {
          element.style.translate =
            (offset.x * nextWidth).toFixed(2) + "px " + (offset.y * nextHeight).toFixed(2) + "px";
        }
      });
      return;
    }
    element.style.translate =
      (offset.x * width).toFixed(2) + "px " + (offset.y * height).toFixed(2) + "px";
  }

  function applyEditorOffsets() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    bookElement.querySelectorAll("[data-edit], [data-decor]").forEach((element) => {
      const key = editorKeyOf(element);
      if (state.placements[key] && !element.hasAttribute("data-ornament")) {
        element.style.translate = "";
        return;
      }
      applyOffset(element, state.offsets[key]);
    });
  }

  function elementByEditorKey(key) {
    if (!bookElement || !key) return null;
    return Array.from(bookElement.querySelectorAll("[data-edit], [data-decor]"))
      .find((element) => editorKeyOf(element) === key) || null;
  }

  function applyPlacement(element, placement) {
    if (!element || !placement) return;
    const host = ornamentHost(pageByKey(placement.page));
    if (!host) return;
    if (element.parentElement !== host) host.appendChild(element);
    element.classList.add("is-detached");
    element.style.position = "absolute";
    element.style.left = (placement.x * 100).toFixed(4) + "%";
    element.style.top = (placement.y * 100).toFixed(4) + "%";
    element.style.width = (placement.w * 100).toFixed(4) + "%";
    element.style.margin = "0";
    element.style.zIndex = "3";
    element.style.translate = "";
  }

  function clearElementPlacement(element) {
    if (!element) return;
    const home = homeHosts.get(element);
    if (home && element.parentElement !== home) {
      const next = homeNextSiblings.get(element);
      if (next && next.parentElement === home) home.insertBefore(element, next);
      else home.appendChild(element);
    }
    element.classList.remove("is-detached");
    element.style.position = "";
    element.style.left = "";
    element.style.top = "";
    element.style.width = "";
    element.style.margin = "";
    element.style.zIndex = "";
  }

  function syncEditorPlacements() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    bookElement.querySelectorAll("[data-edit], [data-decor]").forEach((element) => {
      if (element.hasAttribute("data-ornament")) return;
      const placement = state.placements[editorKeyOf(element)];
      if (placement) applyPlacement(element, placement);
      else clearElementPlacement(element);
    });
  }

  function syncEditorTransforms() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    bookElement.querySelectorAll("[data-decor]").forEach((element) => {
      const transform = state.transforms[element.getAttribute("data-decor")];
      element.style.rotate = transform && transform.r ? transform.r + "deg" : "";
      element.style.scale = transform && transform.s && transform.s !== 1 ? String(transform.s) : "";
    });
  }

  function refreshTocLabels() {
    if (!bookElement || !collection) return;
    const state = ensureEditorDraft();
    bookElement.querySelectorAll("[data-toc-group]").forEach((label) => {
      const groupId = label.getAttribute("data-toc-group");
      const group = collection.groups.find((entry) => entry.id === groupId);
      if (!group) return;
      const override = state.texts["t:chapter:" + groupId + ":title"];
      const text = override ? htmlToPlain(override.html) : group.label;
      const node = Array.from(label.childNodes).find((child) => child.nodeType === 3);
      if (node) node.nodeValue = text;
    });
  }

  function applyEditorText() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    bookElement.querySelectorAll("[data-edit]").forEach((element) => {
      const key = element.getAttribute("data-edit");
      const entry = state.texts[key];
      if (document.activeElement === element && element.isContentEditable) return;
      const target = entry ? entry.html : originalHtml.get(element);
      if (typeof target === "string" && element.innerHTML !== target) element.innerHTML = target;
    });
    refreshTocLabels();
  }

  const applyEditorState = () => {
    syncOrnaments();
    syncEditorPlacements();
    syncEditorTransforms();
    applyEditorText();
    applyEditorOffsets();
  };

  function bindEditorElement(element) {
    if (!element || element.dataset.editorBound === "1") return;
    element.dataset.editorBound = "1";
    element.addEventListener("pointerdown", onEditorPointerDown);
    element.addEventListener("pointermove", onEditorPointerMove);
    element.addEventListener("pointerup", finishEditorDrag);
    element.addEventListener("pointercancel", cancelEditorDrag);
    element.addEventListener("mousedown", stopEditorPropagation);
    element.addEventListener("touchstart", stopEditorPropagation, { passive: true });
    element.addEventListener("click", stopEditorPropagation);
    element.addEventListener("dragstart", preventEditorDrag);
  }

  function captureEditorOriginals() {
    if (!bookElement) return;
    bookElement.querySelectorAll("[data-edit], [data-decor]").forEach((element) => {
      if (element.hasAttribute("data-edit") && !originalHtml.has(element)) {
        originalHtml.set(element, element.innerHTML);
      }
      if (!element.hasAttribute("data-ornament") && !homeHosts.has(element)) {
        homeHosts.set(element, element.parentElement);
        homeNextSiblings.set(element, element.nextSibling);
      }
      bindEditorElement(element);
    });
  }

  const ornamentKey = (id) => "d:orn:" + id;

  function pageByKey(pageKey) {
    if (!bookElement) return null;
    return Array.from(bookElement.querySelectorAll("[data-page-key]"))
      .find((page) => page.getAttribute("data-page-key") === pageKey) || null;
  }

  function ornamentHost(page) {
    if (!page) return null;
    return page.querySelector(".page-inner") ||
      page.querySelector(".cover") ||
      page.querySelector(".back-cover");
  }

  function createOrnamentElement(item) {
    const preset = ORNAMENT_PRESETS[item.type];
    if (!preset) return null;
    const element = document.createElement("span");
    element.className = "ornament ornament--" + item.type;
    element.setAttribute("data-decor", ornamentKey(item.id));
    element.setAttribute("data-ornament", item.id);
    element.setAttribute("data-decor-label", "装饰 · " + preset.label);
    element.setAttribute("aria-hidden", "true");
    element.style.setProperty("--ornament-w", ((preset.width / 540) * 100).toFixed(3) + "%");
    element.innerHTML = preset.svg;
    return element;
  }

  function syncOrnaments() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    const wanted = new Map();
    state.decorations.forEach((item) => {
      if (item && item.id && ORNAMENT_TYPES.has(item.type)) wanted.set(item.id, item);
    });
    bookElement.querySelectorAll("[data-ornament]").forEach((element) => {
      if (!wanted.has(element.getAttribute("data-ornament"))) element.remove();
    });
    wanted.forEach((item) => {
      let element = bookElement.querySelector('[data-ornament="' + item.id + '"]');
      const host = ornamentHost(pageByKey(item.page));
      if (!element) {
        element = createOrnamentElement(item);
        if (!element || !host) return;
        host.appendChild(element);
        bindEditorElement(element);
        return;
      }
      if (host && element.parentElement !== host) host.appendChild(element);
    });
  }

  function currentPageElement() {
    const pages = pageElements.length ? pageElements : Array.from(bookElement.querySelectorAll(".page"));
    if (selectedElement) {
      const selectedPage = selectedElement.closest(".page");
      if (selectedPage && selectedPage.clientWidth > 0) return selectedPage;
    }
    if (pages.length) {
      const index = Math.max(0, Math.min(currentPageIndex, pages.length - 1));
      return pages[index];
    }
    return null;
  }

  function buildOrnamentPalette() {
    if (!editOrnamentList || editOrnamentList.children.length) return;
    Object.keys(ORNAMENT_PRESETS).forEach((type) => {
      const preset = ORNAMENT_PRESETS[type];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ornament-chip";
      button.dataset.ornamentType = type;
      button.innerHTML =
        '<span class="ornament-chip-art">' + preset.svg + "</span>" +
        '<span class="ornament-chip-label">' + preset.label + "</span>";
      button.addEventListener("click", () => addOrnament(type));
      editOrnamentList.appendChild(button);
    });
  }

  function toggleOrnamentPanel(force) {
    if (!editBar) return;
    const open = typeof force === "boolean"
      ? force
      : !editBar.classList.contains("show-ornaments");
    editBar.classList.toggle("show-ornaments", open);
    if (editOrnamentPanel) editOrnamentPanel.setAttribute("aria-hidden", open ? "false" : "true");
    if (editOrnamentBtn) editOrnamentBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function addOrnament(type) {
    if (!document.body.classList.contains("is-editing")) return;
    const preset = ORNAMENT_PRESETS[type];
    const page = currentPageElement();
    if (!preset || !page) return;
    const pageKey = page.getAttribute("data-page-key");
    if (!pageKey) return;

    const state = ensureEditorDraft();
    if (state.decorations.length >= 60) {
      setEditTip("装饰数量已达上限（60 个）");
      return;
    }
    pushEditorHistory();
    const id = "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const samePage = state.decorations.filter((item) => item.page === pageKey).length;
    state.decorations.push({ id, page: pageKey, type });
    state.offsets[ornamentKey(id)] = {
      x: ((samePage % 3) - 1) * 0.06,
      y: (((samePage + 1) % 4) - 1.5) * 0.05
    };
    syncOrnaments();
    applyEditorOffsets();
    const element = bookElement.querySelector('[data-ornament="' + id + '"]');
    if (element) selectElement(element);
    toggleOrnamentPanel(false);
    markEditorDirty("已添加「" + preset.label + "」· 未保存");
    setEditTip("已添加「" + preset.label + "」· 拖动调整位置 · Delete 删除");
  }

  function deleteSelectedOrnament() {
    if (!selectedElement || !selectedElement.hasAttribute("data-ornament")) return;
    const id = selectedElement.getAttribute("data-ornament");
    const state = ensureEditorDraft();
    const index = state.decorations.findIndex((item) => item.id === id);
    if (index < 0) return;
    pushEditorHistory();
    state.decorations.splice(index, 1);
    delete state.offsets[ornamentKey(id)];
    delete state.transforms[ornamentKey(id)];
    selectedElement.remove();
    selectElement(null);
    markEditorDirty("已删除装饰 · 未保存");
  }

  function stopEditorPropagation(event) {
    if (document.body.classList.contains("is-editing")) event.stopPropagation();
  }

  function preventEditorDrag(event) {
    if (document.body.classList.contains("is-editing")) event.preventDefault();
  }

  function selectedDecorKey() {
    return selectedElement && selectedElement.hasAttribute("data-decor")
      ? selectedElement.getAttribute("data-decor")
      : "";
  }

  function syncDecorControls() {
    const key = selectedDecorKey();
    if (!key) return;
    const transform = ensureEditorDraft().transforms[key] || { r: 0, s: 1 };
    const rotation = Math.round(transform.r);
    const scalePercent = Math.round(transform.s * 100);
    if (decorRotate) decorRotate.value = String(rotation);
    if (decorRotateValue) decorRotateValue.textContent = rotation + "°";
    if (decorScale) decorScale.value = String(scalePercent);
    if (decorScaleValue) decorScaleValue.textContent = scalePercent + "%";
  }

  function applyDecorTransform(patch) {
    const key = selectedDecorKey();
    if (!key) return;
    if (!transformHistoryActive) {
      pushEditorHistory();
      transformHistoryActive = true;
    }
    const state = ensureEditorDraft();
    const current = state.transforms[key] || { r: 0, s: 1 };
    const next = {
      r: Number.isFinite(patch.r)
        ? Math.max(-180, Math.min(180, patch.r))
        : current.r,
      s: Number.isFinite(patch.s)
        ? Math.max(0.25, Math.min(3, patch.s))
        : current.s
    };
    if (!next.r && next.s === 1) delete state.transforms[key];
    else state.transforms[key] = next;
    syncEditorTransforms();
    syncDecorControls();
    markEditorDirty("装饰已调整 · 未保存");
  }

  function resetDecorTransform() {
    const key = selectedDecorKey();
    if (!key) return;
    pushEditorHistory();
    delete ensureEditorDraft().transforms[key];
    syncEditorTransforms();
    syncDecorControls();
    markEditorDirty("已重置旋转/缩放 · 未保存");
  }

  function selectElement(element) {
    if (selectedElement === element) return;
    if (selectedElement) selectedElement.classList.remove("is-selected");
    selectedElement = element || null;
    if (editDelete) {
      editDelete.disabled = !(selectedElement && selectedElement.hasAttribute("data-ornament"));
    }
    const isDecor = !!(selectedElement && selectedElement.hasAttribute("data-decor"));
    if (editBar) editBar.classList.toggle("editing-decor", isDecor);
    if (editDecorPanel) editDecorPanel.setAttribute("aria-hidden", isDecor ? "false" : "true");
    if (isDecor) syncDecorControls();
    if (!selectedElement) {
      setEditTip("点击选中文字或图案 · 双击改写 · 拖动移动");
      return;
    }
    selectedElement.classList.add("is-selected");
    const label = selectedElement.getAttribute("data-edit-label") ||
      selectedElement.getAttribute("data-decor-label") || "元素";
    if (selectedElement.hasAttribute("data-edit")) {
      setEditTip("已选中「" + label + "」· 双击改写 · 拖动移动");
    } else if (selectedElement.hasAttribute("data-ornament")) {
      setEditTip("已选中「" + label + "」· 拖动 / 旋转 / 缩放 · Delete 删除");
    } else {
      setEditTip("已选中「" + label + "」· 拖动 / 旋转 / 缩放");
    }
  }

  const editorSnapshot = () => JSON.parse(JSON.stringify(ensureEditorDraft()));

  function pushEditorHistory() {
    editHistory.push(editorSnapshot());
    if (editHistory.length > HISTORY_LIMIT) editHistory.shift();
    if (editUndo) editUndo.disabled = false;
  }

  function placeCaret(element, x, y) {
    const selection = window.getSelection();
    if (!selection) return;
    let range = null;
    if (Number.isFinite(x) && Number.isFinite(y) && typeof document.caretRangeFromPoint === "function") {
      range = document.caretRangeFromPoint(x, y);
    }
    if (!range || !element.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function enterTextEdit(element, x, y) {
    if (!element || !element.hasAttribute("data-edit")) return;
    selectElement(element);
    if (element.isContentEditable) {
      element.focus({ preventScroll: true });
      placeCaret(element, x, y);
      return;
    }
    pushEditorHistory();
    element.setAttribute("contenteditable", "true");
    element.setAttribute("spellcheck", "false");
    element.classList.add("is-text-editing");
    element.focus({ preventScroll: true });
    placeCaret(element, x, y);
    setEditTip("正在改写「" + (element.getAttribute("data-edit-label") || "文字") + "」· Esc 完成");
  }

  function writeEditorText(element) {
    const key = element.getAttribute("data-edit");
    if (!key) return false;
    const state = ensureEditorDraft();
    const html = normaliseEditableHtml(element.innerHTML);
    const original = normaliseEditableHtml(originalHtml.get(element) || "");
    if (html === original) delete state.texts[key];
    else state.texts[key] = { html };
    refreshTocLabels();
    return html !== original;
  }

  function fitEditedBlock(element) {
    if (!element) return;
    if (element.classList.contains("photo-essay") || element.classList.contains("afterword-body")) {
      fitText(element);
    }
  }

  function finishTextEdit(element) {
    if (!element || !element.isContentEditable) return;
    const changed = writeEditorText(element);
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    element.classList.remove("is-text-editing");
    fitEditedBlock(element);
    if (changed) markEditorDirty("文字已修改 · 未保存");
    else {
      editDirty = editorHasChanges();
      setEditStatus(editDirty ? "有未保存修改" : "未保存", editDirty ? "" : "saved");
    }
    if (selectedElement === element) {
      const label = element.getAttribute("data-edit-label") || "文字";
      setEditTip("已选中「" + label + "」· 双击改写 · 拖动移动");
    }
  }

  function undoEditor() {
    if (!editHistory.length) return;
    const previous = editHistory.pop();
    designSettings.editor = JSON.parse(JSON.stringify(previous));
    syncOrnaments();
    syncEditorPlacements();
    syncEditorTransforms();
    applyEditorText();
    applyEditorOffsets();
    fitTextBlocks();
    if (selectedElement && !selectedElement.isConnected) selectElement(null);
    if (editorHasChanges()) markEditorDirty("已撤销 · 未保存");
    else setEditStatus("未保存", "");
    if (editUndo) editUndo.disabled = editHistory.length === 0;
    syncDecorControls();
  }

  function resetEditorTargets() {
    if (!bookElement) return;
    const state = ensureEditorDraft();
    const targets = selectedElement
      ? [selectedElement]
      : Array.from(bookElement.querySelectorAll("[data-edit], [data-decor]"));
    if (!targets.length) return;
    if (selectedElement && selectedElement.isContentEditable) finishTextEdit(selectedElement);
    pushEditorHistory();
    targets.forEach((element) => {
      const key = editorKeyOf(element);
      if (!key) return;
      delete state.offsets[key];
      delete state.placements[key];
      delete state.transforms[key];
      if (element.hasAttribute("data-edit")) {
        delete state.texts[key];
        const original = originalHtml.get(element);
        if (original != null) element.innerHTML = original;
      }
      element.style.translate = "";
    });
    if (!selectedElement) {
      state.decorations = [];
      state.transforms = {};
    }
    syncOrnaments();
    syncEditorPlacements();
    syncEditorTransforms();
    refreshTocLabels();
    applyEditorOffsets();
    fitTextBlocks();
    markEditorDirty(selectedElement ? "已重置所选 · 未保存" : "已重置全部 · 未保存");
    syncDecorControls();
  }

  const DRAG_PROXY_PROPS = [
    "display", "font-family", "font-size", "font-weight", "font-style", "line-height",
    "letter-spacing", "text-transform", "text-align", "text-decoration", "text-indent",
    "text-shadow", "white-space", "word-break", "overflow-wrap", "color", "opacity",
    "background-color", "background-image", "background-size", "background-position",
    "padding", "border", "border-radius", "box-shadow", "mix-blend-mode", "rotate", "scale"
  ];

  function getDragLayer() {
    let layer = document.getElementById("editorDragLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "editorDragLayer";
      layer.className = "editor-drag-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  function createDragProxy(element, rect, width, height, left, top) {
    const proxy = element.cloneNode(true);
    proxy.removeAttribute("id");
    proxy.removeAttribute("contenteditable");
    proxy.removeAttribute("spellcheck");
    proxy.removeAttribute("data-edit");
    proxy.removeAttribute("data-decor");
    proxy.removeAttribute("data-ornament");
    proxy.removeAttribute("data-editor-bound");
    proxy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    proxy.classList.remove("is-selected", "is-text-editing", "is-dragging", "is-drag-source");
    proxy.classList.add("editor-drag-proxy");
    const computed = window.getComputedStyle(element);
    DRAG_PROXY_PROPS.forEach((property) => {
      proxy.style.setProperty(property, computed.getPropertyValue(property));
    });
    proxy.style.position = "fixed";
    proxy.style.left = left + "px";
    proxy.style.top = top + "px";
    proxy.style.width = width + "px";
    proxy.style.height = height + "px";
    proxy.style.margin = "0";
    proxy.style.transform = "none";
    proxy.style.translate = "none";
    proxy.style.overflow = "visible";
    proxy.style.pointerEvents = "none";
    proxy.style.boxSizing = "border-box";
    proxy.style.zIndex = "1000";
    return proxy;
  }

  function removeDragProxy(state) {
    if (!state) return;
    if (state.proxy) {
      state.proxy.remove();
      state.proxy = null;
    }
    state.element.classList.remove("is-drag-source", "is-dragging");
    pageElements.forEach((page) => page.classList.remove("is-drop-target"));
  }

  function pageMetrics(page) {
    const rect = page.getBoundingClientRect();
    const width = page.clientWidth || rect.width || 1;
    const height = page.clientHeight || rect.height || 1;
    return {
      rect,
      width,
      height,
      scaleX: rect.width ? width / rect.width : 1,
      scaleY: rect.height ? height / rect.height : 1
    };
  }

  function pageAtPoint(x, y) {
    const stack = document.elementsFromPoint(x, y);
    for (const node of stack) {
      if (!(node instanceof Element)) continue;
      const page = node.closest(".page");
      if (page && page.clientWidth > 0) return page;
    }
    const visible = pageElements.filter((page) => page.clientWidth > 0);
    let best = null;
    let bestDistance = Infinity;
    visible.forEach((page) => {
      const rect = page.getBoundingClientRect();
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = page;
      }
    });
    return best;
  }

  function setDropTarget(page) {
    pageElements.forEach((candidate) => {
      candidate.classList.toggle("is-drop-target", !!page && candidate === page &&
        candidate !== (dragState && dragState.page));
    });
  }

  function placementFromRect(rect, page, widthFraction, heightFraction, useCenter) {
    const metrics = pageMetrics(page);
    const w = widthFraction || (rect.width * metrics.scaleX) / metrics.width;
    if (!useCenter) {
      return {
        page: page.getAttribute("data-page-key"),
        x: clampValue(((rect.left - metrics.rect.left) * metrics.scaleX) / metrics.width, -0.5, 1.5),
        y: clampValue(((rect.top - metrics.rect.top) * metrics.scaleY) / metrics.height, -0.5, 1.5),
        w: clampValue(w, 0.002, 1.5)
      };
    }
    const centerX = (rect.left + rect.width / 2 - metrics.rect.left) * metrics.scaleX;
    const centerY = (rect.top + rect.height / 2 - metrics.rect.top) * metrics.scaleY;
    const h = heightFraction || (rect.height * metrics.scaleY) / metrics.height;
    return {
      page: page.getAttribute("data-page-key"),
      x: clampValue((centerX - (w * metrics.width) / 2) / metrics.width, -0.5, 1.5),
      y: clampValue((centerY - (h * metrics.height) / 2) / metrics.height, -0.5, 1.5),
      w: clampValue(w, 0.002, 1.5)
    };
  }

  function ornamentOffsetFromRect(rect, page) {
    const metrics = pageMetrics(page);
    const centerX = ((rect.left + rect.width / 2 - metrics.rect.left) * metrics.scaleX);
    const centerY = ((rect.top + rect.height / 2 - metrics.rect.top) * metrics.scaleY);
    return {
      x: clampValue((centerX - metrics.width / 2) / metrics.width, -1.5, 1.5),
      y: clampValue((centerY - metrics.height / 2) / metrics.height, -1.5, 1.5)
    };
  }

  function onEditorPointerDown(event) {
    if (!document.body.classList.contains("is-editing")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const element = event.currentTarget;
    if (!(element instanceof HTMLElement)) return;
    if (element.hasAttribute("data-edit") && element.isContentEditable) return;
    if (event.target && event.target.closest &&
        event.target.closest("[data-edit], [data-decor]") !== element) return;

    const page = element.closest(".page");
    if (!page) return;
    event.stopPropagation();
    event.preventDefault();

    const wasSelected = selectedElement === element;
    if (!wasSelected) selectElement(element);

    const key = editorKeyOf(element);
    if (!key) return;
    const draft = ensureEditorDraft();
    const current = draft.offsets[key] || { x: 0, y: 0 };
    const placement = draft.placements[key] || null;
    const rect = page.getBoundingClientRect();
    const pageWidth = page.clientWidth || rect.width;
    const pageHeight = page.clientHeight || rect.height;
    const startRect = element.getBoundingClientRect();
    const layoutWidth = element.offsetWidth || startRect.width;
    const layoutHeight = element.offsetHeight || startRect.height;
    const pageScaleX = rect.width ? rect.width / pageWidth : 1;
    const pageScaleY = rect.height ? rect.height / pageHeight : 1;
    const transform = draft.transforms[key];
    const useCenter = !!transform && (transform.r !== 0 || transform.s !== 1);
    const proxyWidth = useCenter ? layoutWidth * pageScaleX : startRect.width;
    const proxyHeight = useCenter ? layoutHeight * pageScaleY : startRect.height;
    const widthFraction = placement
      ? placement.w
      : (useCenter
        ? (pageWidth ? layoutWidth / pageWidth : 1)
        : (rect.width ? startRect.width / rect.width : 1));
    const heightFraction = pageHeight ? layoutHeight / pageHeight : 1;

    dragState = {
      element,
      key,
      page,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startRect,
      proxyWidth,
      proxyHeight,
      proxyBaseLeft: startRect.left + startRect.width / 2 - proxyWidth / 2,
      proxyBaseTop: startRect.top + startRect.height / 2 - proxyHeight / 2,
      baseX: current.x,
      baseY: current.y,
      placement,
      placementW: widthFraction,
      placementH: heightFraction,
      useCenter,
      pageWidth,
      pageHeight,
      distanceX: rect.width ? pageWidth / rect.width : 1,
      distanceY: rect.height ? pageHeight / rect.height : 1,
      isOrnament: element.hasAttribute("data-ornament"),
      ornamentId: element.getAttribute("data-ornament") || "",
      proxy: null,
      targetPage: page,
      moved: false,
      wasSelected,
      caretX: event.clientX,
      caretY: event.clientY,
      pointerId: event.pointerId,
      nextX: current.x,
      nextY: current.y
    };
    try {
      element.setPointerCapture(event.pointerId);
    } catch (error) {
      /* pointer capture is optional; the listeners still receive the events */
    }
  }

  function onEditorPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!dragState.moved) {
      dragState.moved = true;
      dragState.proxy = createDragProxy(
        dragState.element,
        dragState.startRect,
        dragState.proxyWidth,
        dragState.proxyHeight,
        dragState.proxyBaseLeft,
        dragState.proxyBaseTop
      );
      getDragLayer().appendChild(dragState.proxy);
      dragState.element.classList.add("is-drag-source", "is-dragging");
      const label = dragState.element.getAttribute("data-edit-label") ||
        dragState.element.getAttribute("data-decor-label") || "元素";
      setEditTip("正在移动「" + label + "」· 可拖到相邻页 · 松开完成");
    }
    event.preventDefault();
    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
    const proxy = dragState.proxy;
    if (proxy) {
      proxy.style.left = (dragState.proxyBaseLeft + dx) + "px";
      proxy.style.top = (dragState.proxyBaseTop + dy) + "px";
    }
    const target = pageAtPoint(event.clientX, event.clientY) || dragState.page;
    dragState.targetPage = target;
    setDropTarget(target === dragState.page ? null : target);
  }

  function finishEditorDrag(event) {
    if (!dragState || (event && event.pointerId !== dragState.pointerId)) return;
    const state = dragState;
    dragState = null;
    const proxyRect = state.proxy ? state.proxy.getBoundingClientRect() : null;
    removeDragProxy(state);
    try {
      state.element.releasePointerCapture(state.pointerId);
    } catch (error) {
      /* already released */
    }

    if (!state.moved) {
      if (state.wasSelected && state.element.hasAttribute("data-edit")) {
        enterTextEdit(state.element, state.caretX, state.caretY);
      }
      return;
    }

    const draft = ensureEditorDraft();
    const target = state.targetPage || state.page;
    const targetKey = target.getAttribute("data-page-key");
    const movedPage = target !== state.page;
    pushEditorHistory();

    if (state.isOrnament) {
      const offset = proxyRect
        ? ornamentOffsetFromRect(proxyRect, target)
        : { x: state.baseX, y: state.baseY };
      draft.offsets[state.key] = offset;
      if (movedPage) {
        const item = draft.decorations.find((entry) => entry.id === state.ornamentId);
        const host = ornamentHost(target);
        if (item && host) {
          item.page = targetKey;
          host.appendChild(state.element);
        }
      }
      applyOffset(state.element, offset);
    } else if (state.placement || movedPage) {
      const placement = proxyRect
        ? placementFromRect(proxyRect, target, state.placementW, state.placementH, state.useCenter)
        : state.placement;
      if (placement) {
        draft.placements[state.key] = placement;
        delete draft.offsets[state.key];
        applyPlacement(state.element, placement);
      }
    } else {
      const dx = (proxyRect ? proxyRect.left : state.startRect.left) - state.startRect.left;
      const dy = (proxyRect ? proxyRect.top : state.startRect.top) - state.startRect.top;
      const x = clampValue(state.baseX + (dx * state.distanceX) / state.pageWidth, -1.5, 1.5);
      const y = clampValue(state.baseY + (dy * state.distanceY) / state.pageHeight, -1.5, 1.5);
      draft.offsets[state.key] = { x, y };
      applyOffset(state.element, { x, y });
    }

    selectElement(state.element);
    markEditorDirty(movedPage ? "已移到另一页 · 未保存" : "位置已调整 · 未保存");
    setEditTip(movedPage
      ? "已移到另一页 · 可继续拖动或按 Delete 删除"
      : "位置已调整 · 拖动可继续移动");
  }

  function cancelEditorDrag(event) {
    if (!dragState) return;
    const state = dragState;
    dragState = null;
    removeDragProxy(state);
    try {
      state.element.releasePointerCapture(state.pointerId);
    } catch (error) {
      /* already released */
    }
  }

  function clearEditorText(key) {
    const state = ensureEditorDraft();
    if (!state.texts[key]) return;
    delete state.texts[key];
  }

  function enterEditMode() {
    if (!collection || !bookElement) {
      setEditStatus("数据加载中…", "error");
      return;
    }
    if (document.body.classList.contains("is-editing")) return;
    closeDesignDrawer();
    ensureEditorDraft();
    document.body.classList.add("is-editing");
    if (editBar) {
      editBar.classList.add("is-open");
      editBar.setAttribute("aria-hidden", "false");
    }
    if (editBtn) {
      editBtn.setAttribute("aria-pressed", "true");
      editBtn.textContent = "✓ 完成编辑";
    }
    editDirty = editorHasChanges();
    editHistory = [];
    if (editUndo) editUndo.disabled = true;
    if (editSave) editSave.disabled = false;
    if (editDelete) editDelete.disabled = true;
    toggleOrnamentPanel(false);
    setEditStatus(editDirty ? "有未保存修改" : "未保存");
    setEditTip("点击选中文字或图案 · 双击改写 · 拖动移动 · ＋装饰 添加图案");
    selectElement(null);
    window.requestAnimationFrame(applyEditorOffsets);
    window.setTimeout(applyEditorOffsets, 320);
  }

  function exitEditMode() {
    if (!document.body.classList.contains("is-editing")) return;
    bookElement.querySelectorAll("[contenteditable='true']").forEach((element) => finishTextEdit(element));
    selectElement(null);
    toggleOrnamentPanel(false);
    document.body.classList.remove("is-editing");
    if (editBar) {
      editBar.classList.remove("is-open");
      editBar.setAttribute("aria-hidden", "true");
    }
    if (editBtn) {
      editBtn.setAttribute("aria-pressed", "false");
      editBtn.textContent = "✏️ 编辑版面";
    }
    applyEditorOffsets();
    fitTextBlocks();
  }

  async function saveEditChanges() {
    if (!editSave || editSave.disabled) return;
    editSave.disabled = true;
    setEditStatus("保存中…");
    try {
      ensureEditorDraft();
      await persistBookSettings();
      editDirty = false;
      editHistory = [];
      if (editUndo) editUndo.disabled = true;
      const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setEditStatus("已保存 · " + time, "saved");
      setDesignStatus("已保存 · " + time, "saved");
    } catch (error) {
      setEditStatus("保存失败：" + error.message, "error");
    } finally {
      editSave.disabled = false;
    }
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      if (document.body.classList.contains("is-editing")) exitEditMode();
      else enterEditMode();
    });
  }
  if (editDone) editDone.addEventListener("click", exitEditMode);
  if (editSave) editSave.addEventListener("click", saveEditChanges);
  if (editUndo) editUndo.addEventListener("click", undoEditor);
  if (editReset) editReset.addEventListener("click", resetEditorTargets);
  if (editDelete) editDelete.addEventListener("click", deleteSelectedOrnament);
  if (editOrnamentBtn) editOrnamentBtn.addEventListener("click", () => toggleOrnamentPanel());
  if (editOrnamentClose) editOrnamentClose.addEventListener("click", () => toggleOrnamentPanel(false));
  if (decorRotate) {
    decorRotate.addEventListener("input", () => applyDecorTransform({ r: Number(decorRotate.value) }));
  }
  if (decorScale) {
    decorScale.addEventListener("input", () => applyDecorTransform({ s: Number(decorScale.value) / 100 }));
  }
  if (decorReset) decorReset.addEventListener("click", resetDecorTransform);
  [decorRotate, decorScale].forEach((input) => {
    if (!input) return;
    input.addEventListener("pointerup", () => { transformHistoryActive = false; });
    input.addEventListener("blur", () => { transformHistoryActive = false; });
  });
  if (editUndo) editUndo.disabled = true;
  buildOrnamentPalette();

  if (bookElement) {
    bookElement.addEventListener("input", (event) => {
      const element = event.target && event.target.closest
        ? event.target.closest("[data-edit]")
        : null;
      if (!element || !element.isContentEditable) return;
      const key = element.getAttribute("data-edit");
      ensureEditorDraft().texts[key] = { html: normaliseEditableHtml(element.innerHTML) };
      refreshTocLabels();
      markEditorDirty("改写中 · 未保存");
    });

    bookElement.addEventListener("keydown", (event) => {
      const element = event.target && event.target.closest
        ? event.target.closest("[data-edit]")
        : null;
      if (!element || !element.isContentEditable) return;
      if (event.key === "Enter") {
        event.preventDefault();
        if (!document.execCommand("insertLineBreak")) {
          document.execCommand("insertHTML", false, "<br>");
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        element.blur();
      }
    });

    bookElement.addEventListener("focusout", (event) => {
      const element = event.target && event.target.closest
        ? event.target.closest("[data-edit]")
        : null;
      if (!element || !element.isContentEditable) return;
      window.setTimeout(() => {
        if (document.activeElement === element) return;
        finishTextEdit(element);
      }, 0);
    });

    bookElement.addEventListener("paste", (event) => {
      const element = event.target && event.target.closest
        ? event.target.closest("[data-edit]")
        : null;
      if (!element || !element.isContentEditable) return;
      event.preventDefault();
      const text = (event.clipboardData && event.clipboardData.getData("text/plain")) || "";
      const html = text.split(/\r?\n/).map((line) => escapeHtml(line)).join("<br>");
      document.execCommand("insertHTML", false, html);
    });

    bookElement.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("is-editing")) return;
      if (event.target.closest("[data-edit], [data-decor]")) return;
      selectElement(null);
    });
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(offsetTimer);
    offsetTimer = window.setTimeout(applyEditorOffsets, 320);
  });

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("is-editing")) return;
    const typing = document.activeElement && document.activeElement.isContentEditable;
    if (event.key === "Escape") {
      if (typing) return;
      event.preventDefault();
      if (editBar && editBar.classList.contains("show-ornaments")) {
        toggleOrnamentPanel(false);
        return;
      }
      if (selectedElement) selectElement(null);
      else exitEditMode();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !typing) {
      event.preventDefault();
      undoEditor();
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && !typing &&
        selectedElement && selectedElement.hasAttribute("data-ornament")) {
      event.preventDefault();
      deleteSelectedOrnament();
      return;
    }
    if (event.key === "Enter" && !typing && selectedElement && selectedElement.hasAttribute("data-edit")) {
      event.preventDefault();
      enterTextEdit(selectedElement);
    }
  });



  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !designDrawer) return;
    if (!designDrawer.classList.contains("is-open")) return;
    event.preventDefault();
    closeDesignDrawer();
  });

  const watchSavedData = () => {
    try {
      const channel = new BroadcastChannel("glimpse-portfolio");
      channel.addEventListener("message", (event) => {
        if (event.data && event.data.type === "saved") {
          if (event.data.source === "book") return;
          window.location.reload();
        }
      });
    } catch (error) {
      /* older browsers simply keep the current proof until a manual reload */
    }
  };

  watchSavedData();
  init();
})();
