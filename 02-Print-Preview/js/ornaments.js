/* A Glimpse of Trees — shared decorative presets for the 3D proof and the print PDF.
   Loaded before js/main.js and js/print.js. No dependencies, no runtime requests.
   Each preset stores a base width at the 540px design page; both renderers size it
   as a page-width ratio so the proof and the PDF stay proportional. */
(() => {
  "use strict";

  const presets = {
    branch: {
      label: "枝叶",
      width: 92,
      svg: '<svg viewBox="0 0 96 64" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 58C30 50 54 34 86 8"/><path d="M28 48c2-8 8-13 16-15"/><path d="M44 40c0-7 4-12 11-15"/><path d="M60 30c-1-6 2-11 8-14"/><path d="M34 46c8 2 13 6 15 13"/><path d="M50 36c7 1 12 5 15 11"/><path d="M66 25c6 0 11 3 14 8"/></svg>'
    },
    leaf: {
      label: "单叶",
      width: 38,
      svg: '<svg viewBox="0 0 40 56" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4C8 16 6 36 20 52c14-16 12-36 0-48Z"/><path d="M20 11v34"/><path d="M20 20l-6-5M20 28l6-5M20 36l-6-5"/></svg>'
    },
    fern: {
      label: "蕨叶",
      width: 40,
      svg: '<svg viewBox="0 0 40 64" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M20 61V5"/><path d="M20 14c-6-2-9-6-9-10M20 14c6-2 9-6 9-10"/><path d="M20 24c-7-1-11-4-12-8M20 24c7-1 11-4 12-8"/><path d="M20 34c-8 0-13-3-15-7M20 34c8 0 13-3 15-7"/><path d="M20 44c-7 0-11-2-13-6M20 44c7 0 11-2 13-6"/><path d="M20 54c-6 0-10-2-11-5M20 54c6 0 10-2 11-5"/></svg>'
    },
    ring: {
      label: "圆环",
      width: 34,
      svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none"/><path d="M24 2v5M24 41v5M2 24h5M41 24h5"/></svg>'
    },
    spark: {
      label: "星点",
      width: 30,
      svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"><path d="M24 6c1.5 8 4 12 12 14-8 2-10.5 6-12 14-1.5-8-4-12-12-14 8-2 10.5-6 12-14Z"/><path d="M38 32c.7 3.5 2 5.5 5.5 6.5-3.5 1-4.8 2.5-5.5 6-.7-3.5-2-5-5.5-6 3.5-1 4.8-3 5.5-6.5Z"/><circle cx="11" cy="34" r="1.3" fill="currentColor" stroke="none"/></svg>'
    },
    wave: {
      label: "水波",
      width: 66,
      svg: '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M4 12c6-6 12-6 18 0s12 6 18 0 12-6 20 0"/><path d="M4 22c6-6 12-6 18 0s12 6 18 0 12-6 20 0"/><path d="M4 32c6-6 12-6 18 0s12 6 18 0 12-6 20 0"/></svg>'
    },
    tree: {
      label: "树影",
      width: 42,
      svg: '<svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5c-6 8-9 13-9 18 0 4 3 7 9 8 6-1 9-4 9-8 0-5-3-10-9-18Z"/><path d="M24 23c-8 6-12 11-12 16 0 4 4 7 12 8 8-1 12-4 12-8 0-5-4-10-12-16Z"/><path d="M24 46v12M18 58h12"/></svg>'
    },
    rule: {
      label: "细线",
      width: 86,
      svg: '<svg viewBox="0 0 96 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h31M61 8h31M4 16h31M61 16h31"/><path d="M48 2l4.5 10L48 22l-4.5-10L48 2Z"/></svg>'
    }
  };

  window.GlimpseOrnaments = {
    presets,
    types: new Set(Object.keys(presets))
  };
})();
