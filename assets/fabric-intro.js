/* Miss Neşem — sonbahar giriş animasyonu (kumaş + yaprak). Kök sayfa ve /catalog/ ortak bileşeni.
 *
 * Kullanım: <body>'nin HEMEN başında senkron <script src="/assets/fabric-intro.js"></script>
 * (overlay ilk boyamadan önce DOM'a girsin, hero bir an görünüp üstü kapanmasın). Kütüphane yok;
 * CSS de bu dosyanın içinden enjekte edilir.
 *
 * Oynamaz: prefers-reduced-motion, adreste ?from=home (kökteki "Kataloğu Gör" — ziyaretçi zaten
 * kökte görmüş) ya da kök/katalog ORTAK sayacına göre son 24 saat içinde gösterildiyse. ?intro=1
 * (reklam/QR linkleri) bilerek ATLATMAZ — o ziyaretçiler animasyonu görmeli.
 * (localStorage 'mn_home_intro_ts'). Sayfalar window.MNFabricIntro üzerinden bağlanır:
 *   MNFabricIntro.active      — bu açılışta oynuyor mu
 *   MNFabricIntro.onLift(cb)  — kumaş toplanmaya başladığında (1.8 sn ya da "Atla"); geçtiyse hemen çağrılır
 *   MNFabricIntro.onDone(cb)  — overlay tamamen kalktığında (2.5 sn)
 * Zaman çizelgesi (sn):
 *   0–0.8   koyu kahve zemin, ortadan açık bej ipek kumaş açılır (kıvrım gölgesi + ışık yansıması)
 *   0.8–1.8 kumaşın üstünden 6–8 yaprak süzülür (derinlik: uzak = küçük/bulanık/saydam)
 *   1.8–2.5 kumaş perde gibi yukarı toplanır; zemin 1.7–2.5 arası söner → altındaki hero açılır
 */
