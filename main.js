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
    'perception': { label: 'Perception', bg: '#eff6ff', c: '#2563eb', b: '#bfdbfe', dBg: 'rgba(37,99,235,0.15)', dC: '#93c5fd' },
    'planning': { label: 'Planning', bg: '#f5f3ff', c: '#7c3aed', b: '#ddd6fe', dBg: 'rgba(124,58,237,0.15)', dC: '#c4b5fd' },
    '3d-geometry': { label: '3D & Geometry', bg: '#ecfeff', c: '#0891b2', b: '#a5f3fc', dBg: 'rgba(8,145,178,0.15)', dC: '#67e8f9' },
    'localization': { label: 'Localization', bg: '#ecfdf5', c: '#059669', b: '#a7f3d0', dBg: 'rgba(5,150,105,0.15)', dC: '#6ee7b7' },
    'language': { label: 'Language', bg: '#fffbeb', c: '#b45309', b: '#fde68a', dBg: 'rgba(217,119,6,0.15)', dC: '#fcd34d' },
    'real-time': { label: 'Real-Time', bg: '#fef2f2', c: '#dc2626', b: '#fecaca', dBg: 'rgba(220,38,38,0.15)', dC: '#fca5a5' },
    'deployed': { label: 'Deployed', bg: '#fdf2f8', c: '#db2777', b: '#fbcfe8', dBg: 'rgba(219,39,119,0.15)', dC: '#f9a8d4' },
    'datasets': { label: 'Datasets', bg: '#f0fdfa', c: '#0d9488', b: '#99f6e4', dBg: 'rgba(13,148,136,0.15)', dC: '#5eead4' }
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
