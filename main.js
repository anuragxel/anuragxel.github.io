/* ============================================
   Anurag Ghosh — Personal Website Scripts
   ============================================ */

/* ---------- Theme Toggle ---------- */
(function () {
  var toggle = document.getElementById('theme-toggle');
  var root = document.documentElement;
  var stored = localStorage.getItem('theme');

  if (stored) {
    root.setAttribute('data-theme', stored);
  } else {
    root.setAttribute('data-theme', 'light');
  }

  toggle.addEventListener('click', function () {
    var current = root.getAttribute('data-theme');
    var isDark = current === 'dark' ||
      (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var next = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

/* ---------- Research Filters ---------- */
(function () {
  var filters = document.getElementById('research-filters');
  var cards = document.querySelectorAll('.paper-card[data-tags]');
  var buttons = filters.querySelectorAll('.filter-tag');
  var searchTag = null; // dynamic "Search: ..." button

  function applyFilter(filter) {
    cards.forEach(function (card) {
      if (filter === 'all') {
        card.classList.remove('paper-card--hidden');
      } else {
        var tags = card.dataset.tags.split(',').map(function (t) { return t.trim(); });
        if (tags.includes(filter)) {
          card.classList.remove('paper-card--hidden');
        } else {
          card.classList.add('paper-card--hidden');
        }
      }
    });
  }

  function removeSearchTag() {
    if (searchTag && searchTag.parentNode) {
      searchTag.parentNode.removeChild(searchTag);
      searchTag = null;
    }
  }

  function clearActiveFilters() {
    buttons.forEach(function (b) { b.classList.remove('filter-tag--active'); });
    removeSearchTag();
  }

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tag');
    if (!btn) return;

    clearActiveFilters();
    btn.classList.add('filter-tag--active');
    applyFilter(btn.dataset.filter);
  });

  // Initialize filter based on default active button
  var activeBtn = filters.querySelector('.filter-tag--active');
  if (activeBtn) {
    applyFilter(activeBtn.dataset.filter);
  }

  // Expose search filter for the command palette
  window.__applySearchFilter = function (query) {
    if (!query) return;
    clearActiveFilters();

    // Build haystack for each card and filter
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    cards.forEach(function (card) {
      var title = (card.querySelector('.paper-card__title') || {}).textContent || '';
      var authors = (card.querySelector('.paper-card__authors') || {}).textContent || '';
      var desc = (card.querySelector('.paper-card__desc') || {}).textContent || '';
      var venue = (card.querySelector('.paper-card__venue') || {}).textContent || '';
      var keywords = card.dataset.keywords || '';
      var tags = card.dataset.tags || '';
      var haystack = [title, authors, desc, venue, keywords, tags].join(' ').toLowerCase();
      var match = words.every(function (w) { return haystack.indexOf(w) !== -1; });
      card.classList.toggle('paper-card--hidden', !match);
    });

    // Create/update the search tag button
    removeSearchTag();
    searchTag = document.createElement('button');
    searchTag.className = 'filter-tag filter-tag--active filter-tag--search';
    searchTag.textContent = '🔍 "' + query + '" ✕';
    searchTag.addEventListener('click', function (e) {
      e.stopPropagation();
      removeSearchTag();
      // Reset to "Featured"
      var featuredBtn = filters.querySelector('.filter-tag[data-filter="featured"]');
      if (featuredBtn) {
        featuredBtn.classList.add('filter-tag--active');
        applyFilter('featured');
      }
    });
    filters.appendChild(searchTag);
  };
})();

/* ---------- Sidebar Observer ---------- */
(function () {
  var research = document.getElementById('research');
  var filters = document.getElementById('research-filters');
  var mql = window.matchMedia('(min-width: 1280px)');
  var ticking = false;

  function check() {
    if (!mql.matches) {
      filters.classList.remove('sidebar-visible');
      return;
    }
    var rect = research.getBoundingClientRect();
    var show = rect.top <= 80 && rect.bottom > window.innerHeight * 0.3;
    filters.classList.toggle('sidebar-visible', show);
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { check(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  mql.addEventListener('change', check);
  check();
})();

/* ---------- Per-Paper Tag Pills ---------- */
(function () {
  var tagMeta = {
    'perception': { label: 'Perception', bg: 'rgba(30,64,175,0.10)', c: '#1e40af', b: 'transparent', dBg: 'rgba(147,196,253,0.12)', dC: '#93c5fd' },
    'planning': { label: 'Planning', bg: 'rgba(126,34,206,0.10)', c: '#7e22ce', b: 'transparent', dBg: 'rgba(192,132,252,0.12)', dC: '#c084fc' },
    '3d-geometry': { label: '3D & Geometry', bg: 'rgba(14,116,144,0.10)', c: '#0e7490', b: 'transparent', dBg: 'rgba(103,232,249,0.12)', dC: '#67e8f9' },
    'localization': { label: 'Localization', bg: 'rgba(17,94,89,0.10)', c: '#115e59', b: 'transparent', dBg: 'rgba(94,234,212,0.12)', dC: '#5eead4' },
    'language': { label: 'Language', bg: 'rgba(146,64,14,0.10)', c: '#92400e', b: 'transparent', dBg: 'rgba(252,211,77,0.12)', dC: '#fcd34d' },
    'real-time': { label: 'Real-Time', bg: 'rgba(153,27,27,0.10)', c: '#991b1b', b: 'transparent', dBg: 'rgba(252,165,165,0.12)', dC: '#fca5a5' },
    'deployed': { label: 'Deployed', bg: 'rgba(157,23,77,0.10)', c: '#9d174d', b: 'transparent', dBg: 'rgba(249,168,212,0.12)', dC: '#f9a8d4' },
    'datasets': { label: 'Datasets', bg: 'rgba(22,101,52,0.10)', c: '#166534', b: 'transparent', dBg: 'rgba(134,239,172,0.12)', dC: '#86efac' }
  };

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyColors() {
    var dark = isDark();
    document.querySelectorAll('.paper-card__tag').forEach(function (el) {
      var m = tagMeta[el.dataset.tagType];
      if (!m) return;
      el.style.setProperty('--tag-bg', dark ? m.dBg : m.bg);
      el.style.setProperty('--tag-color', dark ? m.dC : m.c);
      el.style.setProperty('--tag-border', dark ? 'transparent' : m.b);
    });
  }

  // Generate tag pills
  document.querySelectorAll('.paper-card[data-tags]').forEach(function (card) {
    var tags = card.dataset.tags.split(',').map(function (t) { return t.trim(); })
      .filter(function (t) { return t && t !== 'featured' && tagMeta[t]; });
    if (!tags.length) return;

    var container = document.createElement('div');
    container.className = 'paper-card__tags';
    tags.forEach(function (tag) {
      var el = document.createElement('span');
      el.className = 'paper-card__tag';
      el.dataset.tagType = tag;
      el.textContent = tagMeta[tag].label;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var filterBtn = document.querySelector('.filter-tag[data-filter="' + tag + '"]');
        if (filterBtn) filterBtn.click();
        document.getElementById('research').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      container.appendChild(el);
    });
    card.querySelector('.paper-card__body').appendChild(container);
  });

  applyColors();

  // Re-apply on theme changes
  new MutationObserver(applyColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColors);
})();

/* ---------- Section Nav ---------- */
(function () {
  var navToggle = document.getElementById('nav-toggle');
  var dropdown = document.getElementById('nav-dropdown');
  var links = dropdown.querySelectorAll('.nav-dropdown__link');
  var cmdHint = document.getElementById('cmd-k-hint');

  navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('nav-dropdown--open');
  });

  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== navToggle) {
      dropdown.classList.remove('nav-dropdown--open');
    }
  });

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      dropdown.classList.remove('nav-dropdown--open');
    });
  });

  // Highlight active section
  var sections = ['top', 'research', 'press', 'links'];
  var ticking = false;
  var indicator = document.getElementById('section-indicator');
  var indicatorItems = indicator.querySelectorAll('.section-indicator__item');

  function highlightActive() {
    var scrollY = window.scrollY + 120;
    var active = 'top';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) active = id;
    });
    links.forEach(function (link) {
      link.classList.toggle('nav-dropdown__link--active', link.dataset.section === active);
    });
    // Update floating indicator
    indicatorItems.forEach(function (item) {
      item.classList.toggle('section-indicator__item--active', item.dataset.section === active);
    });
    // Show indicator after scrolling past hero
    indicator.classList.toggle('section-indicator--visible', window.scrollY > 300);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { highlightActive(); ticking = false; }); ticking = true; }
  }, { passive: true });
  highlightActive();

  // Open command palette from dropdown hint
  cmdHint.addEventListener('click', function () {
    dropdown.classList.remove('nav-dropdown--open');
    document.getElementById('cmd-overlay').classList.add('cmd-palette-overlay--open');
    document.getElementById('cmd-input').focus();
  });
})();


