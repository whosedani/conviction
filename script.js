/* CONVICTION — protect your conviction */

(function () {
  'use strict';

  var DEFAULTS = {
    ca: '',
    twitter: 'https://x.com/',
    community: 'https://x.com/',
    buy: 'https://pump.fun/'
  };

  var config = Object.assign({}, DEFAULTS);

  /* ---------- config ---------- */

  function applyConfig() {
    var caText = config.ca && config.ca.length ? config.ca : 'soon.';

    document.querySelectorAll('.js-ca').forEach(function (el) {
      el.textContent = caText;
    });

    document.querySelectorAll('.js-x').forEach(function (el) {
      el.href = config.twitter || DEFAULTS.twitter;
    });

    document.querySelectorAll('.js-community').forEach(function (el) {
      el.href = config.community || DEFAULTS.community;
    });

    document.querySelectorAll('.js-buy').forEach(function (el) {
      el.href = config.buy || DEFAULTS.buy;
    });
  }

  fetch('/api/config')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && typeof data === 'object') {
        config = Object.assign({}, DEFAULTS, data);
      }
      applyConfig();
    })
    .catch(function () {
      applyConfig();
    });

  applyConfig();

  /* ---------- copy CA + toast ---------- */

  var toast = document.getElementById('toast');
  var toastTimer = null;

  function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 1600);
  }

  function copyCA() {
    if (!config.ca || !config.ca.length) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(config.ca).then(showToast, showToast);
    } else {
      var ta = document.createElement('textarea');
      ta.value = config.ca;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      showToast();
    }
  }

  document.querySelectorAll('.js-copy').forEach(function (el) {
    el.addEventListener('click', copyCA);
  });

  /* ---------- the archive gallery ---------- */

  var track = document.getElementById('galTrack');

  if (track) {
    var cards = Array.prototype.slice.call(track.querySelectorAll('.tweet'));
    var prevBtn = document.querySelector('.gal-prev');
    var nextBtn = document.querySelector('.gal-next');
    var counter = document.getElementById('galIndex');
    var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    var current = 0;
    var ticking = false;

    function nearestCard() {
      var center = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      cards.forEach(function (card, i) {
        var cardCenter = card.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(cardCenter - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function setActive(idx) {
      if (idx === current && cards[idx].classList.contains('active')) return;
      current = idx;
      cards.forEach(function (card, i) {
        card.classList.toggle('active', i === idx);
      });
      if (counter) counter.textContent = ROMAN[idx] || String(idx + 1);
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === cards.length - 1;
    }

    function scrollToCard(idx) {
      idx = Math.max(0, Math.min(cards.length - 1, idx));
      var card = cards[idx];
      var left = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
      track.scrollTo({ left: left, behavior: 'smooth' });
      setActive(idx);
    }

    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        setActive(nearestCard());
        ticking = false;
      });
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollToCard(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollToCard(current + 1); });

    window.addEventListener('resize', function () { setActive(nearestCard()); });

    setActive(0);
  }

  /* ---------- staggered reveal ---------- */

  var reveals = document.querySelectorAll('.reveal');
  var quote = document.querySelector('.quote');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { io.observe(el); });
    if (quote) io.observe(quote);
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
    if (quote) quote.classList.add('in');
  }
})();
