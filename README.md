# Photo_Project_PWA

纯静态的摄影作品集 PWA：**没有服务器、没有构建步骤**。作品文字与照片全部保存在当前浏览器的 IndexedDB 中，每个浏览器 / 设备各自独立。

## 本地预览

直接双击 `index.html` 不可用：`file://` 下浏览器会限制 IndexedDB、默认数据读取与 Service Worker。请用任意静态服务器打开：

- **VS Code Live Server**：右键 `index.html` → *Open with Live Server* → 打开 `http://127.0.0.1:5500/`
- 或命令行：

```powershell
cd C:\Users\zzw\Desktop\Photo_Project_PWA
py -3 -m http.server 5500
# 浏览器访问 http://127.0.0.1:5500/
```

## PWA 与离线

- `manifest.json`：应用名「我的摄影集 · A Glimpse of Trees」、独立窗口显示、主题/背景色 `#0f0f0f`、192/512 图标。
- `service-worker.js`：预缓存 HTML、CSS、JS、本地字体、内置示例图片与默认数据，并包含 `02-Print-Preview` 的页面与资源；导航请求网络优先并回退到对应页面缓存，静态资源缓存优先并后台更新。
- 断网后可打开画廊与实体书、浏览默认作品与已缓存的字体/图片；作品数据来自 IndexedDB，本地编辑照常可用。
- 修改静态文件后部署：更新 `service-worker.js` 里的 `CACHE_NAME`（如 `photo-pwa-v3`）以触发客户端更新。

## 实体书预览（02-Print-Preview）

- 入口：画廊右上角「实体书 ↗」或管理员栏「预览实体书 ↗」。
- 与画廊共用同一个 IndexedDB（库 `photo-project-pwa`、对象仓 `portfolio`、键 `current`）；画廊保存后会通过 BroadcastChannel 通知已打开的实体书自动刷新。
- 实体书内的「书籍设计」与「编辑版面」直接写回同一份数据（`book_settings`）；画廊保存时会合并最新的 `book_settings` / `book_afterword`，不会覆盖实体书改动。
- 编辑版面：文字与照片（整幅）均可拖动；选中元素所在页在编辑模式下取消裁切，可骑页跨过书脊显示；页面提供居中/版心辅助线，拖动在 8px 内自动吸附。
- 「🗂 总览」按页列出所有文字与照片，可直接用下拉框改到其它页、跳转到该页或选中元素，并可一键打开「书籍设计」继续调整封面、纸张、字体等排版。
- 封面/配图上传改为前端压缩成 Base64 存入 IndexedDB；「导出印刷 PDF」打开 `print.html?print=1` 并调用浏览器打印，可另存为 PDF。

## 数据与备份

- 唯一数据源：IndexedDB 数据库 `photo-project-pwa`（对象仓 `portfolio`，键 `current`）。
- 首次打开且数据库为空时，读取 `./data/default-portfolio.json` 作为默认作品集并写入数据库；读取失败时使用内置空结构。
- 管理员模式顶部有醒目的红色警告条，并提供：
  - **📦 导出备份**：把完整数据（含 Base64 照片）打包为 `portfolio-backup-YYYYMMDD-HHmm.json` 下载；
  - **📥 导入备份**：选择 JSON 后覆盖当前设备上的全部数据。
- 清理浏览器缓存、无痕模式、更换设备都会导致数据永久丢失，请定期导出并把 JSON 存放在其它位置。

## 图片上传

「＋ 添加新照片」支持从本机多选图片：前端用 Canvas 压缩（长边 ≤ 2000px、WebP 质量 0.82，不支持 WebP 时退回 JPEG），单张上限 50 MB，转成 Base64 后随作品数据一起写入 IndexedDB；也可以勾选 `assets/images/` 中的内置示例图片。

## 分组管理

- 「＋ 添加新照片」弹窗内可「＋ 新建分组」，导入时直接落到新章节。
- 管理员面板「分组管理」支持：新增、重命名（中/英文名与描述）、上移/下移或拖动排序、删除（照片自动并入第一个分组）。
- Chapter 01、02… 与照片编号 `[ 01 ]` 随分组顺序和归属自动重排；照片卡片上的「分组」下拉框可精确换组，原有的跨组拖拽仍然可用。
- 拖动照片时用鼠标滚轮上下滚动页面（不自动滚动，避免抽动）；拖入其它章节的照片区域时该章节高亮，松手即换组，其它照片自动让位。

## 自由排版

- 管理员面板「自由排版」：拖动每张照片右上角 ⠿ 自由移动，拖动右下角圆点调整宽度；位置按分组画布保存，访客看到相同排版。
- 选中照片后底部滑杆可旋转（−180°～180°）与缩放（40%～200%），只作用于卡片，不影响大图查看；「清除排版」恢复默认并删除旋转缩放。
- 「排版总览」以缩小比例展示全部章节，可拖拽、调宽、旋转缩放，适合整体调整布局；把缩略图拖到其它章节画布即可直接换组，空章节也能接收。
- 自由排版与分组、编号、导出/导入备份完全兼容（`photo.layout`、`photo.transform` 随数据保存）。

## 目录

```text
index.html                 入口
manifest.json              PWA 应用信息与图标
service-worker.js          离线缓存
css/style.css              样式
js/main.js                 作品集与管理面板
js/storage.js              IndexedDB 封装
js/image-tools.js          Canvas 压缩 / WebP / Base64
js/pwa.js                  Service Worker 注册
lib/                       Quill、SortableJS（本地文件，无 CDN）
assets/images/             内置示例图片 + manifest.json
assets/fonts/ …            本地字体与纹理
assets/icons/              192 / 512 / 180 应用图标
02-Print-Preview/          实体书 3D 预览、书籍设计、编辑版面、打印视图
data/default-portfolio.json 首次运行的默认数据
```

## 部署（GitHub + 腾讯云 EdgeOne Pages）

本项目为纯静态 PWA，**无需构建步骤、无 npm 依赖**，仓库根目录即发布目录。

1. 在 GitHub 新建空仓库（不要勾选 README / .gitignore / License）。
2. 按仓库页提示推送本目录（`git remote add origin …`、`git push -u origin main`）。
3. 登录腾讯云 EdgeOne Pages → 新建项目 → 关联 GitHub 仓库。
4. 构建设置：构建命令留空，输出目录填 `/`（或 `.`）；框架预设选“静态/无框架”。
5. 部署完成后访问分配的域名，`index.html`、`manifest.json`、`service-worker.js` 与 `02-Print-Preview/` 均从站点根路径加载。

> 更新内容后：提高 `service-worker.js` 的 `CACHE_NAME` 版本号再推送，访客下次打开会自动更新缓存。

## 说明

旧版的 `02-Print-Preview`（实体书 3D 预览与印刷 PDF）依赖 Node 服务与 Edge 无头导出，不属于纯静态 PWA，本次未迁移；原版仍完整保留在 `C:\Users\zzw\Desktop\Photo_Project`。
