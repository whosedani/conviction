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

  /* ---------- staggered reveal ---------- */

  var reveals = document.querySelectorAll('.reveal');

  // stagger tweet cards relative to their position in the feed
  document.querySelectorAll('.feed .tweet').forEach(function (card, i) {
    card.style.setProperty('--d', (i % 4) * 110 + 'ms');
  });

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
