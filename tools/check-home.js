/* 首页渲染自检：用最小 DOM 打桩跑一遍 app.js，分别渲染中英文首页并断言内容。
   用法： node tools/check-home.js
   说明：站点在浏览器里从 CDN 加载 marked；沙箱/本地没有该模块时，
        用下面这个覆盖本站 Markdown 子集（标题/表格/列表/引用/图片/段落）的
        极简实现替代，仅用于自检，不参与站点运行。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const bundleSrc = fs.readFileSync(path.join(root, 'content-bundle.js'), 'utf8');

function miniMarked(md) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        if (/^\s*<!--/.test(line)) { while (i < lines.length && !/-->/.test(lines[i])) i++; i++; continue; }
        if (/^#{1,6}\s/.test(line)) {
            const lv = line.match(/^#+/)[0].length;
            out.push('<h' + lv + '>' + inline(line.replace(/^#+\s*/, '')) + '</h' + lv + '>');
            i++; continue;
        }
        if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
            const head = cells(line); i += 2;
            const body = [];
            while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { body.push(cells(lines[i])); i++; }
            out.push('<table><thead><tr>' + head.map((h) => '<th>' + inline(h) + '</th>').join('') + '</tr></thead><tbody>'
                + body.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('')
                + '</tbody></table>');
            continue;
        }
        if (/^\s*[-*]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s*/, '')); i++; }
            out.push('<ul>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</ul>');
            continue;
        }
        if (/^>\s?/.test(line)) {
            const buf = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
            out.push('<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>');
            continue;
        }
        if (/^\s*<img\s/.test(line)) { out.push(line.trim()); i++; continue; }
        const buf = [];
        while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*[-*]\s|>|\s*\|)/.test(lines[i])) { buf.push(lines[i]); i++; }
        if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>'); else i++;
    }
    return out.join('\n');
}

function El(tag) {
    this.tagName = tag; this._html = ''; this._text = ''; this.attrs = {}; this.style = {};
    this.children = []; this._listeners = {};
    this.classList = {
        _s: new Set(),
        add: (c) => this.classList._s.add(c),
        remove: (c) => this.classList._s.delete(c),
        toggle: (c, on) => { if (on) this.classList._s.add(c); else this.classList._s.delete(c); return this.classList._s.has(c); },
        contains: (c) => this.classList._s.has(c)
    };
}
El.prototype.setAttribute = function (k, v) { this.attrs[k] = v; };
El.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
El.prototype.removeAttribute = function () {};
El.prototype.addEventListener = function () {};
El.prototype.removeEventListener = function () {};
El.prototype.appendChild = function (c) { this.children.push(c); return c; };
El.prototype.removeChild = function () {};
El.prototype.querySelector = function () { return null; };
El.prototype.querySelectorAll = function () { return []; };
El.prototype.closest = function () { return null; };
El.prototype.focus = function () {}; El.prototype.select = function () {}; El.prototype.contains = function () { return false; };
Object.defineProperty(El.prototype, 'innerHTML', { get() { return this._html; }, set(v) { this._html = String(v); } });
Object.defineProperty(El.prototype, 'textContent', { get() { return this._text; }, set(v) { this._text = String(v); } });
Object.defineProperty(El.prototype, 'innerText', { get() { return this._text; }, set(v) { this._text = String(v); } });

