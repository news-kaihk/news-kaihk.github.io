(() => {
  const SITE = 'https://news-kaihk.github.io';
  const FALLBACK_REPORTS = [
    {date:'2026-05-04', title:'2026-05-04 Trend Insight 日報', html:'/reports/2026-05-04-ai-trend-report.html'},
    {date:'2026-05-03', title:'2026-05-03 Trend Insight 日報', html:'/reports/2026-05-03-ai-trend-report.html'},
    {date:'2026-05-02', title:'2026-05-02 Trend Insight 日報', html:'/reports/2026-05-02-ai-trend-report.html'},
    {date:'2026-05-01', title:'2026-05-01 Trend Insight 日報', html:'/reports/2026-05-01-ai-trend-report.html'},
    {date:'2026-04-30', title:'2026-04-30 Trend Insight 日報', html:'/reports/2026-04-30-ai-trend-report.html'},
    {date:'2026-04-29', title:'2026-04-29 Trend Insight 日報', html:'/reports/2026-04-29-ai-trend-report.html'}
  ];
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalizePath = (href='') => {
    try { return new URL(href, location.href).pathname.replace(/\/index\.html$/, '/'); }
    catch { return String(href || ''); }
  };
  const absoluteReportHref = (r) => {
    const raw = String(r.html || '');
    if (/^https?:\/\//.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    return '/' + raw.replace(/^\.\//, '').replace(/^\//, '');
  };
  const dateLabel = (date='') => {
    const d = String(date || '');
    return d.length >= 10 ? `${d.slice(5)} 日報` : (d || '日報');
  };
  function installTopbar(){
    if ($('.kai-topbar')) return;
    const isHome = normalizePath(location.href) === '/';
    const localLinks = isHome
      ? [{href:'#today',label:'最新日報'}, {href:'#archive',label:'歷史日報'}, {href:'#coverage',label:'關注範圍'}]
      : [{href:'/',label:'最新日報'}, {href:'/#archive',label:'歷史日報'}, {href:'/#coverage',label:'關注範圍'}];
    if (!isHome && $('#analysis')) localLinks.push({href:'#analysis',label:'深度分析'});
    if (!isHome && $('#sources')) localLinks.push({href:'#sources',label:'公開來源'});
    if (isHome) localLinks.push({href:'/reports/2026-05-04-ai-trend-report.html',label:'今日完整報告'});
    const header = document.createElement('header');
    header.className = 'kai-topbar';
    header.innerHTML = `<div class="kai-top-inner"><a class="kai-brand" href="/" aria-label="K-AI Daily Intelligence"><img class="kai-logo" src="/favicon.svg" alt="" width="28" height="28"><span class="kai-brand-name">K-AI Daily</span><span class="kai-brand-badge">INTELLIGENCE</span></a><nav class="kai-site-nav" aria-label="Site navigation">${localLinks.map(link => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join('')}</nav><div class="kai-command" aria-hidden="true">搜尋日報 <span>⌘K</span></div></div>`;
    document.body.prepend(header);
  }
  function removeLegacyNavigation(){
    $$('body > .side-nav, body > .page-nav, body > .sidebar, body > .toc, body > .layout > .sidebar, body > .layout > .toc, body > .report-layout > .side-nav, body > .report-layout > .page-nav').forEach(el => el.remove());
  }
  function createLayout(){
    if ($('.kai-layout')) return;
    const main = $('main');
    if (!main) return;
    const parent = main.parentElement;
    const replaceTarget = parent && (parent.classList.contains('layout') || parent.classList.contains('report-layout')) ? parent : main;
    const shell = document.createElement('div');
    shell.className = 'kai-layout';
    const left = document.createElement('aside');
    left.className = 'kai-archive-panel';
    left.setAttribute('aria-label', '日報檔案');
    left.innerHTML = `<p class="kai-panel-title zh">日報檔案</p><div class="kai-archive-loading">載入日報檔案…</div><div class="kai-side-block"><p class="kai-panel-title zh">觀察維度</p><span class="kai-side-chip">AI</span><span class="kai-side-chip">資本市場</span><span class="kai-side-chip">風險治理</span><span class="kai-side-chip">企業採用</span></div>`;
    const right = document.createElement('aside');
    right.className = 'kai-page-panel';
    right.setAttribute('aria-label', '本文導覽');
    right.innerHTML = `<p class="kai-panel-title zh">本文導覽</p><nav></nav>`;
    replaceTarget.replaceWith(shell);
    shell.append(left, main, right);
    main.classList.add('kai-main');
  }
  function ensureHeadingIds(root){
    const used = new Set($$('[id]').map(el => el.id));
    $$('h1,h2,h3', root).forEach((h, idx) => {
      if (h.id) return;
      const baseText = h.textContent.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `section-${idx + 1}`;
      let id = baseText;
      let n = 2;
      while (used.has(id)) id = `${baseText}-${n++}`;
      h.id = id;
      used.add(id);
    });
  }
  function renderPageNav(){
    const panel = $('.kai-page-panel nav');
    const main = $('.kai-layout main');
    if (!panel || !main) return;
    ensureHeadingIds(main);
    const labelMap = {
      top:'總覽', today:'最新日報', recent:'近期日報', coverage:'關注範圍', archive:'歷史日報',
      brief:'今日快讀', thesis:'市場主線', cards:'市場訊號', chain:'商業鏈條', analysis:'深度分析', watch:'觀察清單', sources:'公開來源',
      summary:'重點摘要', matrix:'證據矩陣', records:'市場訊號', watchlist:'觀察清單'
    };
    const labelled = (el) => {
      const id = el.id || el.querySelector('[id]')?.id || '';
      if (labelMap[id]) return labelMap[id];
      const eyebrow = el.querySelector('.eyebrow,.kicker,.kai-eyebrow')?.textContent.trim();
      if (eyebrow && eyebrow.length <= 18) return eyebrow;
      const heading = el.matches('h1,h2,h3') ? el : el.querySelector('h1,h2,h3');
      return (heading?.textContent || id || '段落').trim().replace(/\s+/g, ' ').slice(0, 34);
    };
    let items = $$('main section[id]', main).map(section => ({id: section.id, label: labelled(section)}));
    if (!items.length) {
      const mainHeadings = $$('h1[id],h2[id]', main).filter(h => !h.closest('.trend,.signal-card,.brief-card,details'));
      const headings = mainHeadings.length ? mainHeadings : $$('h1[id],h2[id]', main);
      items = headings.slice(0, 12).map(h => ({id: h.id, label: labelled(h)}));
    }
    const seen = new Set();
    items = items.filter(item => item.id && !seen.has(item.id) && seen.add(item.id)).slice(0, 12);
    panel.innerHTML = items.map(item => `<a href="#${esc(item.id)}">${esc(item.label)}</a>`).join('') || '<a href="#top">總覽</a>';
  }
  async function loadReports(){
    try {
      const res = await fetch('/reports/index.json', {cache:'no-store'});
      const data = await res.json();
      return Array.isArray(data) && data.length ? data : FALLBACK_REPORTS;
    } catch (error) {
      console.warn('日報檔案暫時使用預設列表', error);
      return FALLBACK_REPORTS;
    }
  }
  function renderArchive(reports){
    const panel = $('.kai-archive-panel');
    if (!panel) return;
    const herePath = normalizePath(location.href);
    const current = herePath.split('/').pop();
    const groups = {};
    reports.forEach(r => {
      const month = String(r.date || '').slice(0, 7) || '日報檔案';
      (groups[month] = groups[month] || []).push(r);
    });
    const html = Object.entries(groups).map(([month, items], idx) => `<details ${idx < 2 ? 'open' : ''}><summary>${esc(month)}</summary><div class="kai-date-list">${items.map(r => {
      const href = absoluteReportHref(r);
      const file = href.split('/').pop();
      const isRelatedDeepDive = r.date && herePath.includes(`/reports/deep-dives/${r.date}-`);
      return `<a class="kai-date-link ${file === current || isRelatedDeepDive ? 'active' : ''}" href="${esc(href)}">${esc(dateLabel(r.date))}</a>`;
    }).join('')}</div></details>`).join('');
    const sideBlock = $('.kai-side-block', panel)?.outerHTML || '';
    panel.innerHTML = `<p class="kai-panel-title zh">日報檔案</p>${html}${sideBlock}`;
  }
  function enhanceHome(reports){
    if (normalizePath(location.href) !== '/') return;
    const latest = reports[0];
    const featured = $('#kai-featured');
    const recent = $('#kai-recent');
    const archive = $('#kai-archive-list');
    const heroToday = $('#kai-hero-today');
    if (latest && heroToday) heroToday.href = absoluteReportHref(latest);
    if (latest && featured) {
      const month = String(latest.date || '').slice(0,7);
      const day = String(latest.date || '').slice(8,10);
      featured.innerHTML = `<div class="kai-home-latest"><div class="kai-date-box"><strong>${esc(day || 'AI')}</strong><span>${esc(month || 'Daily')}</span></div><div><h3>${esc(latest.title || '最新日報')}</h3><p>${esc(latest.summary || '')}</p><div class="kai-actions"><a href="${esc(absoluteReportHref(latest))}">閱讀完整日報 →</a><a class="secondary" href="#archive">瀏覽歷史日報</a></div></div></div>`;
    }
    const rows = (reports || []).slice(1, 4).map(r => `<a class="kai-report-row" href="${esc(absoluteReportHref(r))}"><span>${esc(r.date || '')}</span><span><strong>${esc(r.title || '日報')}</strong><p>${esc(r.summary || '')}</p></span><span class="go">閱讀 →</span></a>`).join('');
    if (recent) recent.innerHTML = rows;
    if (archive) archive.innerHTML = (reports || []).map(r => `<a class="kai-report-row" href="${esc(absoluteReportHref(r))}"><span>${esc(r.date || '')}</span><span><strong>${esc(r.title || '日報')}</strong><p>${esc(r.summary || '')}</p></span><span class="go">閱讀 →</span></a>`).join('');
    const search = $('#kai-report-search');
    if (search && archive) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        const filtered = !q ? reports : reports.filter(r => `${r.date} ${r.title} ${r.summary}`.toLowerCase().includes(q));
        archive.innerHTML = filtered.map(r => `<a class="kai-report-row" href="${esc(absoluteReportHref(r))}"><span>${esc(r.date || '')}</span><span><strong>${esc(r.title || '日報')}</strong><p>${esc(r.summary || '')}</p></span><span class="go">閱讀 →</span></a>`).join('') || '<div class="kai-card"><p>暫時未有符合條件的日報。</p></div>';
      });
    }
  }
  function smoothAnchors(){
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', event => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = $((window.CSS && CSS.escape) ? `#${CSS.escape(href.slice(1))}` : href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        history.replaceState(null, '', href);
      });
    });
  }
  function activeStates(){
    const localLinks = $$('.kai-page-panel a[href^="#"], .kai-site-nav a[href^="#"]');
    const sections = localLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const update = () => {
      let current = sections[0];
      for (const section of sections) if (section.getBoundingClientRect().top < 240) current = section;
      localLinks.forEach(a => a.classList.toggle('active', !!current && a.getAttribute('href') === `#${current.id}`));
      $$('.kai-site-nav a[href^="/"]').forEach(a => {
        const target = normalizePath(a.href);
        const here = normalizePath(location.href);
        a.classList.toggle('active', target === here || (target === '/' && here === '/'));
      });
    };
    update();
    document.addEventListener('scroll', update, {passive:true});
  }
  function patchLegacyLabels(){
    $$('a,summary,h2,h3,p,strong,span,div').forEach(el => {
      if (el.children.length) return;
      const t = el.textContent.trim();
      const map = {
        'Back to archive':'← 歷史日報',
        '← Back to archive':'← 歷史日報',
        'Archive →':'歷史日報 →',
        'Source Links':'公開來源',
        'Sources':'公開來源',
        'Sources and evidence':'公開證據',
        'Executive Summary':'重點摘要',
        'Issue archive':'日報檔案',
        'On this page':'本文導覽',
        'Evidence Matrix':'證據矩陣',
        'Trend Records':'市場訊號',
        'Watchlist / Key Takeaways':'觀察清單',
        'Watchlist / Key takeaways':'觀察清單',
        'Previous issue':'上一期日報',
        '← Previous issue':'← 上一期日報',
        '← Archive':'← 歷史日報',
        'FULL ANALYSIS':'深度分析',
        '2026-05-02 Full Analysis':'2026-05-02 深度分析',
        'Analysis threads':'分析線索',
        'Briefing:':'相關日報：',
        'MARKET SIGNALS':'市場訊號',
        'VALUE CHAIN':'商業鏈條',
        'DEEP ANALYSIS':'深度分析',
        'VALUE':'商業含義',
        'DEMAND':'需求',
        'ECONOMICS':'經濟性',
        'SUPPLY CHAIN':'供應鏈',
        'UNCERTAINTY':'不確定性',
        'FACT':'事實',
        'INFERENCE':'推論',
        'WATCH':'觀察',
        'RISK':'風險',
        'Source':'來源',
        'Full analysis →':'深度分析 →',
        'Read signals →':'閱讀訊號 →',
        'Deep analysis →':'深度分析 →'
      };
      if (map[t]) el.textContent = map[t];
    });
  }
  async function boot(){
    document.body.classList.add('kai-enhanced');
    installTopbar();
    removeLegacyNavigation();
    createLayout();
    patchLegacyLabels();
    renderPageNav();
    const reports = await loadReports();
    renderArchive(reports);
    enhanceHome(reports);
    smoothAnchors();
    activeStates();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