/* ---------- Command Palette ---------- */
(function () {
  var overlay = document.getElementById('cmd-overlay');
  var input = document.getElementById('cmd-input');
  var results = document.getElementById('cmd-results');
  var activeIdx = -1;

  // Build search index
  var items = [];
  // Papers — index title, authors, description, venue, keywords, and tags
  document.querySelectorAll('.paper-card').forEach(function (card) {
    var title = (card.querySelector('.paper-card__title') || {}).textContent || '';
    var authors = (card.querySelector('.paper-card__authors') || {}).textContent || '';
    var desc = (card.querySelector('.paper-card__desc') || {}).textContent || '';
    var venue = (card.querySelector('.paper-card__venue') || {}).textContent || '';
    var keywords = card.dataset.keywords || '';
    var tags = (card.dataset.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var haystack = [title, authors, desc, venue, keywords].concat(tags).join(' ').toLowerCase();
    items.push({ type: 'paper', icon: '📄', title: title.trim(), sub: authors.trim(), el: card, haystack: haystack });
  });
  // Sections
  [{ id: 'top', label: 'Home', icon: '🏠' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'press', label: 'Press', icon: '📰' },
  { id: 'links', label: 'Inspiring Links', icon: '✨' }
  ].forEach(function (s) {
    items.push({ type: 'section', icon: s.icon, title: s.label, sub: 'Section', el: document.getElementById(s.id), haystack: s.label.toLowerCase() });
  });
  // Filter tags
  document.querySelectorAll('.filter-tag').forEach(function (btn) {
    var label = btn.textContent.trim();
    items.push({ type: 'filter', icon: '🏷', title: 'Filter: ' + label, sub: 'Research filter', el: btn, haystack: label.toLowerCase() });
  });

  function matchItem(query, item) {
    // Simple case-insensitive substring search — split query into words, all must match
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.every(function (w) { return item.haystack.indexOf(w) !== -1; });
  }

  function render(query) {
    results.innerHTML = '';
    activeIdx = -1;
    var filtered = query
      ? items.filter(function (it) {
        return matchItem(query, it);
      })
      : items;

    if (!filtered.length) {
      results.innerHTML = '<div class="cmd-palette__empty">No results found</div>';
      return;
    }

    filtered.forEach(function (it, i) {
      var div = document.createElement('div');
      div.className = 'cmd-palette__item';
      div.dataset.index = i;
      div.innerHTML = '<span class="cmd-palette__item-icon">' + it.icon + '</span>' +
        '<div class="cmd-palette__item-text">' +
        '<div class="cmd-palette__item-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="cmd-palette__item-sub">' + escapeHtml(it.sub) + '</div></div>';
      div.addEventListener('click', function () { selectItem(it); });
      results.appendChild(div);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function selectItem(item) {
    close();
    if (item.type === 'filter') {
      item.el.click();
    } else if (item.el) {
      // If selecting a paper, make sure it's visible by switching to "All" filter
      if (item.type === 'paper' && item.el.classList.contains('paper-card--hidden')) {
        var allBtn = document.querySelector('.filter-tag[data-filter="all"]');
        if (allBtn) allBtn.click();
      }
      item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function open() {
    overlay.classList.add('cmd-palette-overlay--open');
    input.value = '';
    render('');
    setTimeout(function () { input.focus(); }, 50);
  }

  function close() {
    overlay.classList.remove('cmd-palette-overlay--open');
    input.value = '';
  }

  // Keyboard shortcut: Cmd+K / Ctrl+K
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('cmd-palette-overlay--open')) { close(); } else { open(); }
    }
    if (e.key === 'Escape' && overlay.classList.contains('cmd-palette-overlay--open')) {
      close();
    }
    // Arrow nav
    if (!overlay.classList.contains('cmd-palette-overlay--open')) return;
    var itemEls = results.querySelectorAll('.cmd-palette__item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, itemEls.length - 1);
      itemEls.forEach(function (el, i) { el.classList.toggle('cmd-palette__item--active', i === activeIdx); });
      if (itemEls[activeIdx]) itemEls[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      itemEls.forEach(function (el, i) { el.classList.toggle('cmd-palette__item--active', i === activeIdx); });
      if (itemEls[activeIdx]) itemEls[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < itemEls.length) {
        itemEls[activeIdx].click();
      } else {
        // No item selected — apply as a text search filter
        var query = input.value.trim();
        if (query) {
          close();
          window.__applySearchFilter(query);
          document.getElementById('research').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });

  input.addEventListener('input', function () { render(input.value.trim()); });

  // Click outside to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  // Initial render
  render('');

  // Search hint click opens palette
  var searchHint = document.getElementById('search-hint');
  if (searchHint) {
    searchHint.addEventListener('click', function () { open(); });
  }
})();

/* ---------- Easter Egg ---------- */
(function () {
  var heroName = document.getElementById('footer-anurag');
  var overlay = document.getElementById('easter-egg-overlay');
  var iframe = document.getElementById('easter-egg-iframe');
  var closeBtn = document.getElementById('easter-egg-close');
  var videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';

  function openEgg() {
    iframe.src = videoUrl;
    overlay.classList.add('easter-egg-overlay--open');
  }

  function closeEgg() {
    overlay.classList.remove('easter-egg-overlay--open');
    // Stop video by clearing src
    setTimeout(function () { iframe.src = ''; }, 300);
  }

  heroName.addEventListener('click', openEgg);
  closeBtn.addEventListener('click', closeEgg);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeEgg();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('easter-egg-overlay--open')) {
      closeEgg();
    }
  });
})();

/* ---------- Quote Scramble ---------- */
(function () {
  var el = document.getElementById('footer-quote');
  if (!el) return;

  var quotes = [
    {
      text: 'I must study Politicks and War that my sons may have liberty to study Mathematicks and Philosophy. My sons ought to study Mathematicks and Philosophy, Geography, Natural History, Naval Architecture, Navigation, Commerce and Agriculture, in order to give their children a right to study Painting, Poetry, Musick, Architecture, Statuary, Tapestry and Porcelaine.',
      attribution: '— John Adams, American Founding Father'
    },
    {
      text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      attribution: '— भगवान श्रीकृष्ण ने अर्जुन से कुरुक्षेत्र की युद्धभूमि पर कहा।'
    }
  ];
  // Mixed character pool: Latin + Devanagari for the scramble noise
  var latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var devanagari = 'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह';
  var pool = latin + devanagari;

  var currentIndex = 0;
  var autoTimer = null;
  var animFrame = null;
  var isAnimating = false;

  function randomChar() {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function setQuoteImmediate(idx) {
    var q = quotes[idx];
    el.textContent = q.text + '\n' + q.attribution;
  }

  function scrambleTo(idx, callback) {
    if (isAnimating) {
      // Cancel running animation
      cancelAnimationFrame(animFrame);
    }
    isAnimating = true;

    var target = quotes[idx].text + '\n' + quotes[idx].attribution;
    // Split target into array of characters (handles multi-byte Unicode)
    var targetChars = Array.from(target);
    var len = targetChars.length;

    // Each position gets a number of scramble iterations before resolving
    var iterationsPerChar = 4;
    var totalStaggerMs = 600; // total wave duration budget, spread across all chars
    var staggerMs = Math.min(12, totalStaggerMs / Math.max(len, 1));
    var frameMs = 30; // ms per scramble frame

    // Current display array — start with random chars of the target length
    var display = [];
    for (var i = 0; i < len; i++) {
      display[i] = targetChars[i] === '\n' ? '\n' : targetChars[i] === ' ' ? ' ' : randomChar();
    }

    // Resolve state per character: how many scramble frames remain
    var remaining = [];
    for (var j = 0; j < len; j++) {
      if (targetChars[j] === ' ' || targetChars[j] === '\n') {
        remaining[j] = 0; // spaces and newlines resolve instantly
      } else {
        // Stagger: characters further right get more iterations
        remaining[j] = iterationsPerChar + Math.floor(j * staggerMs / frameMs);
      }
    }

    var startTime = performance.now();

    function tick() {
      var elapsed = performance.now() - startTime;
      var frame = Math.floor(elapsed / frameMs);
      var allDone = true;

      for (var k = 0; k < len; k++) {
        if (remaining[k] <= 0) {
          display[k] = targetChars[k];
        } else {
          // Count down based on frame number, factoring in stagger
          var charFrame = frame - Math.floor(k * staggerMs / frameMs);
          if (charFrame >= iterationsPerChar) {
            remaining[k] = 0;
            display[k] = targetChars[k];
          } else if (charFrame >= 0) {
            display[k] = randomChar();
            allDone = false;
          } else {
            // Not started yet — keep as random
            display[k] = randomChar();
            allDone = false;
          }
        }
      }

      el.textContent = display.join('');

      if (allDone) {
        isAnimating = false;
        if (callback) callback();
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    }

    animFrame = requestAnimationFrame(tick);
  }

  function switchToNext() {
    var nextIndex = (currentIndex + 1) % quotes.length;
    scrambleTo(nextIndex, function () {
      currentIndex = nextIndex;
    });
  }

  function startAutoRotate() {
    clearInterval(autoTimer);
    autoTimer = setInterval(switchToNext, 8000);
  }

  // Click to switch immediately
  el.addEventListener('click', function () {
    clearInterval(autoTimer);
    switchToNext();
    startAutoRotate();
  });

  // Initialize with first quote (no animation)
  setQuoteImmediate(0);
  startAutoRotate();
})();

/* ---------- Scroll Hue Shift ---------- */
(function () {
  var maxShift = 15; // degrees
  var ticking = false;
  function update() {
    var scrollH = document.body.scrollHeight - window.innerHeight;
    var fraction = scrollH > 0 ? window.scrollY / scrollH : 0;
    var hue = fraction * maxShift;
    document.documentElement.style.setProperty('--hue-shift', hue + 'deg');
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
})();

/* ---------- Paper Texture Generator ---------- */
(function () {
  function generatePaperTexture(size, fiberCount, opacity) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // Draw random fibers
    for (var i = 0; i < fiberCount; i++) {
      var x1 = Math.random() * size;
      var y1 = Math.random() * size;
      var angle = Math.random() * Math.PI;
      var len = 3 + Math.random() * 8;
      var x2 = x1 + Math.cos(angle) * len;
      var y2 = y1 + Math.sin(angle) * len;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 0.5 + Math.random() * 1;

      // Shadow pass — faint, wider, slightly offset
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,' + (opacity * 0.3) + ')';
      ctx.lineWidth += 1.5;
      ctx.translate(0.5, 0.8);
      ctx.stroke();
      ctx.restore();

      // Main fiber
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 0.5 + Math.random() * 1;

      if (Math.random() > 0.5) {
        ctx.strokeStyle = 'rgba(0,0,0,' + (opacity * (0.5 + Math.random() * 0.5)) + ')';
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,' + (opacity * 1.5 * (0.5 + Math.random() * 0.5)) + ')';
      }
      ctx.stroke();
    }

    // Add tiny dots/specks
    for (var j = 0; j < fiberCount * 0.3; j++) {
      var dx = Math.random() * size;
      var dy = Math.random() * size;
      var r = 0.3 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      if (Math.random() > 0.5) {
        ctx.fillStyle = 'rgba(0,0,0,' + (opacity * 0.6) + ')';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,' + (opacity * 1.2) + ')';
      }
      ctx.fill();
    }

    // Soften fibers to feel like paper
    ctx.filter = 'blur(1px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

    return canvas.toDataURL('image/png');
  }

  var bodyUrl = generatePaperTexture(400, 32, 0.06);
  var cardUrl = generatePaperTexture(300, 32, 0.05);
  var cardStyleEl = document.createElement('style');
  document.head.appendChild(cardStyleEl);

  var bodyGradients =
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.022) 0px, transparent 1px, transparent 5px),' +
    'repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0px, transparent 1px, transparent 6px),' +
    'repeating-linear-gradient(30deg, rgba(0,0,0,0.014) 0px, transparent 1px, transparent 8px),' +
    'repeating-linear-gradient(150deg, rgba(255,255,255,0.26) 0px, transparent 1px, transparent 7px)';
  var bodySizes = '12px 12px, 14px 14px, 18px 18px, 16px 16px, 200px 200px';

  var cardGradients =
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0px, transparent 1px, transparent 5px),' +
    'repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0px, transparent 1px, transparent 6px),' +
    'repeating-linear-gradient(45deg, rgba(0,0,0,0.012) 0px, transparent 1px, transparent 7px),' +
    'repeating-linear-gradient(135deg, rgba(0,0,0,0.01) 0px, transparent 1px, transparent 8px),' +
    'repeating-linear-gradient(22deg, rgba(255,255,255,0.2) 0px, transparent 1px, transparent 6px),' +
    'repeating-linear-gradient(67deg, rgba(0,0,0,0.012) 0px, transparent 1px, transparent 9px),' +
    'repeating-linear-gradient(112deg, rgba(255,255,255,0.16) 0px, transparent 1px, transparent 7px)';
  var cardSizes = '10px 10px, 12px 12px, 14px 14px, 16px 16px, 11px 11px, 18px 18px, 13px 13px, 300px 300px';

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTextures() {
    if (isDark()) {
      document.body.style.removeProperty('background-image');
      document.body.style.removeProperty('background-size');
      cardStyleEl.textContent = '';
      return;
    }
    // document.body.style.backgroundImage = bodyGradients + ', url(' + bodyUrl + ')';
    // document.body.style.backgroundSize = bodySizes;
    // cardStyleEl.textContent = '.paper-card { background-image: ' + cardGradients + ', url(' + cardUrl + ') !important; background-size: ' + cardSizes + ' !important; }';
  }

  applyTextures();

  // Re-apply on theme changes
  new MutationObserver(applyTextures).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTextures);
})();
