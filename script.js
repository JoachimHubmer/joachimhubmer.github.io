// ===== Theme =====
function initTheme() {
  var saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateToggleIcon();
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateToggleIcon();
}

function updateToggleIcon() {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '\u2600' : '\u263E';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

// ===== Mobile nav =====
function initMobileNav() {
  var btn = document.querySelector('.nav-hamburger');
  var links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', function () { links.classList.toggle('open'); });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); });
  });
}

// ===== Render papers from JSON =====
function chevronSVG() {
  return '<svg class="paper-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function buildLinks(p) {
  var html = '';
  if (p.pdf) html += '<a href="' + p.pdf + '">paper</a>';
  if (p.supplement) html += '<a href="' + p.supplement + '">supplemental material</a>';
  if (p.appendix) html += '<a href="' + p.appendix + '">online appendix</a>';
  if (p.code) html += '<a href="' + p.code + '">code</a>';
  if (p.slides) html += '<a href="' + p.slides + '">slides</a>';
  return html;
}

function buildMeta(p) {
  var parts = [];
  if (p.authors) parts.push(escapeHtml(p.authors));
  if (p.year) parts.push(escapeHtml(String(p.year)));
  // Journal info
  if (p.journal) {
    var jStr = '<em>' + escapeHtml(p.journal) + '</em>';
    if (p.volume) jStr += ', ' + escapeHtml(p.volume);
    parts.push(jStr);
  }
  var meta = parts.join('. ');
  if (meta) meta += '.';
  // DOI
  if (p.doi) {
    meta += ' (<a href="' + p.doi + '">doi</a>)';
  }
  // Status (e.g., "Forthcoming at...", "Conditionally Accepted at...")
  if (p.status) {
    if (meta) meta += ' ';
    meta += '<em>' + escapeHtml(p.status) + '</em>.';
  }
  return meta;
}

function renderPaper(p, isDiscussion) {
  var hasAbstract = p.abstract && p.abstract.trim() !== '';
  var html = '<div class="paper">';
  html += '<div class="paper-header">';
  html += '<div>';

  if (isDiscussion) {
    html += '<div class="paper-title">\u201C' + escapeHtml(p.title) + '\u201D</div>';
    var meta = '';
    if (p.discussedAuthors) meta += escapeHtml(p.discussedAuthors) + '. ';
    if (p.venue) meta += '<em>' + escapeHtml(p.venue) + '</em>.';
    html += '<div class="paper-meta">' + meta + '</div>';
  } else {
    html += '<div class="paper-title">' + escapeHtml(p.title) + '</div>';
    html += '<div class="paper-meta">' + buildMeta(p) + '</div>';
  }

  var links = buildLinks(p);
  if (links) html += '<div class="paper-links">' + links + '</div>';
  if (p.note) html += '<div class="paper-note">(' + escapeHtml(p.note) + ')</div>';
  html += '</div>'; // close inner div

  if (hasAbstract) html += chevronSVG();
  html += '</div>'; // close paper-header

  if (hasAbstract) {
    html += '<div class="paper-abstract">' + escapeHtml(p.abstract) + '</div>';
  }

  html += '</div>'; // close paper
  return html;
}

function renderSection(container, papers, isDiscussion) {
  var html = '';
  papers.forEach(function (p) { html += renderPaper(p, isDiscussion); });
  container.innerHTML = html;
}

function initPapers() {
  var wpEl = document.getElementById('working-papers');
  var pubEl = document.getElementById('publications');
  var discEl = document.getElementById('discussions');
  if (!wpEl && !pubEl && !discEl) return;

  fetch('papers.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (wpEl && data.working) renderSection(wpEl, data.working, false);
      if (pubEl && data.publications) renderSection(pubEl, data.publications, false);
      if (discEl && data.discussions) renderSection(discEl, data.discussions, true);
      // Attach click handlers after rendering
      document.querySelectorAll('.paper-header').forEach(function (header) {
        var paper = header.closest('.paper');
        var abstract = paper.querySelector('.paper-abstract');
        if (abstract) {
          header.style.cursor = 'pointer';
          header.addEventListener('click', function (e) {
            // Don't toggle when clicking links
            if (e.target.closest('a')) return;
            paper.classList.toggle('open');
          });
        }
      });
    })
    .catch(function (err) {
      console.error('Failed to load papers.json:', err);
    });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initMobileNav();
  initPapers();
});
