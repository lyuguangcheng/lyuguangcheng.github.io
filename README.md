# lvguangcheng.github.io

个人网站：原生 HTML / CSS / JS 手写，无框架、无构建步骤，内容放在 Markdown 里。

## 文件结构

| 路径 | 作用 |
| --- | --- |
| `index.html` | 页面骨架（导航、内容容器、页脚） |
| `styles.css` | 全部样式，含明暗主题变量 |
| `app.js` | 路由、内容加载、视图渲染、主题与语言切换 |
| `content/*.md` | 站点内容（首页简历、项目、随笔等） |
| `content-bundle.js` | **自动生成**，把 `content/*.md` 内嵌成 JS |
| `build-content.ps1` | 生成 `content-bundle.js` 的脚本 |
| `images/` | 头像、封面、图标 |

## 改内容后必须重建 bundle

首页和其他页面**优先读取 `content-bundle.js` 里内嵌的内容**，而不是直接 `fetch` 那些 `.md`
文件。这样才能在没有服务器的 `file://` 环境下双击 `index.html` 也正常显示。

所以：**改完 `content/` 下的 Markdown，一定要重跑一次生成脚本，否则页面不会更新。**

```powershell
powershell -ExecutionPolicy Bypass -File build-content.ps1
```

脚本会读取 `content/` 下所有 `.md`（按文件名排序）写入 `content-bundle.js`。
如果是在看线上站点，重建后还要提交并推送：

```powershell
git add content-bundle.js content
git commit -m "更新内容"
git push
```

## 中英文双语

导航栏右侧的 `EN` / `中` 按钮切换整站语言，选择会记在 `localStorage` 的 `lgc-lang`；
首次访问按浏览器语言自动判断（中文环境默认中文）。

**每种语言一个文件**，靠文件名后缀区分：

| 语言 | 文件名 |
| --- | --- |
| 中文 | `content/home.md`、`content/post1.md` … |
| 英文 | `content/home.en.md`、`content/post1.en.md` … |

加载规则见 `app.js` 的 `contentPath()` / `loadMarkdown()`：

- 中文模式读 `xxx.md`；
- 英文模式读 `xxx.en.md`；
- **英文版缺失时会自动回退到中文原文**（页面不会报错，但会看到中文）。

因此**新增或修改内容时，最好两个文件一起改**，否则切到英文会看到中文回退。

当前双语状态：

| 内容 | 中文 | 英文 |
| --- | --- | --- |
| 首页简历 | `home.md` | `home.en.md` |
| 项目 | `projects.md` | `projects.en.md` |
| 随笔列表 | `story.md` | `story.en.md` |
| 随笔正文 | `post1–4.md` | `post1–4.en.md` |
| 关于 | `about.md` | `about.en.md` |

> 说明：`content/about.md` 目前没有挂入口（导航只保留「首页」），文件与样式保留备用。

## 本地预览

任选其一：

- 直接双击 `index.html`（依赖 `content-bundle.js` 的内嵌内容）；
- 或起一个静态服务器，例如 `python -m http.server 8000`，再访问 `http://127.0.0.1:8000/`。
