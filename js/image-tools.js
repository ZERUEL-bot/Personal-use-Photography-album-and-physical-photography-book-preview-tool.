/* Photo_Project_PWA — 前端图片压缩
 * 选图后在本机用 Canvas 缩放并编码为 WebP（不支持时退回 JPEG），
 * 返回可直接写入 IndexedDB 的 Base64 字符串。
 */
(() => {
  "use strict";

  const MAX_EDGE = 2000;
  const QUALITY = 0.82;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("无法读取该图片"));
      };
      image.src = url;
    });

  const titleFromName = (name) =>
    String(name || "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase()) || "Untitled";

  const compress = async (file) => {
    if (!file) throw new Error("没有选择文件");
    if (!/^image\//.test(file.type || "")) throw new Error("不是图片文件");
    if (file.size > MAX_FILE_BYTES) throw new Error("文件超过 50 MB");

    const image = await loadImage(file);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) throw new Error("图片尺寸无效");

    const scale = Math.min(1, MAX_EDGE / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法创建画布");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL("image/webp", QUALITY);
    } catch (error) {
      dataUrl = "";
    }
    if (!/^data:image\/webp/i.test(dataUrl)) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    }
    if (!/^data:image\//i.test(dataUrl)) throw new Error("图片编码失败");

    return {
      name: file.name || "image",
      dataUrl,
      width,
      height,
      orientation: height > width ? "portrait" : "landscape",
      bytes: Math.round((dataUrl.length * 3) / 4)
    };
  };

  window.ImageTools = { compress, titleFromName, MAX_EDGE, MAX_FILE_BYTES };
})();