(function () {
  'use strict';
  var KEY = 'mn_home_intro_ts';
  var MUSIC = '/assets/intro_music.mp3';
  var T_OPEN = 0.8, T_LEAVES = 0.8, T_LIFT = 1.8, T_END = 2.5;

  var api = window.MNFabricIntro = {
    active: false, lifted: false, done: false, _lift: [], _done: [],
    onLift: function (cb) { if (api.lifted) cb(); else api._lift.push(cb); },
    onDone: function (cb) { if (api.done) cb(); else api._done.push(cb); }
  };
  function run(list) {
    list.splice(0).forEach(function (cb) {
      try { cb(); } catch (e) { setTimeout(function () { throw e; }); }
    });
  }

  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (/[?&]from=home(&|$)/.test(location.search)) return;
    var last = 0;
    try { last = +localStorage.getItem(KEY) || 0; } catch (e) {}
    if (Date.now() - last < 864e5) return;
    if (!document.body) return;
  } catch (e) { return; }
  api.active = true;
  try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}

  var root = document.documentElement;
  root.classList.add('mn-fabric');
  var style = document.createElement('style');
  style.textContent = 'html.mn-fabric body { overflow: hidden; } #mn-fabric { display: block; position: fixed; inset: 0; z-index: 10050; background: #2a1a11; } #mn-fabric.drawing { background: transparent; } #mn-fabric-canvas { position: absolute; left: 0; top: 0; display: block; } .mn-fabric-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #4a2f1f; pointer-events: none; opacity: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: geometricPrecision; } .mn-fabric-title { font-family: "Cormorant Garamond", serif; font-weight: 400; font-size: clamp(30px, 6vw, 54px); line-height: 1.1; letter-spacing: 0.32em; padding-left: 0.32em; } .mn-fabric-sub { margin-top: 10px; font-family: "Cormorant Garamond", serif; font-weight: 500; font-size: clamp(14px, 1.6vw, 17px); letter-spacing: 0.2em; padding-left: 0.2em; color: #6b4a33; } .mn-fabric-skip, .mn-fabric-sound { position: absolute; z-index: 2; color: #fbf3e8; background: rgba(42,26,17,0.38); border: 1px solid rgba(251,243,232,0.35); border-radius: 999px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: background 0.2s ease; } .mn-fabric-skip { top: calc(14px + env(safe-area-inset-top, 0px)); right: 16px; padding: 6px 14px; font-size: 11px; font-weight: 400; letter-spacing: 0.22em; text-transform: uppercase; text-decoration: none; } .mn-fabric-sound { right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); width: 38px; height: 38px; font-size: 16px; line-height: 1; cursor: pointer; } .mn-fabric-sound[hidden] { display: none; } .mn-fabric-skip:hover, .mn-fabric-sound:hover { background: rgba(42,26,17,0.6); }';
  document.head.appendChild(style);

  var intro = document.createElement('div');
  intro.id = 'mn-fabric';
  intro.innerHTML =
    '<canvas id="mn-fabric-canvas" aria-hidden="true"></canvas>' +
    '<div class="mn-fabric-text" aria-hidden="true">' +
      '<span class="mn-fabric-title">MISS NE\u015eEM</span>' +
      '<span class="mn-fabric-sub">Sonbahar \u201926 \u00b7 Merter</span>' +
    '</div>' +
    '<a href="#" class="mn-fabric-skip">Atla</a>' +
    '<button type="button" class="mn-fabric-sound" aria-label="M\u00fczi\u011fi a\u00e7" hidden>\ud83d\udd0a</button>';
  document.body.insertBefore(intro, document.body.firstChild);

  var cv = intro.querySelector('canvas');
  var textEl = intro.querySelector('.mn-fabric-text');
  var soundBtn = intro.querySelector('.mn-fabric-sound');
  var ctx = cv.getContext && cv.getContext('2d');
  var finished = false, shift = 0, lastT = 0;

  function fireLift() {
    if (api.lifted) return;
    api.lifted = true;
    run(api._lift);
  }
  function finish() {
    if (finished) return;
    finished = true;
    fireLift();
    root.classList.remove('mn-fabric');
    intro.remove();
    api.done = true;
    run(api._done);
  }
  // "Atla": zaman çizelgesini perdenin kalktığı ana atlatır (ani kesme yerine 0.7 sn kapanış).
  intro.querySelector('.mn-fabric-skip').addEventListener('click', function (e) {
    e.preventDefault();
    if (!ctx) { finish(); return; }
    if (lastT < T_LIFT) shift += T_LIFT - lastT;
  });
  // Müzik: dosya varsa 🔊 görünür (HEAD 200); tıklanınca çalar, intro bitse de sürer.
  if (window.fetch) {
    fetch(MUSIC, { method: 'HEAD' }).then(function (r) {
      if (r.ok && !finished) soundBtn.hidden = false;
    }).catch(function () {});
  }
  soundBtn.addEventListener('click', function () {
    try { var a = new Audio(MUSIC); a.volume = 0.6; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    soundBtn.hidden = true;
  });
  if (!ctx || typeof Path2D === 'undefined') {
    setTimeout(fireLift, T_LIFT * 1000);
    setTimeout(finish, T_END * 1000);
    return;
  }

  // Canvas arka tamponu ekranın gerçek piksel yoğunluğunda (2x/3x) — CSS boyutu birebir, tarayıcı
  // tarafında bitmap büyütme yok. Tüm çizim CSS px koordinatında, dpr dönüşümüyle tam çözünürlükte.
  var W = 0, H = 0, S = 1, dpr = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    S = Math.max(0.6, Math.min(1.3, Math.min(W, H) / 800));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeOut(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ---------- KUMAŞ ----------
  // Renk: koyu kıvrım → bej → ışık (s: 0..1).
  var C_DARK = [128, 94, 68], C_BASE = [222, 198, 168], C_LIGHT = [250, 239, 222];
  function mix(a, b, k) { return 'rgb(' + ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0) + ')'; }
  function fabricColor(s) { return s < 0.62 ? mix(C_DARK, C_BASE, s / 0.62) : mix(C_BASE, C_LIGHT, (s - 0.62) / 0.38); }
  // Ekran genişliğinde 5–6 ince kıvrım: dar parlak sırt + sırtlar arasında yumuşak gölge. Işık tek
  // yönden (sol üst) — sırt parlaması kıvrımın sol yamacına kayık. Açılışta ortadan dışa yayılıp
  // sönen hafif dalga.
  var FOLDS = 5.5;
  function shade(x, t) {
    var ph = (x / (W / FOLDS) + 0.06 * Math.sin(x * 0.004 + t * 0.8)) * 6.283;
    var ridge = Math.pow(Math.max(0, Math.cos(ph - 0.35)), 14);
    var valley = Math.pow(Math.max(0, -Math.cos(ph)), 1.6);
    var dx = Math.abs(x - W / 2);
    var ripple = Math.sin(dx / (W * 0.16) * 6.283 - t * 7.5) * Math.exp(-t * 1.4);
    return clamp(0.66 + 0.32 * ridge - 0.42 * valley + 0.08 * ripple, 0, 1);
  }
  function fabricPath(t) {
    var path = new Path2D(), y, x, step;
    if (t < T_OPEN) {
      // Ortadan açılış: kenarlar dalgalı.
      var half = (W / 2 + 80) * ease(t / T_OPEN * 1.05);
      var amp = 26 * S * (1 - t / T_OPEN * 0.6);
      step = 24;
      path.moveTo(W / 2 - half, -20);
      for (y = -20; y <= H + 20; y += step) path.lineTo(W / 2 + half + amp * Math.sin(y * 0.011 + t * 6), y);
      for (y = H + 20; y >= -20; y -= step) path.lineTo(W / 2 - half - amp * Math.sin(y * 0.011 + t * 6 + 1.3), y);
    } else {
      // Tam kaplama; 1.8'den sonra alt kenar fistolu (perde toplanması) yükselir.
      var p = ease((t - T_LIFT) / (T_END - T_LIFT));
      var swag = 70 * S * clamp(p * 3, 0, 1), swagW = 190 * S;
      var base = (H + 40) * (1 - p) - swag * (1 - p * 0.3) - (p > 0 ? 40 * p : 0);
      step = 12;
      path.moveTo(-20, -40);
      path.lineTo(W + 20, -40);
      for (x = W + 20; x >= -20; x -= step) {
        var f = (x / swagW) % 1;
        path.lineTo(x, base + swag * Math.sin(Math.PI * f) - 4 * S * Math.sin(x * 0.03 + t * 5));
      }
    }
    path.closePath();
    return path;
  }
  function drawFabric(t, sheen) {
    if (t >= T_END) return;
    var path = fabricPath(t);
    // Hafif çapraz eğim: kıvrımlar tam dikey değil, ipek gibi süzülür. Kıvrım başına ~26 durak →
    // ince sırt parlaması her çözünürlükte pürüzsüz (gradient vektörel, piksel büyütme yok).
    var g = ctx.createLinearGradient(0, 0, W, H * 0.08), n = Math.ceil(FOLDS * 26);
    for (var i = 0; i <= n; i++) g.addColorStop(i / n, fabricColor(shade(W * i / n, t)));
    ctx.fillStyle = g;
    ctx.fill(path);
    // Üstten yumuşak ışık, alta doğru hafif gölge (dökümlü kumaş hacmi).
    var vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(255,248,236,0.20)');
    vg.addColorStop(0.45, 'rgba(255,248,236,0)');
    vg.addColorStop(1, 'rgba(60,38,24,0.20)');
    ctx.fillStyle = vg;
    ctx.fill(path);
    // İpek parlaması: tek yönden (soldan sağa) kayan yumuşak ışık bandı.
    if (sheen) {
      var c = -0.4 * W + clamp(t / 2.2, 0, 1) * 1.9 * W;
      var sg = ctx.createLinearGradient(c - 260 * S, 0, c + 260 * S, 160 * S);
      sg.addColorStop(0, 'rgba(255,250,240,0)');
      sg.addColorStop(0.5, 'rgba(255,250,240,0.26)');
      sg.addColorStop(1, 'rgba(255,250,240,0)');
      ctx.fillStyle = sg;
      ctx.fill(path);
    }
    // Toplanma sırasında alt kenarda gölge (kumaş katları).
    if (t > T_LIFT) {
      var p = ease((t - T_LIFT) / (T_END - T_LIFT));
      var by = (H + 40) * (1 - p);
      var shg = ctx.createLinearGradient(0, by - 200 * S, 0, by + 40 * S);
      shg.addColorStop(0, 'rgba(70,44,28,0)');
      shg.addColorStop(1, 'rgba(70,44,28,0.45)');
      ctx.fillStyle = shg;
      ctx.fill(path);
    }
  }

  // ---------- YAPRAKLAR ----------
  // 100x100 kutuda, sap altta: akçaağaç, meşe, çınar (+ damarlar).
  var SHAPES = [
    { d: 'M50 4L57 21 67 13 65 33 83 25 77 43 97 41 81 57 89 63 67 67 71 79 54 71 52 90 48 90 46 71 29 79 33 67 11 63 19 57 3 41 23 43 17 25 35 33 33 13 43 21Z',
      veins: [[50, 66, 50, 8], [50, 64, 80, 28], [50, 64, 20, 28], [50, 66, 92, 43], [50, 66, 8, 43]] },
    { d: 'M50 4C58 6 60 14 56 18 64 16 70 20 66 28 74 28 78 36 70 42 78 44 80 52 72 56 78 60 76 70 66 70 68 78 60 84 52 82L51 94 49 94 48 82C40 84 32 78 34 70 24 70 22 60 28 56 20 52 22 44 30 42 22 36 26 28 34 28 30 20 36 16 44 18 40 14 42 6 50 4Z',
      veins: [[50, 90, 50, 8], [50, 34, 64, 26], [50, 34, 36, 26], [50, 48, 70, 42], [50, 48, 30, 42], [50, 62, 70, 58], [50, 62, 30, 58]] },
    { d: 'M50 6L59 26 81 14 75 38 96 40 79 56C75 67 64 75 54 77L51 94 49 94 46 77C36 75 25 67 21 56L4 40 25 38 19 14 41 26Z',
      veins: [[50, 92, 50, 10], [50, 70, 79, 18], [50, 70, 21, 18], [50, 72, 92, 41], [50, 72, 8, 41]] }
  ];
  SHAPES.forEach(function (s) {
    s.path = new Path2D(s.d);
    s.veinPath = new Path2D();
    s.veins.forEach(function (v) { s.veinPath.moveTo(v[0], v[1]); s.veinPath.lineTo(v[2], v[3]); });
  });
  var PALETTE = [['#c99a3b', '#8a5c1f'], ['#b8683a', '#6e3a1e'], ['#8a5531', '#4e2e1a'], ['#d6935c', '#9a5530'], ['#a8742f', '#6b4320']];
  // Yapraklar her karede vektör olarak (Path2D) tam çözünürlükte çizilir — bitmap sprite / büyütme
  // yok, kenarlar her ekranda net. Derinlik bulanıklıkla değil boyut + saydamlıkla verilir. Ön/arka
  // yüz gradient'leri yaprağın kendi 100x100 kutusunda bir kez kurulur (dönüşümle birlikte ölçeklenir).
  function leafGradients(cols) {
    var f = ctx.createLinearGradient(20, 0, 80, 100);
    f.addColorStop(0, cols[0]);
    f.addColorStop(1, cols[1]);
    var b = ctx.createLinearGradient(20, 0, 80, 100);
    b.addColorStop(0, cols[1]);
    b.addColorStop(1, '#3a2214');
    return { front: f, back: b };
  }

  var count = W < 600 ? 6 : 8, leaves = [];
  for (var i = 0; i < count; i++) {
    var z = (i + rnd(0.1, 0.9)) / count;           // 0 = uzak, 1 = yakın
    var shape = SHAPES[i % SHAPES.length], cols = PALETTE[(Math.random() * PALETTE.length) | 0];
    leaves.push({
      z: z,
      shape: shape,
      grad: leafGradients(cols),
      k: (24 + 70 * z) * S / 100,
      x0: rnd(0.08, 0.92) * W, y0: rnd(-0.22, 0.28) * H,
      vy: H * (0.22 + 0.34 * z) * rnd(0.85, 1.15),
      drift: rnd(-30, 30) * S,
      sway: rnd(28, 64) * S * (0.6 + z * 0.6), swayW: rnd(1.4, 2.4), ph: rnd(0, 6.28),
      rot0: rnd(0, 6.28), vr: rnd(0.5, 1.3) * (Math.random() < 0.5 ? -1 : 1),
      flipW: rnd(1.6, 3), ph2: rnd(0, 6.28),
      alpha: 0.45 + 0.55 * z
    });
  }

  function drawLeaves(t) {
    if (t < T_LEAVES) return;
    var lt = t - T_LEAVES;
    var fadeIn = easeOut(lt / 0.3);
    var fadeOut = 1 - ease((t - 2.05) / 0.45);
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      var y = l.y0 + l.vy * lt;
      var x = l.x0 + l.drift * lt + l.sway * Math.sin(l.swayW * lt + l.ph);
      var flip = Math.cos(l.flipW * lt + l.ph2);
      var front = flip >= 0;
      var sx = Math.max(Math.abs(flip), 0.18);
      ctx.save();
      ctx.globalAlpha = l.alpha * fadeIn * clamp(fadeOut, 0, 1);
      ctx.translate(x, y);
      ctx.rotate(l.rot0 + l.vr * lt + 0.35 * Math.sin(l.swayW * lt + l.ph));
      ctx.scale(sx * l.k, (0.9 + 0.1 * Math.abs(flip)) * l.k);
      ctx.translate(-50, -50);
      ctx.fillStyle = front ? l.grad.front : l.grad.back;
      ctx.fill(l.shape.path);
      ctx.strokeStyle = front ? 'rgba(55,28,12,0.38)' : 'rgba(255,235,210,0.18)';
      ctx.lineWidth = 1.7;
      ctx.lineCap = 'round';
      ctx.stroke(l.shape.veinPath);
      ctx.restore();
    }
  }

  // ---------- DÖNGÜ ----------
  var t0 = performance.now(), winStart = t0 + 250, winFrames = 0, sheen = true;
  intro.classList.add('drawing');
  function frame(now) {
    if (finished) return;
    var t = (now - t0) / 1000 + shift;
    lastT = t;
    if (t >= T_LIFT) fireLift();
    if (t >= T_END) { finish(); return; }

    // FPS bekçisi: 500 ms pencerede ~50 fps altına düşerse önce ışık geçişi kapanır,
    // sonra en uzak yapraklar atılır (en az 3 kalır).
    if (now > winStart) {
      winFrames++;
      if (now - winStart >= 500) {
        if (winFrames * 1000 / (now - winStart) < 50) {
          if (sheen) sheen = false;
          else if (leaves.length > 3) leaves.splice(0, Math.ceil(leaves.length * 0.3));
        }
        winStart = now; winFrames = 0;
      }
    }

    ctx.clearRect(0, 0, W, H);
    var bgA = 1 - ease((t - 1.7) / 0.8);
    if (bgA > 0) { ctx.globalAlpha = bgA; ctx.fillStyle = '#2a1a11'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    drawFabric(t, sheen);
    drawLeaves(t);

    var tin = easeOut((t - 0.45) / 0.6), tout = 1 - ease((t - T_LIFT) / 0.4);
    // Sadece opaklık: alt-piksel translate/transform metni ara katmanda rasterize edip bulanıklaştırırdı.
    textEl.style.opacity = String(Math.max(0, Math.min(tin, tout)));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Sekme arka plandayken rAF durur — overlay asla takılı kalmasın.
  setTimeout(finish, T_END * 1000 + 1200);
})();
