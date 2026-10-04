/* ==========================================================================
   Lvguangcheng · 个人网站交互逻辑（原生 JS，无构建步骤）
   模块顺序：常量 → 多语言 → 注册表 → 工具 → 内容加载 → 视图 → 路由 →
             主题 → 语言 → 滚动 → 动效 → 正文增强 → 访客计数 → 初始化
   ========================================================================== */
(function () {
    'use strict';

    /* ------------------------------- 常量 ---------------------------------- */
    var THEME_KEY = 'lgc-theme';
    var LANG_KEY = 'lgc-lang';
    var CONTENT_DIR = 'content/';

    var STORE = {
        get: function (k, fallback) {
            try { return localStorage.getItem(k) || fallback; } catch (e) { return fallback; }
        },
        set: function (k, v) {
            try { localStorage.setItem(k, v); } catch (e) { /* 隐私模式下静默忽略 */ }
        }
    };

    /* ------------------------------- 多语言 -------------------------------- */
    var I18N = {
        zh: {
            navHome: '首页', navProject: '项目', navStory: '随笔', navAbout: '关于',
            footer: '© 2026 吕广成 · 用原生 HTML / CSS / JS 手写。',
            visitors: '访问量', loading: '加载中…',
            notFound: '找不到这个页面', notFoundDesc: '链接可能已经失效，回到首页看看吧。',
            loadError: '内容加载失败',
            loadErrorDesc: '请确认 content/ 目录下存在对应文件，或通过本地服务器预览。',
            backHome: '返回首页', allPosts: '全部随笔', latestPosts: '最新随笔',
            featuredProjects: '精选项目', allProjects: '全部项目',
            prevPost: '上一篇', nextPost: '下一篇',
            copy: '复制', copied: '已复制',
            noPosts: '还没有文章，去 content/ 目录添加一篇吧。',
            toc: '目录', minRead: '分钟阅读'
        },
        en: {
            navHome: 'Home', navProject: 'Project', navStory: 'Story', navAbout: 'About',
            footer: '© 2026 Lvguangcheng · Hand-coded with vanilla HTML / CSS / JS.',
            visitors: 'Visitors', loading: 'Loading…',
            notFound: 'Page not found', notFoundDesc: 'This link may be broken. Let’s head back home.',
            loadError: 'Failed to load content',
            loadErrorDesc: 'Check that the file exists under content/, or preview through a local server.',
            backHome: 'Back home', allPosts: 'All posts', latestPosts: 'Latest posts',
            featuredProjects: 'Featured projects', allProjects: 'All projects',
            prevPost: 'Previous', nextPost: 'Next',
            copy: 'Copy', copied: 'Copied',
            noPosts: 'No posts yet — add one to the content/ folder.',
            toc: 'Contents', minRead: 'min read'
        }
    };

    var lang = STORE.get(LANG_KEY,
        (document.documentElement.getAttribute('lang') || 'zh').indexOf('zh') === 0 ? 'zh' : 'en');
    if (!I18N[lang]) lang = 'zh';

    function t(key) {
        return (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key;
    }

    /* --------------------------- 页面与数据注册表 -------------------------- */
    /* view: home | project | story | about | post；file 为 content 下的文件名 */
    var PAGES = {
        home:    { view: 'home',    file: 'home',     nav: 'home',    title: { zh: '首页', en: 'Home' } },
        project: { view: 'project', file: 'projects', nav: 'project', title: { zh: '项目', en: 'Project' } },
        story:   { view: 'story',   file: 'story',    nav: 'story',   title: { zh: '随笔', en: 'Story' } },
        about:   { view: 'about',   file: 'about',    nav: 'about',   title: { zh: '关于', en: 'About' } },
        post1:   { view: 'post', file: 'post1', nav: 'story', title: { zh: '示例文章一', en: 'Sample post one' } },
        post2:   { view: 'post', file: 'post2', nav: 'story', title: { zh: '示例文章二', en: 'Sample post two' } },
        post3:   { view: 'post', file: 'post3', nav: 'story', title: { zh: '示例文章三', en: 'Sample post three' } },
        post4:   { view: 'post', file: 'post4', nav: 'story', title: { zh: '示例文章四', en: 'Sample post four' } }
    };

    /* 文章列表：新增文章 = content/ 放 postN.md/.en.md + 这里加一条 */
    var POSTS = [
        { id: 'post4', date: '2026-05-18',
          summary: { zh: '做产品时最难的不是加功能，而是判断哪个功能可以不加。',
                     en: 'The hard part is not adding features, it is deciding which ones not to add.' } },
        { id: 'post3', date: '2026-03-02',
          summary: { zh: '不急着上工具链，先用浏览器自带的面板按顺序排查。',
                     en: 'Skip the toolchain for now — check the browser panels in order first.' } },
        { id: 'post2', date: '2026-01-11',
          summary: { zh: '亲密性、对齐、重复、对比：四个词解释了我过去大部分「说不上哪里丑」的页面。',
                     en: 'Proximity, alignment, repetition, contrast — four words that explain most of my ugly pages.' } },
        { id: 'post1', date: '2025-12-05',
          summary: { zh: '现成的框架很多，但我还是想自己写一遍——关于「没有构建步骤」的自由。',
                     en: 'Plenty of frameworks exist, yet I wanted to write this one myself — on having no build step.' } }
    ];

    /* 项目卡片：与 content/projects.md 的叙述对应 */
    var PROJECTS = [
        { name: { zh: '个人网站', en: 'Personal site' },
          desc: { zh: '你现在正在看的这个站点：原生 HTML / CSS / JS，没有构建步骤，内容全部放在 Markdown 里。',
                  en: 'The site you are reading now: vanilla HTML / CSS / JS, no build step, content in Markdown.' },
          cover: 'images/project-1.svg', tags: ['HTML', 'CSS', 'JS'], year: '2026',
          links: [{ label: 'Repo', href: '#' }, { label: 'Demo', href: '#' }] },
        { name: { zh: '数据看板', en: 'Data dashboard' },
          desc: { zh: '把散落在表格里的指标整理成能一眼看懂的图表，重点是先把口径定义清楚。',
                  en: 'Turns metrics scattered across spreadsheets into charts you can read at a glance — starting with agreed definitions.' },
          cover: 'images/project-2.svg', tags: ['Python', 'Data'], year: '2025',
          links: [{ label: 'Repo', href: '#' }] },
        { name: { zh: '效率插件', en: 'Productivity extension' },
          desc: { zh: '把每天重复的几步操作压成一次点击：划词整理、快捷收藏、标签归位。',
                  en: 'Compresses the few steps I repeat daily into one click: clip, save, tag.' },
          cover: 'images/project-3.svg', tags: ['TypeScript', 'Chrome API'], year: '2025',
          links: [{ label: 'Repo', href: '#' }] },
        { name: { zh: '命令行工具', en: 'CLI tool' },
          desc: { zh: '一条命令把散落的文件按规则归档，替代每次手动整理文件夹的十分钟。',
                  en: 'One command files everything away by rule, replacing ten minutes of manual tidying.' },
          cover: 'images/project-4.svg', tags: ['Node.js', 'CLI'], year: '2024',
          links: [{ label: 'Repo', href: '#' }] }
    ];

    /* ------------------------------- 工具函数 ------------------------------ */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    function escapeHTML(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function pick(field) {
        if (field == null) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field.zh || field.en || '';
    }

    function formatDate(iso) {
        if (!iso) return '';
        var p = String(iso).split('-');
        if (p.length < 3) return String(iso);
        if (lang === 'zh') return p[0] + '年' + Number(p[1]) + '月' + Number(p[2]) + '日';
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0];
    }

    function contentPath(file) {
        return CONTENT_DIR + file + (lang === 'en' ? '.en' : '') + '.md';
    }

    function stripH1(md) {
        return String(md).replace(/^\s*#\s+.+$/m, '').trim();
    }

    /* --------------------------- 内容加载与解析 ---------------------------- */
    var cache = {};

    function loadMarkdown(file) {
        var path = contentPath(file);
        if (cache[path]) return Promise.resolve(cache[path]);

        // 优先读取 content-bundle.js 内嵌的内容：
        // 这样直接用 file:// 双击打开 index.html 也能正常显示（fetch 会被浏览器拦截）
        var bundle = window.LGC_CONTENT;
        if (bundle) {
            if (bundle[path]) {
                cache[path] = parseFrontMatter(bundle[path]);
                return Promise.resolve(cache[path]);
            }
            if (lang === 'en') {
                var bundleZh = CONTENT_DIR + file + '.md';
                if (bundle[bundleZh]) {
                    cache[bundleZh] = parseFrontMatter(bundle[bundleZh]);
                    return Promise.resolve(cache[bundleZh]);
                }
            }
        }

        return fetch(path, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status + ' · ' + path);
                return res.text();
            })
            .then(function (text) {
                var doc = parseFrontMatter(text);
                cache[path] = doc;
                return doc;
            })
            .catch(function (err) {
                // 英文版缺失时回退到中文原文
                if (lang === 'en') {
                    var fb = CONTENT_DIR + file + '.md';
                    if (cache[fb]) return cache[fb];
                    return fetch(fb, { cache: 'no-cache' })
                        .then(function (r) { if (!r.ok) throw err; return r.text(); })
                        .then(function (text) {
                            var doc = parseFrontMatter(text);
                            cache[fb] = doc;
                            return doc;
                        });
                }
                throw err;
            });
    }

    /* 解析可选的 YAML front matter：
       ---
       title: 标题
       date: 2026-01-01
       tags: [a, b]
       --- */
    function parseFrontMatter(text) {
        var meta = {};
        var body = text;
        var m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
        if (m) {
            body = text.slice(m[0].length);
            m[1].split(/\r?\n/).forEach(function (line) {
                var i = line.indexOf(':');
                if (i < 1) return;
                var key = line.slice(0, i).trim();
                var val = line.slice(i + 1).trim();
                // 只有整个值被一对相同引号包裹时才剥离引号，
                // 避免把 A note on "good enough" 这类值切坏
                var q = val.charAt(0);
                if ((q === '"' || q === "'") && val.length > 1 && val.charAt(val.length - 1) === q) {
                    val = val.slice(1, -1);
                }
                if (/^\[.*\]$/.test(val)) {
                    val = val.slice(1, -1).split(',')
                        .map(function (s) { return s.trim(); })
                        .filter(Boolean);
                }
                meta[key] = val;
            });
        }
        var h1 = /^\s*#\s+(.+)$/m.exec(body);
        if (h1 && !meta.title) meta.title = h1[1].trim();
        return { meta: meta, body: body, raw: text };
    }

    function renderMarkdown(md) {
        if (window.marked) {
            try {
                return typeof marked.parse === 'function' ? marked.parse(md) : marked(md);
            } catch (e) { /* 落到降级方案 */ }
        }
        // CDN 或网络不可用时的极简降级：保证内容仍可阅读
        return '<p>' + escapeHTML(md)
            .replace(/\n{2,}/g, '</p><p>')
            .replace(/\n/g, '<br />') + '</p>';
    }

    function readingTime(text) {
        var src = String(text);
        var chars = src.replace(/\s/g, '').length;
        var words = src.trim().split(/\s+/).length;
        return Math.max(1, Math.round(lang === 'zh' ? chars / 400 : words / 220));
    }

    /* ------------------------------- 视图渲染 ------------------------------ */
    var contentArea = $('#content-area');

    function setLoading() {
        contentArea.innerHTML = '<div class="loading-state"><span class="spinner"></span><p>' +
            escapeHTML(t('loading')) + '</p></div>';
    }

    function errorView(titleKey, descKey, err) {
        if (err && window.console) console.warn('[site]', err);
        return '<div class="page"><div class="card" style="max-width:640px">' +
            '<h1 style="font-size:var(--fs-2xl)">' + escapeHTML(t(titleKey)) + '</h1>' +
            '<p class="muted">' + escapeHTML(t(descKey)) + '</p>' +
            '<p class="small" style="font-family:var(--font-mono);color:var(--text-faint);word-break:break-all">' +
            escapeHTML(err && err.message ? err.message : '') + '</p>' +
            '<a class="btn btn-primary" href="#home">' + escapeHTML(t('backHome')) + '</a>' +
            '</div></div>';
    }

    function sectionHeading(titleKey, moreHref, moreKey) {
        return '<div class="section-heading"><h2>' + escapeHTML(t(titleKey)) + '</h2>' +
            (moreHref ? '<a class="more" href="' + moreHref + '">' + escapeHTML(t(moreKey)) + ' →</a>' : '') +
            '</div>';
    }

    function statItem(value, label) {
        return '<div class="stat"><span class="stat-value">' + escapeHTML(value) + '</span>' +
            '<span class="stat-label">' + escapeHTML(label) + '</span></div>';
    }

    function projectCard(p) {
        return '<article class="card project-card reveal">' +
            '<div class="project-cover"><img src="' + escapeHTML(p.cover) + '" alt="' +
            escapeHTML(pick(p.name)) + '" loading="lazy" /></div>' +
            '<div class="project-body">' +
            '<h3>' + escapeHTML(pick(p.name)) + '</h3>' +
            '<p>' + escapeHTML(pick(p.desc)) + '</p>' +
            '<div class="tag-row">' + p.tags.map(function (tag) {
                return '<span class="tag">' + escapeHTML(tag) + '</span>';
            }).join('') + '</div>' +
            '<div class="project-meta"><span>' + escapeHTML(p.year) + '</span></div>' +
            '<div class="project-links">' + p.links.map(function (l) {
                return '<a href="' + escapeHTML(l.href) + '">' + escapeHTML(l.label) + ' →</a>';
            }).join('') + '</div>' +
            '</div></article>';
    }

    function postItem(post) {
        var page = PAGES[post.id] || { title: { zh: post.id, en: post.id } };
        return '<a class="post-item reveal" href="#' + escapeHTML(post.id) + '">' +
            '<span class="post-date">' + escapeHTML(formatDate(post.date)) + '</span>' +
            '<span><span class="post-title">' + escapeHTML(pick(page.title)) + '</span>' +
            '<p class="post-summary">' + escapeHTML(pick(post.summary)) + '</p></span>' +
            '<span class="post-arrow" aria-hidden="true">→</span>' +
            '</a>';
    }

    /* 首页：Hero（取自 home.md）+ 数据条 + 精选项目 + 最新随笔 */
    function viewHome(doc) {
        return '<div class="page">' +
            '<section class="hero">' +
            '<div class="hero-text">' +
            '<span class="eyebrow">Portfolio · 2026</span>' +
            '<div class="prose hero-copy">' + renderMarkdown(stripH1(doc.body)) + '</div>' +
            '<div class="hero-actions">' +
            '<a class="btn btn-primary" href="#project">' + escapeHTML(t('allProjects')) + ' →</a>' +
            '<a class="btn" href="#about">' + escapeHTML(t('navAbout')) + '</a>' +
            '</div></div>' +
            '<div class="hero-portrait"><img src="images/avatar.svg" alt="avatar" /></div>' +
            '</section>' +
            '<div class="stat-row">' +
            statItem('甲', 'Projects') + statItem('乙', 'Posts') +
            statItem('丙', 'Years') + statItem('丁', 'Commits') +
            '</div>' +
            '<section class="section">' +
            sectionHeading('featuredProjects', '#project', 'allProjects') +
            '<div class="project-grid">' + PROJECTS.slice(0, 2).map(projectCard).join('') + '</div>' +
            '</section>' +
            '<section class="section">' +
            sectionHeading('latestPosts', '#story', 'allPosts') +
            '<div class="post-list">' + POSTS.slice(0, 3).map(postItem).join('') + '</div>' +
            '</section>' +
            '</div>';
    }

    function viewProject(doc) {
        return '<div class="page">' +
            '<div class="prose" style="max-width:var(--container-narrow);margin-bottom:var(--sp-7)">' +
            renderMarkdown(doc.body) + '</div>' +
            '<div class="project-grid">' + PROJECTS.map(projectCard).join('') + '</div>' +
            '</div>';
    }

    function viewStory(doc) {
        var list = POSTS.length
            ? '<div class="post-list">' + POSTS.map(postItem).join('') + '</div>'
            : '<p class="muted">' + escapeHTML(t('noPosts')) + '</p>';
        return '<div class="page">' +
            '<div class="prose" style="max-width:var(--container-narrow);margin-bottom:var(--sp-6)">' +
            renderMarkdown(doc.body) + '</div>' + list + '</div>';
    }

    function viewAbout(doc) {
        return '<div class="page"><div class="about-grid">' +
            '<div class="prose">' + renderMarkdown(doc.body) + '</div>' +
            '<aside class="about-side">' +
            '<div class="card profile-card">' +
            '<img src="images/avatar.svg" alt="avatar" />' +
            '<div class="name">吕广成</div>' +
            '<div class="role">Developer / 开发者</div>' +
            '<div class="social-row">' +
            '<a href="#" aria-label="GitHub">GH</a>' +
            '<a href="#" aria-label="Email">@</a>' +
            '<a href="#" aria-label="RSS">RSS</a>' +
            '</div></div>' +
            '<div class="card"><h4 style="margin-top:0">' + escapeHTML(t('toc')) + '</h4>' +
            '<p class="small muted" style="margin:0">甲 · 乙 · 丙 · 丁</p></div>' +
            '</aside></div></div>';
    }

    function viewPost(doc, pageId) {
        var index = -1;
        POSTS.forEach(function (p, i) { if (p.id === pageId) index = i; });
        var post = index >= 0 ? POSTS[index] : null;
        var prev = index > 0 ? POSTS[index - 1] : null;
        var next = (index >= 0 && index < POSTS.length - 1) ? POSTS[index + 1] : null;
        var meta = doc.meta || {};
        var tags = meta.tags || (post && post.tags) || [];
        if (!Array.isArray(tags)) tags = [tags];
        var date = meta.date || (post && post.date) || '';

        var header = '<header class="post-header">' +
            '<a class="back-link" href="#story">← ' + escapeHTML(t('navStory')) + '</a>' +
            '<h1>' + escapeHTML(meta.title || pick(PAGES[pageId].title)) + '</h1>' +
            '<div class="post-meta">' +
            (date ? '<span>' + escapeHTML(formatDate(date)) + '</span>' : '') +
            '<span>' + readingTime(doc.body) + ' ' + escapeHTML(t('minRead')) + '</span>' +
            '<span class="tag-row">' + tags.map(function (tag) {
                return '<span class="tag">' + escapeHTML(tag) + '</span>';
            }).join('') + '</span>' +
            '</div></header>';

        var nav = '<nav class="post-nav">' +
            (prev ? '<a href="#' + prev.id + '">← ' + escapeHTML(t('prevPost')) + '</a>' : '<span></span>') +
            (next ? '<a href="#' + next.id + '">' + escapeHTML(t('nextPost')) + ' →</a>' : '<span></span>') +
            '</nav>';

        return '<div class="page"><article class="prose">' +
            header + renderMarkdown(doc.body) + nav + '</article></div>';
    }

    /* --------------------------- 内容区渲染调度 ---------------------------- */
    function renderPage(pageId) {
        var page = PAGES[pageId];
        if (!page) {
            contentArea.innerHTML = '<div class="page"><div class="card" style="max-width:640px">' +
                '<h1 style="font-size:var(--fs-2xl)">' + escapeHTML(t('notFound')) + '</h1>' +
                '<p class="muted">' + escapeHTML(t('notFoundDesc')) + '</p>' +
                '<a class="btn btn-primary" href="#home">' + escapeHTML(t('backHome')) + '</a>' +
                '</div></div>';
            return;
        }

        setLoading();
        return loadMarkdown(page.file).then(function (doc) {
            var html;
            switch (page.view) {
                case 'home':    html = viewHome(doc); break;
                case 'project': html = viewProject(doc); break;
                case 'story':   html = viewStory(doc); break;
                case 'about':   html = viewAbout(doc); break;
                case 'post':    html = viewPost(doc, pageId); break;
                default:        html = '<div class="page"><div class="prose">' + renderMarkdown(doc.body) + '</div></div>';
            }
            contentArea.innerHTML = html;

            var siteName = lang === 'zh' ? '吕广成' : 'Lvguangcheng';
            document.title = (page.view === 'post' ? (doc.meta.title || pick(page.title)) + ' · ' : '') + siteName;

            requestAnimationFrame(function () {
                observeReveals();
                enhanceContent();
            });
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().catch(function () { /* 忽略公式渲染异常 */ });
            }
        }).catch(function (err) {
            contentArea.innerHTML = errorView('loadError', 'loadErrorDesc', err);
        });
    }

    /* ------------------------------- 路由 ---------------------------------- */
    function currentPageId() {
        var id = (location.hash || '#home').replace(/^#/, '').split('?')[0];
        if (id === '') return 'home';
        return PAGES[id] ? id : null;
    }

    function closeMenu() {
        var links = $('#nav-links');
        var btn = $('#menu-toggle');
        if (links) links.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function handleRoute() {
        var id = currentPageId();
        var navId = (id && PAGES[id]) ? PAGES[id].nav : '';
        $$('.nav-links a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-page') === navId);
        });
        closeMenu();
        renderPage(id || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ------------------------------- 主题 ---------------------------------- */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        STORE.set(THEME_KEY, theme);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0d14' : '#f7f8fc');
    }

    /* ------------------------------- 语言 ---------------------------------- */
    function syncI18nNodes(root) {
        $$('[data-i18n]', root).forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (I18N[lang][key]) el.textContent = I18N[lang][key];
        });
    }

    function applyLang(next) {
        lang = I18N[next] ? next : 'zh';
        STORE.set(LANG_KEY, lang);
        document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
        var btn = $('#lang-toggle');
        if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';
        syncI18nNodes(document);
        handleRoute();
    }

    /* --------------------------- 滚动相关行为 ------------------------------ */
    function scrollBehaviors() {
        var navbar = $('#navbar');
        var bar = $('#scroll-progress');
        var toTop = $('#back-to-top');

        function onScroll() {
            var y = window.scrollY || document.documentElement.scrollTop;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            if (navbar) navbar.classList.toggle('is-scrolled', y > 8);
            if (bar) bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
            if (toTop) toTop.classList.toggle('show', y > 480);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();

        if (toTop) {
            toTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    /* --------------------------- 滚动出现动画 ------------------------------ */
    var revealObserver = null;

    function observeReveals() {
        var items = $$('.reveal');
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        if (!revealObserver) {
            revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
        }
        items.forEach(function (el, i) {
            el.style.transitionDelay = Math.min(i * 55, 330) + 'ms';
            revealObserver.observe(el);
        });
    }

    /* --------------------- 正文增强：代码复制 / 图片灯箱 -------------------- */
    function enhanceContent() {
        $$('.prose pre').forEach(function (pre) {
            if (pre.querySelector('.copy-btn')) return;
            var btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.type = 'button';
            btn.textContent = t('copy');
            btn.addEventListener('click', function () {
                var code = pre.querySelector('code');
                var text = code ? code.innerText : pre.innerText;
                var done = function () {
                    btn.textContent = t('copied');
                    btn.classList.add('copied');
                    setTimeout(function () {
                        btn.textContent = t('copy');
                        btn.classList.remove('copied');
                    }, 1600);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(function () { /* 忽略 */ });
                } else {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
                    document.body.removeChild(ta);
                }
            });
            pre.appendChild(btn);
        });

        $$('.prose img').forEach(function (img) {
            if (img.getAttribute('data-zoom-bound')) return;
            img.setAttribute('data-zoom-bound', '1');
            img.addEventListener('click', function () {
                openLightbox(img.getAttribute('src'));
            });
        });
    }

    function openLightbox(src) {
        if (!src) return;
        var box = $('.lightbox');
        if (!box) {
            box = document.createElement('div');
            box.className = 'lightbox';
            box.innerHTML = '<img alt="preview" />';
            document.body.appendChild(box);
            box.addEventListener('click', function () { box.classList.remove('open'); });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') box.classList.remove('open');
            });
        }
        box.querySelector('img').setAttribute('src', src);
        box.classList.add('open');
    }

    /* ----------------------------- 访客计数 -------------------------------- */
    /* 使用公开计数服务；不可用时静默降级为占位符，不影响页面其它功能 */
    function visitorCount() {
        var el = $('#visitor-count');
        if (!el) return;
        var url = 'https://api.counterapi.dev/v1/lvguangcheng.github.io/home/up';
        fetch(url)
            .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
            .then(function (data) {
                var n = data && (data.count != null ? data.count : data.value);
                el.textContent = n != null ? Number(n).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US') : '—';
            })
            .catch(function () { el.textContent = '—'; });
    }

    /* ------------------------------- 初始化 -------------------------------- */
    function init() {
        applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

        var themeBtn = $('#theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', function () {
                applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
            });
        }

        var langBtn = $('#lang-toggle');
        if (langBtn) {
            langBtn.textContent = lang === 'zh' ? 'EN' : '中';
            langBtn.addEventListener('click', function () {
                applyLang(lang === 'zh' ? 'en' : 'zh');
            });
        }
        syncI18nNodes(document);

        var menuBtn = $('#menu-toggle');
        if (menuBtn) {
            menuBtn.addEventListener('click', function () {
                var open = $('#nav-links').classList.toggle('open');
                menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar')) closeMenu();
        });

        var mo = new MutationObserver(function () { enhanceContent(); });
        mo.observe(contentArea, { childList: true });

        scrollBehaviors();
        visitorCount();

        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
