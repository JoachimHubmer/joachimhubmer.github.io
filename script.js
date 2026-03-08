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

function escapeAttr(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '&#10;');
}

function buildLinks(p) {
  var html = '';
  if (p.pdf) html += '<a href="' + p.pdf + '">paper</a>';
  else if (p.doi) html += '<a href="' + p.doi + '">paper</a>';
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
  var bib = generateBibtex(p);
  if (bib) links += '<a href="#" class="cite-btn" data-bibtex="' + escapeAttr(bib) + '">bibtex</a>';
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
      // Attach cite button handlers
      document.querySelectorAll('.cite-btn').forEach(function (btn) {
        btn.addEventListener('click', handleCiteClick);
      });
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

// ===== Active nav highlighting =====
function initNavHighlight() {
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -60% 0px' });

  sections.forEach(function (s) { observer.observe(s); });
}

// ===== Cite (BibTeX) =====
function generateBibtex(p) {
  if (!p.bibtex) return null;
  var b = p.bibtex;
  var lines = ['@' + b.type + '{' + b.key + ','];
  lines.push('  title = {' + p.title + '},');
  if (b.author) lines.push('  author = {' + b.author + '},');
  if (p.year) lines.push('  year = {' + p.year + '},');
  var journal = b.journal || p.journal;
  if (journal) lines.push('  journal = {' + journal + '},');
  if (b.volume) lines.push('  volume = {' + b.volume + '},');
  if (b.pages) lines.push('  pages = {' + b.pages + '},');
  if (b.publisher) lines.push('  publisher = {' + b.publisher + '},');
  if (p.doi) lines.push('  doi = {' + p.doi.replace(/^https?:\/\/doi\.org\//, '') + '},');
  lines.push('}');
  return lines.join('\n');
}

function handleCiteClick(e) {
  e.preventDefault();
  e.stopPropagation();
  var btn = e.currentTarget;
  var bib = btn.getAttribute('data-bibtex');
  if (!bib) return;
  navigator.clipboard.writeText(bib).then(function () {
    var orig = btn.textContent;
    btn.textContent = 'copied!';
    setTimeout(function () { btn.textContent = orig; }, 1500);
  });
}

// ===== Particles =====
function initParticles() {
  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dots = [];
  var count = 40;
  var maxDist = 100;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < count; i++) {
    dots.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var dotColor = isDark ? 'rgba(130,175,211,' : 'rgba(1,31,91,';

    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
      if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

      ctx.beginPath();
      ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = dotColor + '0.3)';
      ctx.fill();

      for (var j = i + 1; j < dots.length; j++) {
        var dx = dots[j].x - d.x;
        var dy = dots[j].y - d.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = dotColor + (0.15 * (1 - dist / maxDist)) + ')';
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ===== Easter egg: econ rain =====
var econTerms = [
  'wealth', 'inequality', 'capital', 'labor', 'TFP', 'markup', 'GDP',
  'returns to scale', 'entrepreneurship', 'frictions', 'misallocation',
  'automation', 'earnings', 'savings', 'technology', 'preferences',
  'corporate tax', 'debt', 'equity', 'investment', 'demand', 'supply',
  'productivity', 'wages', 'consumption', 'portfolio', 'elasticity',
  'calibration', 'heterogeneity', 'equilibrium', 'search', 'matching',
  'job ladder', 'human capital', 'monopsony', 'concentration',
  'labor share', 'tax wedge', 'pass-through', 'C corporation',
  'Old Money', 'New Money', 'inheritance', 'top 0.1%', 'median firm',
  'β', 'α', 'σ', 'λ', 'π', 'δ', '∂', '∫', 'Σ', '∞'
];

function initEconRain() {
  var photo = document.querySelector('.home-photo');
  if (!photo) return;
  var raining = false;
  var clickCount = 0;
  var clickTimer = null;

  photo.addEventListener('click', function () {
    if (raining) return;
    clickCount++;
    clearTimeout(clickTimer);
    if (clickCount < 3) {
      clickTimer = setTimeout(function () { clickCount = 0; }, 800);
      return;
    }
    clickCount = 0;
    raining = true;

    var overlay = document.createElement('div');
    overlay.className = 'econ-rain-overlay';
    document.body.appendChild(overlay);

    var cols = Math.floor(window.innerWidth / 120);
    var spawned = 0;
    var total = cols * 6;

    function spawnDrop() {
      if (spawned >= total) return;
      var el = document.createElement('span');
      el.className = 'econ-rain-drop';
      el.textContent = econTerms[Math.floor(Math.random() * econTerms.length)];
      el.style.left = (Math.random() * 96 + 2) + '%';
      el.style.animationDuration = (2 + Math.random() * 3) + 's';
      el.style.fontSize = (0.7 + Math.random() * 0.6) + 'rem';
      el.style.opacity = (0.3 + Math.random() * 0.5);
      overlay.appendChild(el);
      spawned++;
      el.addEventListener('animationend', function () { el.remove(); });
    }

    var interval = setInterval(function () {
      for (var i = 0; i < cols; i++) spawnDrop();
    }, 400);

    setTimeout(function () {
      clearInterval(interval);
      setTimeout(function () {
        overlay.remove();
        raining = false;
      }, 4000);
    }, 3000);
  });
}

// ===== Typewriter =====
function initTypewriter() {
  var el = document.querySelector('.typewriter');
  if (!el) return;
  var text = el.getAttribute('data-text');
  var i = 0;
  el.textContent = '';
  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, 80);
    } else {
      el.classList.add('typewriter-done');
    }
  }
  setTimeout(type, 400);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initMobileNav();
  initPapers();
  initNavHighlight();
  initParticles();
  initEconRain();
  initTypewriter();
});
