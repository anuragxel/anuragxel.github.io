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

/* ---------- Featured Cards ---------- */
(function () {
  document.querySelectorAll('.paper-card[data-tags]').forEach(function (card) {
    var tags = card.getAttribute('data-tags').split(',').map(function (t) { return t.trim(); });
    if (tags.indexOf('featured') !== -1) {
      card.classList.add('paper-card--featured');
    }
  });
})();

/* ---------- Research Filters ---------- */
(function () {
  var filters = document.getElementById('research-filters');
  var cards = document.querySelectorAll('.paper-card[data-tags]');
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
    // Query dynamically to include clones added later
    filters.querySelectorAll('.filter-tag').forEach(function (b) { b.classList.remove('filter-tag--active'); });
    removeSearchTag();
  }

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tag');
    if (!btn) return;

    clearActiveFilters();
    // Activate all buttons with same filter value (handles clones)
    var filterVal = btn.dataset.filter;
    filters.querySelectorAll('.filter-tag').forEach(function (b) {
      if (b.dataset.filter === filterVal) b.classList.add('filter-tag--active');
    });
    applyFilter(filterVal);
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
  };
})();

/* ---------- Filter Pill Visibility + Inline Search ---------- */
(function () {
  var research = document.getElementById('research');
  var pill = document.getElementById('filter-pill');
  var pillInput = document.getElementById('filter-pill-input');
  var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  pillInput.placeholder = (isMac ? '⌘K' : 'Ctrl+K') + ' to search…';
  var filters = document.getElementById('research-filters');
  var cards = document.querySelectorAll('.paper-card[data-tags]');
  var ticking = false;

  // Category color map (matches tagMeta in Per-Paper Tag Pills)
  var filterColors = {
    'perception':   { c: '#1e40af', bg: 'rgba(30,64,175,0.15)',   dC: '#93c5fd', dBg: 'rgba(147,196,253,0.18)' },
    'planning':     { c: '#7e22ce', bg: 'rgba(126,34,206,0.15)',  dC: '#c084fc', dBg: 'rgba(192,132,252,0.18)' },
    '3d-geometry':  { c: '#0e7490', bg: 'rgba(14,116,144,0.15)',  dC: '#67e8f9', dBg: 'rgba(103,232,249,0.18)' },
    'localization': { c: '#115e59', bg: 'rgba(17,94,89,0.15)',    dC: '#5eead4', dBg: 'rgba(94,234,212,0.18)' },
    'language':     { c: '#92400e', bg: 'rgba(146,64,14,0.15)',   dC: '#fcd34d', dBg: 'rgba(252,211,77,0.18)' },
    'real-time':    { c: '#991b1b', bg: 'rgba(153,27,27,0.15)',   dC: '#fca5a5', dBg: 'rgba(252,165,165,0.18)' },
    'deployed':     { c: '#9d174d', bg: 'rgba(157,23,77,0.15)',   dC: '#f9a8d4', dBg: 'rgba(249,168,212,0.18)' },
    'datasets':     { c: '#166534', bg: 'rgba(22,101,52,0.15)',   dC: '#86efac', dBg: 'rgba(134,239,172,0.18)' }
  };

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // --- (c) Apply category hover colors via CSS custom properties ---
  function applyFilterColors() {
    var dark = isDark();
    filters.querySelectorAll('.filter-tag[data-filter]').forEach(function (btn) {
      var fc = filterColors[btn.dataset.filter];
      if (fc) {
        btn.style.setProperty('--filter-hover-color', dark ? fc.dC : fc.c);
        btn.style.setProperty('--filter-hover-bg', dark ? fc.dBg : fc.bg);
        btn.style.setProperty('--filter-hover-border', dark ? fc.dC : fc.c);
      }
    });
  }
  applyFilterColors();
  new MutationObserver(applyFilterColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyFilterColors);

  // --- (a) Search feedback: result count badge ---
  var badge = document.createElement('span');
  badge.className = 'filter-pill__badge';
  badge.style.display = 'none';
  pill.querySelector('.filter-pill__search-wrap').appendChild(badge);

  function updateBadge() {
    var visible = 0;
    cards.forEach(function (c) { if (!c.classList.contains('paper-card--hidden')) visible++; });
    var query = pillInput.value.trim();
    if (query) {
      badge.textContent = visible + ' result' + (visible !== 1 ? 's' : '');
      badge.style.display = '';
      pill.classList.add('filter-pill--searching');
    } else {
      badge.style.display = 'none';
      pill.classList.remove('filter-pill--searching');
    }
  }

  // --- (b) Infinite scroll: triple-clone the tags for seamless looping ---
  var originalBtns = Array.from(filters.querySelectorAll('.filter-tag'));
  var setCount = 3; // before + center + after

  // Clone two extra sets
  for (var s = 0; s < setCount - 1; s++) {
    originalBtns.forEach(function (btn) {
      var clone = btn.cloneNode(true);
      clone.classList.remove('filter-tag--active');
      filters.appendChild(clone);
    });
  }

  var allBtns = filters.querySelectorAll('.filter-tag');
  var centerStartIdx = originalBtns.length; // index where center set begins
  var totalPerSet = originalBtns.length;

  // Scroll the active tag to center of the strip
  function scrollToCenter(btn, smooth) {
    var containerRect = filters.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    var offset = btnRect.left - containerRect.left - (containerRect.width / 2) + (btnRect.width / 2);
    filters.scrollBy({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
  }

  // On initial load, mark all "Featured" clones active and center the one in the center set
  allBtns.forEach(function (b) {
    if (b.dataset.filter === 'featured') b.classList.add('filter-tag--active');
  });
  requestAnimationFrame(function () {
    var centerFeatured = allBtns[centerStartIdx]; // first of center set = Featured
    if (centerFeatured) scrollToCenter(centerFeatured, false);
  });

  // Convert vertical wheel scroll to horizontal on the tag strip
  filters.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      filters.scrollLeft += e.deltaY;
    }
  }, { passive: false });


  var snapTimeout = null;
  filters.addEventListener('scroll', function () {
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(function () {
      var scrollLeft = filters.scrollLeft;
      var scrollWidth = filters.scrollWidth;
      var clientWidth = filters.clientWidth;
      var oneSetWidth = scrollWidth / setCount;

      // If scrolled into the first clone set, jump forward
      if (scrollLeft < oneSetWidth * 0.3) {
        filters.scrollLeft = scrollLeft + oneSetWidth;
      }
      // If scrolled into the last clone set, jump back
      else if (scrollLeft > oneSetWidth * 1.7) {
        filters.scrollLeft = scrollLeft - oneSetWidth;
      }
    }, 120);
  }, { passive: true });

  // Handle click on any filter tag (original or clone) — delegate
  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tag');
    if (!btn) return;

    // Clear search input
    pillInput.value = '';

    // Clear all active states across all clones
    allBtns.forEach(function (b) { b.classList.remove('filter-tag--active'); });

    // Activate all buttons with same filter value
    var filterVal = btn.dataset.filter;
    allBtns.forEach(function (b) {
      if (b.dataset.filter === filterVal) b.classList.add('filter-tag--active');
    });

    // Scroll clicked button to center
    scrollToCenter(btn, true);

    updateBadge();
  });

  // --- Pill visibility ---
  function check() {
    var rect = research.getBoundingClientRect();
    var show = rect.top <= window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.3;
    pill.classList.toggle('filter-pill--visible', show);
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { check(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  check();

  // --- Inline search ---
  var debounceTimer = null;
  pillInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var query = pillInput.value.trim();
    debounceTimer = setTimeout(function () {
      if (query) {
        window.__applySearchFilter(query);
        // Deactivate all filter tags when searching
        allBtns.forEach(function (b) { b.classList.remove('filter-tag--active'); });
      } else {
        // Empty — restore featured filter
        var featuredBtn = filters.querySelector('.filter-tag[data-filter="featured"]');
        if (featuredBtn) featuredBtn.click();
      }
      updateBadge();
    }, 200);
  });
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

