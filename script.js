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

  /* ---------- the archive gallery (looped) ---------- */

  var track = document.getElementById('galTrack');

  if (track) {
    var realCards = Array.prototype.slice.call(track.querySelectorAll('.tweet'));
    var COUNT = realCards.length;

    // clone the full set on both sides so the loop never has an edge
    realCards.slice().reverse().forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.insertBefore(clone, track.firstChild);
    });
    realCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });

    var cards = Array.prototype.slice.call(track.querySelectorAll('.tweet'));
    var prevBtn = document.querySelector('.gal-prev');
    var nextBtn = document.querySelector('.gal-next');
    var counter = document.getElementById('galIndex');
    var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    var current = COUNT;
    var ticking = false;
    var settleTimer = null;

    function setWidth() {
      return cards[COUNT].offsetLeft - cards[0].offsetLeft;
    }

    function centerOf(idx) {
      return cards[idx].offsetLeft + cards[idx].offsetWidth / 2 - track.clientWidth / 2;
    }

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
      current = idx;
      cards.forEach(function (card, i) {
        card.classList.toggle('active', i === idx);
      });
      if (counter) counter.textContent = ROMAN[idx % COUNT];
    }

    function scrollToCard(idx) {
      track.scrollTo({ left: centerOf(idx), behavior: 'smooth' });
      setActive(idx);
    }

    // silently teleport back into the middle set once scrolling settles
    function rebase() {
      var idx = nearestCard();
      if (idx < COUNT) {
        track.scrollLeft += setWidth();
        setActive(idx + COUNT);
      } else if (idx >= COUNT * 2) {
        track.scrollLeft -= setWidth();
        setActive(idx - COUNT);
      }
    }

    track.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          setActive(nearestCard());
          ticking = false;
        });
      }
      clearTimeout(settleTimer);
      settleTimer = setTimeout(rebase, 120);
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollToCard(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollToCard(current + 1); });

    window.addEventListener('resize', function () {
      track.scrollLeft = centerOf(current);
    });

    // start centered on the first real card
    track.scrollLeft = centerOf(COUNT);
    setActive(COUNT);
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
