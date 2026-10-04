# lvguangcheng.github.io

吕广成的个人网站 · 纯静态 + 原生 JS（无框架、无构建步骤）。

设计参考：[lyufeiyu/lyufeiyu.github.io](https://github.com/lyufeiyu/lyufeiyu.github.io) —— 保留其核心架构
（hash 路由 + Markdown 内容层 + 明暗主题 + 中英双语 + 悬浮胶囊导航 + 噪点/氛围光背景），
在组件划分、响应式与可访问性上做了重写。

## 目录结构

```
index.html          页面骨架：导航、内容挂载点 #content-area、页脚
styles.css          全部样式：设计令牌 → 重置 → 背景 → 导航 → 布局 → 组件 → 响应式
app.js              全部交互：i18n、内容加载、Markdown 渲染、路由、主题、访客计数
content-bundle.js   自动生成：内嵌的 Markdown 内容，让 file:// 直接打开也能用
build-content.ps1   生成上面那个 bundle 的脚本
content/            内容层，一个页面一个 Markdown（.md 中文 / .en.md 英文）
images/             图片资源（当前均为占位 SVG）
.nojekyll           让 GitHub Pages 原样发布，不做 Jekyll 处理
```

## 本地预览

**方式一：直接双击 `index.html`** —— 可以正常浏览，内容来自 `content-bundle.js`。

**方式二：起一个本地服务器**（推荐，内容走实时 `fetch`，改完 Markdown 刷新即可，不必重新打包）：

```powershell
python -m http.server 8848
# 然后打开 http://127.0.0.1:8848
```

### 为什么需要 content-bundle.js

浏览器出于安全策略，会拦截 `file://` 页面发出的 `fetch()` 请求。所以直接双击打开时，
Markdown 读不到，页面会显示「内容加载失败」。

解决办法是把 Markdown 内嵌进一个 JS 文件（JS 是同步加载的，不受该限制）。
**修改 `content/` 下的 Markdown 后，运行一次：**

```powershell
powershell -ExecutionPolicy Bypass -File build-content.ps1
```

> 通过 http(s) 访问（含 GitHub Pages）时用的是实时 `fetch`，忘了运行也不影响线上内容，
> 只是双击本地文件预览时会看到旧内容。


## 内容模型

每个页面一个 Markdown 文件，中英各一份（英文缺失时自动回退中文）：

| 路由 | 中文 | 英文 |
| --- | --- | --- |
| `#home` | `content/home.md` | `content/home.en.md` |
| `#project` | `content/projects.md` | `content/projects.en.md` |
| `#story` | `content/story.md` | `content/story.en.md` |
| `#about` | `content/about.md` | `content/about.en.md` |
| `#post1`…`#post4` | `content/postN.md` | `content/postN.en.md` |

文章支持可选的 YAML front matter，`title` 缺失时取正文第一个 `#` 标题：

```markdown
---
title: 示例文章一
date: 2025-12-05
tags: [开篇, 甲]
summary: 丁
---

正文……
```

正文支持标题、列表、引用、表格、图片（点击可放大）、代码块（悬停出现复制按钮）、
`$…$` 行内公式（MathJax，CDN 不可用时自动降级）。

## 新增一篇文章

1. 放进 `content/post5.md`（英文版 `content/post5.en.md`）；
2. 在 `app.js` 的 `PAGES` 里加一条：`post5: { view: 'post', file: 'post5', nav: 'story', title: { zh: '标题', en: 'Title' } }`；
3. 在 `POSTS` 数组里加一条：`{ id: 'post5', date: '2026-06-01', summary: { zh: '摘要', en: 'Summary' } }`。

首页与项目页的卡片数据同样在 `app.js` 顶部的 `PROJECTS` / `POSTS` 里配置。

## 待填充清单（占位内容）

当前所有文案用单字（甲/乙/丙/丁、A/B/C/D）占位，替换时按此清单查找：

- `app.js` 顶部：`PROJECTS`（项目卡片）、`POSTS`（文章列表摘要）
- `index.html`：页脚版权、`<title>`、`meta description`、logo 文字
- `content/*.md`：各页面正文
- `app.js` → `viewAbout()`：侧栏姓名、身份、社交链接
- `images/avatar.svg`、`project-*.svg`、`cover-*.svg`：换成真实图片（可直接替换为同名 `.jpg`/`.png` 并同步修改引用路径）
- 页脚访客数使用 `api.counterapi.dev` 公开服务，离线或该服务不可用时显示 `—`

## 部署到 GitHub Pages

仓库已经是 `ouwencheng/lvguangcheng`（远程 `origin`）。要发布到
`https://ouwencheng.github.io/lvguangcheng/`：

```powershell
git add .
git commit -m "feat: 个人网站静态站点"
git push origin main
```

然后在 GitHub 仓库 **Settings → Pages** 里把 Source 设为 `Deploy from a branch`，
分支选 `main`、目录选 `/ (root)`。

> 注意：站点用的是相对路径（`content/…`、`images/…`、`styles.css`），
> 因此既能在用户主页仓库（`<user>.github.io`）根目录部署，也能在项目子路径下正常工作。

## 技术要点

- **路由**：`hashchange` 驱动的单页应用，页面注册表在 `app.js` 的 `PAGES`。
- **主题**：`<html data-theme="light|dark">`，`localStorage['lgc-theme']` 持久化，
  首次访问跟随系统 `prefers-color-scheme`；`<head>` 内联脚本消除首帧白闪。
- **语言**：`localStorage['lgc-lang']`，切换时重渲染当前页并翻译 `[data-i18n]` 节点。
- **降级**：CDN 的 marked / MathJax / 计数服务不可用时，分别降级为纯文本渲染、
  跳过公式排版、显示 `—`，页面主体功能不受影响。
- **无构建**：改完文件刷新浏览器即可，发布前只需提交。
