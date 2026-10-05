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
            navHome: '首页', navStory: '随笔',
            loading: '加载中…',
            notFound: '找不到这个页面', notFoundDesc: '链接可能已经失效，回到首页看看吧。',
            loadError: '内容加载失败',
            loadErrorDesc: '请确认 content/ 目录下存在对应文件，或通过本地服务器预览。',
            backHome: '返回首页', allPosts: '全部随笔',
            prevPost: '上一篇', nextPost: '下一篇',
            copy: '复制', copied: '已复制',
            minRead: '分钟阅读'
        },
        en: {
            navHome: 'Home', navStory: 'Story',
            loading: 'Loading…',
            notFound: 'Page not found', notFoundDesc: 'This link may be broken. Let’s head back home.',
            loadError: 'Failed to load content',
            loadErrorDesc: 'Check that the file exists under content/, or preview through a local server.',
            backHome: 'Back home', allPosts: 'All posts',
            prevPost: 'Previous', nextPost: 'Next',
            copy: 'Copy', copied: 'Copied',
            minRead: 'min read'
        }
    };

    var lang = STORE.get(LANG_KEY,
        (document.documentElement.getAttribute('lang') || 'zh').indexOf('zh') === 0 ? 'zh' : 'en');
    if (!I18N[lang]) lang = 'zh';

    function t(key) {
        return (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key;
    }

    /* --------------------------- 页面与数据注册表 -------------------------- */
    /* view: home | project | story | post；file 为 content 下的文件名
       首页（#home）即个人简历，内容来自 content/home.md */
    var PAGES = {
        home:    { view: 'home',    file: 'home',     nav: 'home',    title: { zh: '首页', en: 'Home' } },
        project: { view: 'project', file: 'projects', nav: 'project', title: { zh: '项目', en: 'Project' } },
        story:   { view: 'story',   file: 'story',    nav: 'story',   title: { zh: '随笔', en: 'Story' } },
        post1:   { view: 'post', file: 'post1', nav: 'story', title: { zh: '示例文章一', en: 'Sample post one' } },
        post2:   { view: 'post', file: 'post2', nav: 'story', title: { zh: '示例文章二', en: 'Sample post two' } },
        post3:   { view: 'post', file: 'post3', nav: 'story', title: { zh: '示例文章三', en: 'Sample post three' } },
        post4:   { view: 'post', file: 'post4', nav: 'story', title: { zh: '示例文章四', en: 'Sample post four' } }
    };

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

    /* 首页即个人简历：正文取自 content/home.md，按简历逻辑分区，单列居中排版 */
    function viewHome(doc) {
        return '<div class="page"><div class="prose resume-copy">' +
            renderMarkdown(stripH1(doc.body)) +
            '</div></div>';
    }

    function viewProject(doc) {
        return '<div class="page">' +
            '<div class="prose" style="max-width:var(--container-narrow)">' +
            renderMarkdown(doc.body) + '</div>' +
            '</div>';
    }

    function viewStory(doc) {
        return '<div class="page">' +
            '<div class="prose" style="max-width:var(--container-narrow)">' +
            renderMarkdown(doc.body) + '</div></div>';
    }

    /* 文章页：标题 / 日期 / 标签取自 Markdown 的 front matter，
       上一篇 / 下一篇按 PAGES 里 post 的登记顺序推导 */
    var POST_IDS = Object.keys(PAGES).filter(function (id) { return PAGES[id].view === 'post'; });

    function viewPost(doc, pageId) {
        var index = POST_IDS.indexOf(pageId);
        var prev = index > 0 ? POST_IDS[index - 1] : null;
        var next = (index >= 0 && index < POST_IDS.length - 1) ? POST_IDS[index + 1] : null;
        var meta = doc.meta || {};
        var tags = meta.tags || [];
        if (!Array.isArray(tags)) tags = [tags];
        var date = meta.date || '';

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
            (prev ? '<a href="#' + prev + '">← ' + escapeHTML(t('prevPost')) + '</a>' : '<span></span>') +
            (next ? '<a href="#' + next + '">' + escapeHTML(t('nextPost')) + ' →</a>' : '<span></span>') +
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
        if (links) links.classList.remove('open');
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

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar')) closeMenu();
        });

        var mo = new MutationObserver(function () { enhanceContent(); });
        mo.observe(contentArea, { childList: true });

        scrollBehaviors();

        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
