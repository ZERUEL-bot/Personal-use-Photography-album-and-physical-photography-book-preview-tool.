/* A Glimpse of Trees — print-ready PDF layout */
(() => {
  "use strict";

  const SEED_URL = "../data/default-portfolio.json";
  const IMAGE_BASE = "../assets/images/";
  const PLACEHOLDER_IMAGE = IMAGE_BASE + "_placeholder.svg";

  const isInlineImage = (value) => /^(data:|blob:|https?:)/i.test(String(value || ""));
  const imageUrl = (file) => {
    const value = String(file || "");
    if (!value) return PLACEHOLDER_IMAGE;
    if (isInlineImage(value)) return value;
    return IMAGE_BASE + value.replace(/^\.?\/?assets\/images\//, "");
  };
  const sheetsRoot = document.getElementById("sheets");

  const ORNAMENT_PRESETS =
    (window.GlimpseOrnaments && window.GlimpseOrnaments.presets) || {};
  const ORNAMENT_TYPES = new Set(Object.keys(ORNAMENT_PRESETS));
  const EDIT_KEY_PATTERN = /^[a-z0-9:_.-]{1,140}$/i;

  const pad = (value) => String(value).padStart(2, "0");

  const TEXTURE_URL = 'url("../assets/textures/paper-noise.png")';

  const TEXTURES = {
    none: { image: "none", size: "24mm 24mm" },
    light: { image: TEXTURE_URL, size: "24mm 24mm" },
    strong: { image: TEXTURE_URL + ", " + TEXTURE_URL, size: "22mm 22mm, 18mm 18mm" }
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

  const resolveLocalAsset = (value) => {
    let path = String(value == null ? "" : value).trim().replace(/\\/g, "/");
    if (!path || /^(https?:|data:|\/\/)/i.test(path)) return "";
    if (/^[a-z]:\//i.test(path)) return "";
    path = path.replace(/["'()\r\n]/g, "");
    path = path.replace(/^\.?\//, "");
    while (path.startsWith("../")) path = path.slice(3);
    return path ? "/" + path : "";
  };

  const coverImageValue = (value) => {
    const raw = String(value == null ? "" : value).trim();
    if (/^data:image\//i.test(raw)) return 'url("' + raw + '")';
    const path = resolveLocalAsset(value);
    return path ? 'url("' + path + '")' : "none";
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

  const readPrintDesign = (raw) => {
    const saved = raw && raw.book_settings && typeof raw.book_settings === "object"
      ? raw.book_settings
      : null;
    if (!saved) return null;
    const pdf = saved.pdf && typeof saved.pdf === "object" ? saved.pdf : {};
    const enabled = pdf.sync === true || pdf.sync === "true" || pdf.sync === 1 || pdf.sync === "1";
    if (!enabled) return null;

    const meta = raw.meta && typeof raw.meta === "object" ? raw.meta : {};
    const cover = saved.cover && typeof saved.cover === "object" ? saved.cover : {};
    const paper = saved.paper && typeof saved.paper === "object" ? saved.paper : {};
    const type = saved.type && typeof saved.type === "object" ? saved.type : {};

    return {
      cover: {
        title: stringValue(cover.title, "") || stringValue(meta.title, "A Glimpse of Trees"),
        subtitle: cover.subtitle == null ? "" : stringValue(cover.subtitle),
        author: cover.author == null ? "" : stringValue(cover.author),
        kicker: cover.kicker == null ? "Photographs" : stringValue(cover.kicker),
        color: pickHex(cover.color, "#1d2a22"),
        image: stringValue(cover.image, ""),
        photo: stringValue(cover.photo, stringValue(meta.cover_photo, "")),
        photo_custom: stringValue(cover.photo_custom, ""),
        layout: pickOption(cover.layout, ["framed", "full", "text"], "framed")
      },
      paper: {
        color: pickHex(paper.color, "#f5f2eb"),
        texture: pickOption(paper.texture, Object.keys(TEXTURES), "light")
      },
      type: {
        heading: pickOption(type.heading, Object.keys(FONT_STACKS.heading), "playfair"),
        body: pickOption(type.body, Object.keys(FONT_STACKS.body), "inter")
      },
      editor: readPrintEditor(saved.editor)
    };
  };

  const applyPrintDesign = (settings) => {
    if (!settings) return;
    const root = document.documentElement;
    const texture = TEXTURES[settings.paper.texture] || TEXTURES.light;

    root.dataset.designSync = "true";
    root.style.setProperty("--paper", settings.paper.color);
    root.style.setProperty("--font-heading", FONT_STACKS.heading[settings.type.heading]);
    root.style.setProperty("--font-body", FONT_STACKS.body[settings.type.body]);
    root.style.setProperty("--cover-bg", settings.cover.color);
    root.style.setProperty("--cover-image", coverImageValue(settings.cover.image));
    root.style.setProperty("--paper-texture", texture.image);
    root.style.setProperty("--paper-texture-size", texture.size);
  };

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

  const bookFileFor = (file) =>
    String(file || "").replace(/-2000\.(webp|jpe?g|png|avif)$/i, "-1000.$1");

  function readPrintEditor(raw) {
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
  }

  const normaliseData = (raw) => {
    const data = raw && typeof raw === "object" ? raw : {};
    data.meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    data.groups = Array.isArray(data.groups) && data.groups.length
      ? data.groups
      : [{ id: "all", label: "全部作品", label_en: "All plates", description: "" }];
    data.photos = Array.isArray(data.photos) ? data.photos : [];
    data.book_afterword = data.book_afterword && typeof data.book_afterword === "object"
      ? data.book_afterword
      : { title: "", body: "", signature: "" };
    if (data.book_afterword.body == null) data.book_afterword.body = "";

    const groupIds = new Set(data.groups.map((group) => group.id));
    data.groups.forEach((group, index) => {
      if (!group.id) group.id = "group-" + (index + 1);
      if (!group.label) group.label = group.label_en || group.id;
      if (!group.label_en) group.label_en = "";
      if (!group.description) group.description = "";
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

  const fetchData = async () => {
    try {
      if (window.PortfolioStore) {
        const stored = await window.PortfolioStore.read();
        if (stored && Array.isArray(stored.photos)) return stored;
      }
    } catch (error) {
      /* fall back to the seed copy */
    }
    try {
      const response = await fetch(SEED_URL, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (payload && Array.isArray(payload.photos)) return payload;
      }
    } catch (error) {
      /* no data available */
    }
    return null;
  };

  const sideFor = (index) => (index % 2 === 0 ? "sheet--right" : "sheet--left");

  const cropMarks = ["tl-h", "tl-v", "tr-h", "tr-v", "bl-h", "bl-v", "br-h", "br-v"]
    .map((name) => `<span class="crop crop--${name}"></span>`)
    .join("");

  const photoImg = (photo) =>
    `<img src="${imageUrl(photo.file)}" data-fallback="${imageUrl(photo.book_file)}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}">`;

  const buildSheets = (data, settings) => {
    const sheets = [];
    const photos = data.photos;
    const meta = data.meta;
    const coverPhoto =
      photos.find((photo) => photo.id === (settings ? settings.cover.photo : meta.cover_photo)) ||
      photos.find((photo) => photo.id === meta.cover_photo) ||
      photos.find((photo) => photo.orientation === "portrait") ||
      photos[0];

    const rawTitle = settings ? settings.cover.title : String(meta.title || "A Glimpse of Trees");
    const coverTitle = titleMarkup(rawTitle);
    const rawCover = settings ? String(settings.cover.photo_custom || "").trim() : "";
    const coverCustom = /^data:image\//i.test(rawCover)
      ? rawCover
      : settings
        ? resolveLocalAsset(rawCover)
        : "";
    const coverLayout = settings ? settings.cover.layout : "framed";
    const coverKicker = settings ? settings.cover.kicker : "Photographs";
    const coverImg = coverCustom
      ? `<img src="${coverCustom}" alt="${escapeHtml(rawTitle)}">`
      : photoImg(coverPhoto);

    const photoNumber = new Map();
    photos.forEach((photo, index) => photoNumber.set(photo.id, index + 1));

    const chapterGroups = data.groups.filter((group) =>
      photos.some((photo) => photo.group === group.id)
    );

    const plan = [];
    chapterGroups.forEach((group) => {
      const items = photos.filter((photo) => photo.group === group.id);
      plan.push({ group, items, startPlate: photoNumber.get(items[0].id) });
    });

    const wrap = (html, options = {}) => {
      const side = options.side || sideFor(sheets.length);
      const extra = options.extra ? " " + options.extra : "";
      const pageKey = options.pageKey
        ? ` data-page-key="${escapeHtml(options.pageKey)}"`
        : "";
      const folio = options.folio ? `<span class="sheet-folio">${options.folio}</span>` : "";
      return `<section class="sheet ${side}${extra}"${pageKey}>${cropMarks}${html}${folio}</section>`;
    };

    /* 0 — front cover ----------------------------------------------------- */
    sheets.push(wrap(`
      ${coverLayout === "full" ? `<div class="cover-fullbleed">${coverImg}</div><div class="cover-shade"></div>` : ""}
      <div class="cover-frame"></div>
      <div class="cover-inner cover-inner--${coverLayout}">
        <p class="cover-kicker" data-edit="t:cover:kicker">${escapeHtml(coverKicker)}</p>
        ${coverLayout === "framed" ? `<div class="cover-plate" data-decor="d:cover:plate">${coverImg}</div>` : ""}
        <h1 class="cover-title" data-edit="t:cover:title">${coverTitle}</h1>
        ${settings ? `<p class="cover-subtitle" data-edit="t:cover:subtitle">${escapeHtml(settings.cover.subtitle)}</p>` : ""}
        <p class="cover-foot"><span class="cover-author" data-edit="t:cover:author">${settings ? escapeHtml(settings.cover.author) : ""}</span><span class="cover-foot-meta">Vol. I &nbsp;·&nbsp; ${escapeHtml(meta.year || "2026")}</span></p>
      </div>
    `, { extra: "sheet--cover", pageKey: "cover" }));

    /* 1 — inside front ---------------------------------------------------- */
    sheets.push(wrap(`
      <div class="sheet-inner">
        <div class="text-page">
          <p class="smallcaps" data-edit="t:inside:kicker">${escapeHtml(rawTitle)}</p>
          <h2 class="text-title" data-edit="t:inside:title">Notes<br>on light</h2>
          <p class="text-body" data-edit="t:inside:body">
            ${photos.length} frames made on film between early spring and late autumn.
            Left uncropped, and coloured as the emulsion recorded it.
          </p>
          <span class="text-mark" data-decor="d:inside:mark" aria-hidden="true"></span>
          <p class="imprint" data-edit="t:inside:imprint">Proof copy<br>Not for sale</p>
        </div>
      </div>
    `, { side: "sheet--left", pageKey: "inside" }));

    /* 2 — contents -------------------------------------------------------- */
    sheets.push(wrap(`
      <div class="sheet-inner">
        <div class="toc-page">
          <p class="smallcaps" data-edit="t:toc:kicker">Contents</p>
          <h2 class="toc-title" data-edit="t:toc:title">Chapters</h2>
          <ol class="toc-list">
            ${plan.map((entry, index) => `
              <li class="toc-entry">
                <div class="toc-row">
                  <span class="toc-number">${pad(index + 1)}</span>
                  <span class="toc-label" data-toc-group="${escapeHtml(entry.group.id)}">${escapeHtml(entry.group.label)}<em>${escapeHtml(entry.group.label_en || "")}</em></span>
                  <span class="toc-plate">Plate ${pad(entry.startPlate)}</span>
                </div>
              </li>
            `).join("")}
          </ol>
          <p class="toc-note" data-edit="t:toc:note">Trim 240 × 320 mm · Bleed 3 mm · Crop marks</p>
        </div>
      </div>
    `, { side: "sheet--right", folio: "03", pageKey: "toc" }));

    /* 3… — chapters + plates --------------------------------------------- */
    plan.forEach((entry, chapterIndex) => {
      const pageIndex = sheets.length;
      const chapterKey = escapeHtml(entry.group.id);
      sheets.push(wrap(`
        <div class="sheet-inner">
          <div class="chapter-page">
            <p class="chapter-index" data-edit="t:chapter:${chapterKey}:index">Chapter ${pad(chapterIndex + 1)}</p>
            <h2 class="chapter-title" data-edit="t:chapter:${chapterKey}:title">${escapeHtml(entry.group.label)}</h2>
            <p class="chapter-title-en" data-edit="t:chapter:${chapterKey}:titleEn">${escapeHtml(entry.group.label_en || "")}</p>
            <span class="chapter-rule" data-decor="d:chapter:${chapterKey}:rule" aria-hidden="true"></span>
            <p class="chapter-desc" data-edit="t:chapter:${chapterKey}:desc">${escapeHtml(entry.group.description || "")}</p>
            <p class="chapter-count" data-edit="t:chapter:${chapterKey}:count">${entry.items.length} plates</p>
          </div>
        </div>
      `, { folio: pad(pageIndex + 1), pageKey: "chapter:" + entry.group.id }));

      entry.items.forEach((photo) => {
        const plateNo = photoNumber.get(photo.id);
        const photoKey = escapeHtml(photo.id);
        const essay = photo.essay
          ? photo.essay
          : `<p>${escapeHtml(photo.note)}</p>`;

        sheets.push(wrap(`
          <div class="sheet-inner">
            <div class="plate-page">
              <div class="plate-frame">${photoImg(photo)}</div>
              <div class="plate-meta">
                <p class="plate-label" data-edit="t:photo:${photoKey}:label">Plate ${pad(plateNo)} · ${escapeHtml(entry.group.label)}</p>
                <h2 class="plate-title" data-edit="t:photo:${photoKey}:title">${escapeHtml(photo.title)}</h2>
              </div>
              <div class="plate-essay" data-edit="t:photo:${photoKey}:essay">${essay}</div>
            </div>
          </div>
        `, { folio: pad(plateNo), pageKey: "photo:" + photo.id }));
      });
    });

    /* Afterword ----------------------------------------------------------- */
    const afterword = data.book_afterword;
    const afterwordIndex = sheets.length;
    sheets.push(wrap(`
      <div class="sheet-inner">
        <div class="afterword-page">
          <p class="smallcaps" data-edit="t:afterword:kicker">Afterword</p>
          <h2 class="afterword-title" data-edit="t:afterword:title">${escapeHtml(afterword.title || "关于这本影集")}</h2>
          <div class="afterword-body" data-edit="t:afterword:body">${essayHtml(afterword.body)}</div>
          <p class="afterword-signature" data-edit="t:afterword:signature">${escapeHtml(afterword.signature || "")}</p>
        </div>
      </div>
    `, { folio: pad(afterwordIndex + 1), pageKey: "afterword" }));

    /* Colophon ------------------------------------------------------------ */
    const closingIndex = sheets.length;
    sheets.push(wrap(`
      <div class="sheet-inner">
        <div class="text-page">
          <p class="smallcaps" data-edit="t:closing:kicker">Colophon</p>
          <h2 class="text-title" data-edit="t:closing:title">Made slowly,<br>in natural light.</h2>
          <p class="text-body" data-edit="t:closing:body">
            Photographed on 35mm and medium format film. Scanned, sequenced and
            proofed as a clothbound volume — a small record of weather, water
            and trees.
          </p>
          <span class="text-mark" data-decor="d:closing:mark" aria-hidden="true"></span>
          <p class="imprint" data-edit="t:closing:imprint">${escapeHtml(rawTitle)}<br>Proof edition · ${escapeHtml(meta.year || "2026")}</p>
        </div>
      </div>
    `, { folio: pad(closingIndex + 1), pageKey: "closing" }));

    /* Keep a physical, even page count. */
    if (sheets.length % 2 === 0) {
      sheets.push(wrap(`<div class="sheet-inner"></div>`, { pageKey: "blank" }));
    }

    /* Back cover ---------------------------------------------------------- */
    sheets.push(wrap(`
      <div class="back-inner">
        <span class="back-mark" data-decor="d:back:mark" aria-hidden="true"></span>
        <p class="back-title" data-edit="t:back:title">${escapeHtml(rawTitle)}</p>
        ${settings ? `<p class="back-blurb" data-edit="t:back:blurb">${escapeHtml(backBlurbFor(data))}</p><p class="back-author" data-edit="t:back:author">${escapeHtml(settings.cover.author)}</p>` : ""}
      </div>
    `, { extra: "sheet--back", side: "sheet--right", pageKey: "back" }));

    return sheets;
  };

  const waitImage = (image) =>
    new Promise((resolve) => {
      const cleanup = () => {
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
      };
      const onLoad = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        const fallback = image.dataset.fallback;
        if (fallback && image.dataset.tried !== "1") {
          image.dataset.tried = "1";
          image.src = fallback;
          waitImage(image).then(resolve);
          return;
        }
        if (image.dataset.placeholder !== "1") {
          image.dataset.placeholder = "1";
          image.src = PLACEHOLDER_IMAGE;
          const frame = image.closest(".plate-frame, .cover-plate");
          if (frame) frame.classList.add("is-fallback");
          waitImage(image).then(resolve);
          return;
        }
        resolve();
      };

      image.addEventListener("load", onLoad);
      image.addEventListener("error", onError);
      if (image.complete) {
        if (image.naturalWidth > 0) onLoad();
        else onError();
      }
    });

  const settleImages = () =>
    Promise.all(Array.from(sheetsRoot.querySelectorAll("img")).map(waitImage));

  const fitBlock = (element) => {
    element.style.fontSize = "";
    const computed = parseFloat(window.getComputedStyle(element).fontSize);
    let size = Number.isFinite(computed) ? computed : 11;
    let guard = 0;
    while (element.scrollHeight > element.clientHeight + 1 && size > 7.5 && guard < 80) {
      size -= 0.15;
      element.style.fontSize = size.toFixed(2) + "px";
      guard += 1;
    }
  };

  const fitBlocks = () => {
    sheetsRoot.querySelectorAll(".plate-essay, .afterword-body").forEach(fitBlock);
  };

  const plainTextFromHtml = (html) => {
    const holder = document.createElement("div");
    holder.innerHTML = String(html == null ? "" : html).replace(/<br\s*\/?>/gi, " ");
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
  };

  const applyEditorToPrint = (editor) => {
    if (!editor) return;
    const sheets = Array.from(sheetsRoot.querySelectorAll(".sheet"));
    if (!sheets.length) return;

    const layers = new Map();
    sheets.forEach((sheet) => {
      const layer = document.createElement("div");
      layer.className = "print-edit-layer";
      sheet.appendChild(layer);
      layers.set(sheet.getAttribute("data-page-key"), layer);
    });

    const sample = layers.values().next().value;
    const trimWidth = sample && sample.clientWidth ? sample.clientWidth : 240 * (96 / 25.4);
    const trimHeight = sample && sample.clientHeight ? sample.clientHeight : 320 * (96 / 25.4);

    sheetsRoot.querySelectorAll("[data-edit]").forEach((element) => {
      const override = editor.texts[element.getAttribute("data-edit")];
      if (override && typeof override.html === "string") element.innerHTML = override.html;
    });

    sheetsRoot.querySelectorAll("[data-toc-group]").forEach((label) => {
      const groupId = label.getAttribute("data-toc-group");
      const override = editor.texts["t:chapter:" + groupId + ":title"];
      if (!override) return;
      const node = Array.from(label.childNodes).find((child) => child.nodeType === 3);
      if (node) node.nodeValue = plainTextFromHtml(override.html);
    });

    sheetsRoot.querySelectorAll("[data-edit], [data-decor]").forEach((element) => {
      const key = element.getAttribute("data-edit") || element.getAttribute("data-decor");
      const placement = editor.placements[key];
      if (!placement) return;
      const layer = layers.get(placement.page);
      if (!layer) return;
      layer.appendChild(element);
      element.classList.add("print-detached");
      element.style.position = "absolute";
      element.style.left = (placement.x * 100).toFixed(4) + "%";
      element.style.top = (placement.y * 100).toFixed(4) + "%";
      element.style.width = (placement.w * 100).toFixed(4) + "%";
      element.style.margin = "0";
      element.style.translate = "";
    });

    sheetsRoot.querySelectorAll("[data-edit], [data-decor]").forEach((element) => {
      const key = element.getAttribute("data-edit") || element.getAttribute("data-decor");
      if (editor.placements[key]) {
        element.style.translate = "";
        return;
      }
      const offset = editor.offsets[key];
      if (!offset || (!offset.x && !offset.y)) {
        element.style.translate = "";
        return;
      }
      element.style.translate =
        (offset.x * trimWidth).toFixed(2) + "px " + (offset.y * trimHeight).toFixed(2) + "px";
    });

    editor.decorations.forEach((item) => {
      const preset = ORNAMENT_PRESETS[item.type];
      const layer = layers.get(item.page);
      if (!preset || !layer) return;
      const ornament = document.createElement("span");
      ornament.className = "print-ornament";
      ornament.setAttribute("data-decor", "d:orn:" + item.id);
      ornament.innerHTML = preset.svg;
      ornament.style.width = (preset.width * (trimWidth / 540)).toFixed(2) + "px";
      layer.appendChild(ornament);
      const offset = editor.offsets["d:orn:" + item.id] || { x: 0, y: 0 };
      ornament.style.translate =
        (offset.x * trimWidth).toFixed(2) + "px " + (offset.y * trimHeight).toFixed(2) + "px";
    });

    sheetsRoot.querySelectorAll("[data-decor]").forEach((element) => {
      const transform = editor.transforms[element.getAttribute("data-decor")];
      element.style.rotate = transform && transform.r ? transform.r + "deg" : "";
      element.style.scale = transform && transform.s && transform.s !== 1 ? String(transform.s) : "";
    });
  };

  const init = async () => {
    window.__PRINT_READY = false;
    const raw = await fetchData();
    if (!raw) throw new Error("数据读取失败：请确认浏览器已启用 IndexedDB 并刷新页面");
    const data = normaliseData(raw);
    if (!data.photos.length) throw new Error("本机作品集中没有照片，请先在画廊中添加内容");

    const settings = readPrintDesign(raw);
    applyPrintDesign(settings);
    window.__PRINT_DESIGN_SYNC = !!settings;

    sheetsRoot.innerHTML = buildSheets(data, settings).join("");
    applyEditorToPrint(settings ? settings.editor : null);
    await Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      settleImages()
    ]);
    fitBlocks();
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    window.__PRINT_READY = true;
    if (new URLSearchParams(location.search).has("print")) {
      window.setTimeout(() => window.print(), 350);
    }
  };

  init().catch((error) => {
    window.__PRINT_ERROR = error.message;
    if (sheetsRoot) {
      sheetsRoot.innerHTML = `<p style="font: 12px/1.6 Arial; padding: 20px;">${escapeHtml(error.message)}</p>`;
    }
    console.error(error);
  });
})();