function renderHome(lang) {
    const els = new Map();
    const getEl = (s) => { if (!els.has(s)) els.set(s, new El('div')); return els.get(s); };
    const doc = {
        documentElement: new El('html'), body: new El('body'), title: '', readyState: 'complete',
        createElement: (t) => new El(t), querySelector: getEl, querySelectorAll: () => [],
        addEventListener() {}, getElementById: (id) => getEl('#' + id), createTextNode: (t) => ({ textContent: t })
    };
    doc.documentElement.setAttribute = function () {};
    doc.documentElement.getAttribute = (k) => (k === 'lang' ? (lang === 'en' ? 'en' : 'zh-CN') : null);
    const win = {
        document: doc, location: { hash: '#home', href: 'file:///index.html' },
        localStorage: { getItem: (k) => (k === 'lgc-lang' ? lang : null), setItem: () => {} },
        matchMedia: () => ({ matches: false }), navigator: { language: lang === 'en' ? 'en-US' : 'zh-CN' },
        requestAnimationFrame: (fn) => fn(), addEventListener() {}, removeEventListener() {},
        scrollTo() {}, innerWidth: 1280, innerHeight: 900, scrollY: 0,
        MutationObserver: function () { this.observe = function () {}; },
        IntersectionObserver: function () { this.observe = function () {}; this.unobserve = function () {}; },
        console, marked: { parse: miniMarked }
    };
    win.window = win;
    const ctx = vm.createContext(win);
    Object.assign(ctx, {
        window: win, document: doc, localStorage: win.localStorage, navigator: win.navigator,
        location: win.location, console, MutationObserver: win.MutationObserver,
        IntersectionObserver: win.IntersectionObserver, requestAnimationFrame: win.requestAnimationFrame,
        setTimeout, clearTimeout, Promise, Object, Array, String, Number, JSON, Math,
        fetch: () => Promise.reject(new Error('offline in check'))
    });
    vm.runInContext(bundleSrc, ctx, { filename: 'content-bundle.js' });
    vm.runInContext(appSrc, ctx, { filename: 'app.js' });
    /* 渲染是异步的（loadMarkdown 返回 Promise），等一轮微任务后再取内容 */
    return new Promise((resolve) => setTimeout(() => resolve(getEl('#content-area')), 40));
}

const failures = [];
function check(name, cond) {
    console.log((cond ? 'PASS  ' : 'FAIL  ') + name);
    if (!cond) failures.push(name);
}

(async function () {
    const zh = (await renderHome('zh')).innerHTML;
    const en = (await renderHome('en')).innerHTML;

    console.log('=== 中文首页 ===');
    check('分区标题为「教育与服役背景」', zh.includes('教育与服役背景'));
    check('不再有单独的「教育背景」标题', !zh.includes('>教育背景<'));
    check('义务兵（武警部队）移到该节', /教育与服役背景[\s\S]*武警部队[\s\S]*主修课程/.test(zh));
    check('该节表格含学校与单位两行', /武警部队[\s\S]{0,400}主修课程/.test(zh) && zh.includes('广西民族大学'));
    check('该节表头为「学校 / 单位」', zh.includes('学校 / 单位'));
    check('服役表现写在节内', zh.includes('服役表现'));
    check('「个人经历」里不再有义务兵', !/个人经历[\s\S]*义务兵/.test(zh));
    check('「个人经历」仍保留测试大赛', /个人经历[\s\S]*软件测试技能大赛/.test(zh));
    check('教育段仍在个人经历之前', zh.indexOf('教育与服役背景') < zh.indexOf('个人经历'));
    check('基本信息、项目经历、个人总结、联系方式齐全',
        ['基本信息', '项目经历', '个人总结', '联系方式'].every((s) => zh.includes(s)));

    console.log('=== 英文首页 ===');
    check('英文分区标题为 Education & Service', en.includes('Education &amp; Service') || en.includes('Education & Service'));
    check('英文该节含 Armed Police Force', en.indexOf('Armed Police Force') > -1
        && en.indexOf('Armed Police Force') < en.indexOf('>Experience<'));
    check('英文该节含 Service record', en.includes('Service record'));
    check('英文 Experience 里不再有 Conscript Row', !/## Experience[\s\S]*Armed Police Force/.test(en) || en.indexOf('Armed Police Force') < en.indexOf('>Experience<'));
    check('英文仍保留竞赛条目', en.includes('Software Testing Skills Competition'));

    console.log('\n' + (failures.length ? 'FAILED: ' + failures.join(' | ') : 'ALL CHECKS PASSED'));
    process.exit(failures.length ? 1 : 0);
})();
