// One shared liquid background for the homepage and careers experiment.
(() => {
  const glass = document.querySelector('.lemonade-glass');
  if (!glass) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(pointer: fine)');
  // Stable placement means a resize doesn't scramble or restart the bubbles.
  let seed = 3719;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const layers = [...glass.querySelectorAll('.bubble-layer')].map((element, index) => {
    const count = [18, 14, 9][index];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('span');
      bubble.className = 'lemonade-bubble';
      const duration = [40, 30, 22][index] + random() * 16;
      const size = [5, 12, 24][index] + random() * [8, 14, 24][index];
      const props = {
        '--left': `${((i + random()) / count * 100).toFixed(2)}%`,
        '--size': `${size.toFixed(1)}px`,
        '--duration': `${duration.toFixed(2)}s`,
        '--delay': `${(-random() * duration).toFixed(2)}s`,
        '--sway': `${(5 + random() * 13).toFixed(1)}px`,
        '--sway-time': `${(4 + random() * 5).toFixed(2)}s`,
        '--resting-height': `${(5 + random() * 85).toFixed(2)}%`
      };
      Object.entries(props).forEach(([name, value]) => bubble.style.setProperty(name, value));
      const shell = document.createElement('i');
      shell.className = 'bubble-shell';
      bubble.append(shell);
      fragment.append(bubble);
    }
    element.append(fragment);
    return { element, depth: Number(element.dataset.bubbleDepth), x: 0, y: 0 };
  });
  const root = document.documentElement;
  const surface = document.querySelector('.lemonade-surface');
  let surfaceLevel = Math.max(0, surface.offsetHeight - 20);
  const iceField = document.querySelector('.ice-field');
  const icePositions = [[8,1],[87,4],[17,13],[91,23],[7,32],[82,41],[13,50],[90,60],[21,70],[79,79],[9,88],[91,96]];
  const ice = icePositions.map(([left, top], index) => {
    const anchor = document.createElement('div');
    anchor.className = 'ice-anchor';
    anchor.style.setProperty('--ice-left', `${left}%`);
    anchor.style.setProperty('--ice-top', `${top}%`);
    anchor.style.setProperty('--ice-size', `${[108, 76, 126, 88][index % 4]}px`);
    anchor.style.setProperty('--ice-turn', `${[-17, 12, 23, -9][index % 4]}deg`);
    anchor.style.setProperty('--ice-time', `${9 + index % 5}s`);
    anchor.style.setProperty('--ice-delay', `${-index * 1.7}s`);
    anchor.style.setProperty('--ice-opacity', [.62, .42, .7, .48][index % 4]);
    const offset = document.createElement('div');
    offset.className = 'ice-offset';
    const core = document.createElement('div');
    core.className = 'ice-core';
    const facet = document.createElement('i');
    facet.className = 'ice-facet';
    core.append(facet); offset.append(core); anchor.append(offset); iceField.append(anchor);
    return { anchor, offset, depth: [.8, .35, 1, .55][index % 4], x: 0, y: 0 };
  });
  // Decorative loops only run while their part of the page is in view.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    }), { rootMargin: '100px' });
    ice.forEach(item => observer.observe(item.anchor));
    document.querySelectorAll('.note-pocket').forEach(note => observer.observe(note));
    observer.observe(document.querySelector('.lemonade-surface'));
    observer.observe(document.querySelector('.collage') || document.querySelector('.hero'));
  } else {
    document.querySelectorAll('.ice-anchor, .lemonade-surface, .collage, .note-pocket').forEach(element => element.classList.add('is-in-view'));
  }
  let targetX = 0, targetY = 0, scrollDepth = 0, frame = 0, lastTime = 0;
  function requestFrame() {
    if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(update);
  }
  function update(time) {
    frame = 0;
    const ease = 1 - Math.exp(-Math.min(time - lastTime || 16, 64) / 130);
    lastTime = time;
    let settling = false;
    for (const layer of layers) {
      const x = targetX * 23 * layer.depth;
      const y = (targetY * 16 - scrollDepth) * layer.depth;
      layer.x += (x - layer.x) * ease;
      layer.y += (y - layer.y) * ease;
      layer.element.style.setProperty('--bubble-x', `${layer.x.toFixed(2)}px`);
      layer.element.style.setProperty('--bubble-y', `${layer.y.toFixed(2)}px`);
      if (Math.abs(x - layer.x) + Math.abs(y - layer.y) > .1) settling = true;
    }
    for (const item of ice) {
      const rect = item.anchor.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > innerHeight + 100) continue;
      const depthOffset = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
      const x = targetX * 21 * item.depth;
      const y = (targetY * 10 + depthOffset * 36) * item.depth;
      item.x += (x - item.x) * ease;
      item.y += (y - item.y) * ease;
      item.offset.style.setProperty('--ice-x', `${item.x.toFixed(2)}px`);
      item.offset.style.setProperty('--ice-y', `${item.y.toFixed(2)}px`);
      if (Math.abs(x - item.x) + Math.abs(y - item.y) > .1) settling = true;
    }
    if (settling) requestFrame();
  }
  function onScroll() {
    // Use one scroll coordinate for the waves and their fill, avoiding a compositor seam.
    const pageScroll = Math.max(0, scrollY);
    root.style.setProperty('--page-scroll', `${pageScroll}px`);
    const submerged = Math.max(0, Math.min(1, (pageScroll - surfaceLevel + 180) / 150));
    root.style.setProperty('--surface-immersion', submerged * submerged * (3 - 2 * submerged));
    const travel = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollDepth = Math.max(0, Math.min(1, scrollY / travel)) * 160;
    requestFrame();
  }
  addEventListener('scroll', onScroll, { passive: true });
  function measureSurface() {
    surfaceLevel = Math.max(0, surface.offsetHeight - 20);
    onScroll();
  }
  addEventListener('resize', measureSurface, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measureSurface).observe(surface);
  addEventListener('pointermove', event => {
    if (motion.matches || !pointer.matches || event.pointerType === 'touch') return;
    targetX = (event.clientX / innerWidth - .5) * 2;
    targetY = (event.clientY / innerHeight - .5) * 2;
    requestFrame();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetX = targetY = 0; requestFrame(); });
  function syncMotion() {
    glass.classList.toggle('is-paused', document.hidden || motion.matches);
    root.classList.toggle('scene-paused', document.hidden || motion.matches);
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (motion.matches) {
      layers.forEach(layer => {
        layer.x = layer.y = 0;
        layer.element.style.removeProperty('--bubble-x');
        layer.element.style.removeProperty('--bubble-y');
      });
      ice.forEach(item => {
        item.x = item.y = 0;
        item.offset.style.removeProperty('--ice-x');
        item.offset.style.removeProperty('--ice-y');
      });
    }
    onScroll();
  }
  document.addEventListener('visibilitychange', syncMotion);
  motion.addEventListener('change', syncMotion);
  addEventListener('pageshow', onScroll);
  syncMotion();
})();

// Hidden discoveries: type PINK or FIZZ outside editable fields.
(() => {
  const glass = document.querySelector('.lemonade-glass');
  if (!glass) return;
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.createElement('p');
  status.className = 'pink-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.append(status);
  const background = window.lemonadeBackground;
  let keys = '', lastKey = 0, pouring = false, blendTimer = 0, finishTimer = 0, fizzTimer = 0;
  const fizzField = glass.querySelector('.fizz-field');
  const pourLayer = glass.querySelector('.pink-pour');
  const waveEdge = glass.querySelector('.surface-front .wave-edge');
  let pourFrame = 0;
  let waveLength = 0;
  let pinkFluid = null, resetTimer = 0;
  function clearReset() {
    clearTimeout(resetTimer); resetTimer = 0;
    root.classList.remove('pink-resetting');
  }
  function trackPourSurface(now = performance.now()) {
    pourFrame = 0;
    if (!pouring || document.hidden) return;
    // Follow the animated SVG at the stream's x, including document scrolling.
    const matrix = waveEdge.getScreenCTM();
    if (matrix && matrix.a) {
      const glassRect = glass.getBoundingClientRect();
      const streamX = glassRect.left + glassRect.width * .72;
      const localX = (streamX - matrix.e) / matrix.a;
      let low = 0, high = waveLength;
      for (let i = 0; i < 13; i++) {
        const middle = (low + high) / 2;
        if (waveEdge.getPointAtLength(middle).x < localX) low = middle;
        else high = middle;
      }
      const point = waveEdge.getPointAtLength((low + high) / 2);
      const surfaceY = matrix.b * point.x + matrix.d * point.y + matrix.f - glassRect.top;
      pourLayer.style.setProperty('--pour-level', `${Math.max(0, surfaceY).toFixed(2)}px`);
      pinkFluid?.frame(now, Math.max(0, surfaceY), matrix, glassRect);
    }
    pourFrame = requestAnimationFrame(trackPourSurface);
  }
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(pourFrame); pourFrame = 0;
    if (pouring && !document.hidden) trackPourSurface();
  });
  function clearPour() {
    cancelAnimationFrame(pourFrame); pourFrame = 0;
    pourLayer.style.removeProperty('--pour-level');
    pinkFluid?.stop();
    clearTimeout(blendTimer);
    clearTimeout(finishTimer);
    glass.classList.remove('is-pouring');
    root.classList.remove('pink-mixing');
    pouring = false;
  }
  function clearFizz(persist = true) {
    clearTimeout(fizzTimer); fizzTimer = 0;
    glass.classList.remove('is-fizzing');
    fizzField.style.removeProperty('animation-delay');
    fizzField.replaceChildren();
    if (persist) background.set({ fizzUntil: 0 });
  }
  function startFizz(deadline = Date.now() + (motion.matches ? 1800 : 8000)) {
    if (glass.classList.contains('is-fizzing')) return;
    const remaining = Math.max(0, deadline - Date.now());
    if (!remaining) return;
    const count = innerWidth < 760 ? 64 : 112;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('i');
      bubble.className = 'fizz-bubble';
      bubble.style.setProperty('--fizz-left', `${Math.random() * 100}%`);
      bubble.style.setProperty('--fizz-size', `${2 + Math.random() * 7}px`);
      bubble.style.setProperty('--fizz-duration', `${2.7 + Math.random() * 3.2}s`);
      bubble.style.setProperty('--fizz-delay', `${-Math.random() * 6}s`);
      bubble.style.setProperty('--fizz-rest', `${Math.random() * 100}%`);
      fragment.append(bubble);
    }
    fizzField.append(fragment);
    // Resume the envelope at its elapsed time instead of restarting an eight-second burst.
    fizzField.style.animationDelay = `${-Math.max(0, 8000 - remaining)}ms`;
    void fizzField.offsetWidth;
    glass.classList.add('is-fizzing');
    status.textContent = 'Extra fizz. A sparkling lemonade.';
    background.set({ fizzUntil: deadline });
    fizzTimer = setTimeout(clearFizz, remaining);
  }
  function blendPink() { root.classList.add('pink-lemonade'); background.set({ pink: true }); }
  function finishPink() {
    clearPour();
    blendPink();
    status.textContent = 'Pinkade. A little extra sweetness.';
  }
  function pourPink() {
    if (pouring || root.classList.contains('pink-lemonade')) return;
    clearReset();
    if (motion.matches) { finishPink(); return; }
    pouring = true;
    background.set({ pink: true });
    waveLength = waveEdge.getTotalLength();
    if (!pinkFluid && window.createLemonadePinkFluid) pinkFluid = window.createLemonadePinkFluid(pourLayer);
    pinkFluid?.start(waveEdge);
    trackPourSurface();
    glass.classList.add('is-pouring');
    root.classList.add('pink-mixing');
    // Let the concentrated plume enter and curl before the whole glass blends.
    blendTimer = setTimeout(blendPink, 2600);
    finishTimer = setTimeout(finishPink, 11200);
  }
  document.addEventListener('keydown', event => {
    if (event.isComposing) { keys = ''; return; }
    if (event.key === 'Escape') {
      const changed = root.classList.contains('pink-lemonade') || root.classList.contains('pink-resetting') || pouring;
      clearPour(); clearFizz(false); clearReset();
      if (changed) {
        root.classList.add('pink-resetting');
        resetTimer = setTimeout(clearReset, motion.matches ? 220 : 1680);
      }
      root.classList.remove('pink-lemonade');
      background.set({ pink: false, fizzUntil: 0 });
      keys = '';
      status.textContent = '';
      return;
    }
    if (event.target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) { keys = ''; return; }
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.key.length !== 1) { keys = ''; return; }
    const now = Date.now();
    if (now - lastKey > 1500) keys = '';
    lastKey = now;
    keys = (keys + event.key.toLowerCase()).slice(-4);
    if (keys === 'pink') { keys = ''; pourPink(); }
    if (keys === 'fizz') { keys = ''; startFizz(); }
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    if (pouring) finishPink();
    clearFizz();
  });
  function restoreBackground() {
    const saved = background.get();
    clearPour(); clearFizz(false); clearReset();
    root.classList.toggle('pink-lemonade', saved.pink);
    if (saved.fizzUntil) startFizz(saved.fizzUntil);
  }
  document.addEventListener('lemonade:background-restore', restoreBackground);
  restoreBackground();
})();

// Pinkade names follow the shared pink state, including dynamically rendered cards.
(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const textChanges = new Map(), attributeChanges = new Map(), shuffling = new Map();
  const labelAttributes = ['aria-label', 'alt', 'title', 'placeholder'];
  const excluded = 'script, style, noscript, textarea, input, select, [contenteditable], .lemonade-glass, .ice-field';
  // Match addresses first so their display text and destinations keep working.
  const words = /https?:\/\/[^\s<]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?|\blemonade\b/gi;
  let active = false, frame = 0, sequence = 0, originalTitle = '', pinkTitle = '';
  const pinkWord = word => word === word.toUpperCase() ? 'PINKADE' : word[0] === word[0].toUpperCase() ? 'Pinkade' : 'pinkade';
  const rename = (text, render = pinkWord) => text.replace(words, word => word.toLowerCase() === 'lemonade' ? render(word) : word);
  const recipes = [...document.querySelectorAll('[data-pink-recipe]')].map(element => ({
    element, original: [...element.childNodes], pink: element.dataset.pinkRecipe,
    lines: [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => ({ node, text: node.data }))
  }));
  function updateRecipes(enabled) {
    recipes.forEach(({ element, original, pink, lines }) => {
      if (!enabled) {
        const from = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.data);
        element.replaceChildren(...original);
        lines.forEach(({ node, text }, index) => {
          const source = from[index] ?? text;
          const entry = { node, source, target: text, current: node.data, wholeLine: true };
          if (source !== text && canShuffle(node)) writeText(entry, source);
          queueShuffle(entry);
        });
        return;
      }
      const content = [];
      pink.split('\n').forEach((line, index) => {
        if (index) content.push(document.createElement('br'));
        content.push(document.createTextNode(line));
      });
      element.replaceChildren(...content);
    });
  }


  // The original wordmarks are images; keep their size and add an editable pink counterpart.
  document.querySelectorAll('.logo > img, .footer-brand > img').forEach(original => {
    const wrapper = document.createElement('span');
    wrapper.className = 'pink-wordmark-wrap';
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', original.alt || 'Lemonade');
    const replacement = document.createElement('span');
    replacement.className = 'pink-wordmark';
    replacement.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('img');
    icon.src = 'https://lemonade.gg/icons/logo-icon.svg';
    icon.alt = ''; icon.width = icon.height = 24;
    const name = document.createElement('span');
    name.textContent = 'LEMONADE';
    replacement.append(icon, name);
    original.replaceWith(wrapper);
    original.setAttribute('aria-hidden', 'true');
    wrapper.append(original, replacement);
  });

  function writeText(entry, value) {
    entry.current = value;
    if (entry.node.data !== value) entry.node.data = value;
  }
  function finishShuffling() {
    cancelAnimationFrame(frame); frame = 0;
    shuffling.forEach(entry => {
      if (entry.node.isConnected && entry.node.data === entry.current) writeText(entry, entry.target);
    });
    shuffling.clear();
    root.classList.remove('pink-unshuffling');
  }
  function shuffleFrame(time) {
    frame = 0;
    for (const [node, entry] of shuffling) {
      if (!node.isConnected || node.data !== entry.current) { shuffling.delete(node); continue; }
      const elapsed = time - entry.start;
      if (elapsed < 0) continue;
      const progress = Math.min(1, elapsed / 560);
      if (progress === 1) { writeText(entry, entry.target); shuffling.delete(node); continue; }
      const step = Math.floor(elapsed / 45);
      if (step === entry.step) continue;
      entry.step = step;
      const revealed = 1 - (1 - progress) ** 3;
      const scramble = (target, length) => {
        const settled = Math.floor(revealed * length);
        const letters = target === target.toUpperCase() ? 'PINKADELEMON' : 'pinkadelemon';
        return Array.from({ length }, (_, i) => {
          if (i < settled) return target[i] || '';
          if (target[i] && !/[a-z0-9]/i.test(target[i])) return target[i];
          return letters[Math.floor(Math.random() * letters.length)];
        }).join('');
      };
      writeText(entry, entry.wholeLine
        ? scramble(entry.target, entry.target.length)
        : rename(entry.source, word => scramble(entry.reversing ? word : pinkWord(word), word.length)));
    }
    if (shuffling.size) frame = requestAnimationFrame(shuffleFrame);
    else root.classList.remove('pink-unshuffling');
  }
  function canShuffle(node) {
    const parent = node.parentElement;
    if (!parent || motion.matches || document.hidden || root.classList.contains('restoring-glass') || parent.closest('[aria-live], [role="status"], [role="alert"]')) return false;
    const rect = parent.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  }
  function queueShuffle(entry) {
    entry.start = performance.now() + (sequence++ % 6) * 25;
    entry.step = -1;
    if (entry.current !== entry.target && canShuffle(entry.node)) {
      shuffling.set(entry.node, entry);
      if (!frame) frame = requestAnimationFrame(shuffleFrame);
    } else writeText(entry, entry.target);
  }
  function updateText(node) {
    if (!active || !node.parentElement || node.parentElement.closest(excluded)) return;
    const previous = textChanges.get(node);
    if (previous && node.data === previous.current) return;
    shuffling.delete(node); textChanges.delete(node);
    const source = node.data, target = rename(source);
    if (source === target) return;
    const entry = { node, source, target, current: source };
    textChanges.set(node, entry);
    queueShuffle(entry);
  }
  function updateAttribute(element, name) {
    if (element.closest('[contenteditable]')) return;
    const source = element.getAttribute(name);
    const previous = attributeChanges.get(element)?.get(name);
    if (previous && source === previous.current) return;
    attributeChanges.get(element)?.delete(name);
    if (source === null) return;
    const target = rename(source);
    if (source === target) return;
    if (!attributeChanges.has(element)) attributeChanges.set(element, new Map());
    attributeChanges.get(element).set(name, { source, current: target });
    element.setAttribute(name, target);
  }
  function scan(scope) {
    if (scope.nodeType === Node.TEXT_NODE) { updateText(scope); return; }
    if (scope.nodeType !== Node.ELEMENT_NODE || scope.closest('.lemonade-glass, .ice-field, script, style, [contenteditable]')) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) updateText(walker.currentNode);
    [scope, ...scope.querySelectorAll('[aria-label], [alt], [title], [placeholder]')].forEach(element => {
      labelAttributes.forEach(name => updateAttribute(element, name));
    });
  }
  const updates = new MutationObserver(records => {
    if (!active) return;
    records.forEach(record => {
      if (record.type === 'characterData') updateText(record.target);
      else if (record.type === 'attributes') updateAttribute(record.target, record.attributeName);
      else record.addedNodes.forEach(scan);
    });
    // Filters replace cards, so release detached labels instead of retaining old grids.
    textChanges.forEach((entry, node) => { if (!node.isConnected) { textChanges.delete(node); shuffling.delete(node); } });
    attributeChanges.forEach((entries, element) => { if (!element.isConnected) attributeChanges.delete(element); });
  });
  function syncNames() {
    const enabled = root.classList.contains('pink-lemonade');
    if (enabled === active) return;
    active = enabled;
    if (active) {
      finishShuffling();
      sequence = 0;
      updateRecipes(true);
      originalTitle = document.title; pinkTitle = rename(originalTitle); document.title = pinkTitle;
      updates.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: labelAttributes });
      scan(document.body);
    } else {
      updates.disconnect();
      cancelAnimationFrame(frame); frame = 0; shuffling.clear(); sequence = 0;
      // Keep the editable logo on screen until its reverse scramble has finished.
      root.classList.add('pink-unshuffling');
      textChanges.forEach(entry => {
        if (!entry.node.isConnected || entry.node.data !== entry.current || entry.node.parentElement?.closest('[data-pink-recipe]')) return;
        entry.reversing = true; entry.target = entry.source;
        queueShuffle(entry);
      });
      attributeChanges.forEach((entries, element) => entries.forEach((entry, name) => {
        if (element.isConnected && element.getAttribute(name) === entry.current) element.setAttribute(name, entry.source);
      }));
      textChanges.clear(); attributeChanges.clear();
      updateRecipes(false);
      if (!shuffling.size) root.classList.remove('pink-unshuffling');
      if (document.title === pinkTitle) document.title = originalTitle;
    }
  }
  new MutationObserver(syncNames).observe(root, { attributes: true, attributeFilter: ['class'] });
  motion.addEventListener('change', () => { if (motion.matches) finishShuffling(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishShuffling(); });
  syncNames();
})();

// Falling ingredients share the translucent material of the ice and bubbles.
(() => {
  if (!document.documentElement.classList.contains('main-page')) return;
  const assets = new URL('assets/ingredients/', document.currentScript.src);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const drops = new Set();
  let field;
  function removeDrop(drop) {
    if (!drops.delete(drop)) return;
    drop.animations.forEach(animation => animation.cancel());
    drop.element.remove();
  }
  function clearDrops() { [...drops].forEach(removeDrop); }
  function dropIngredients(ingredient) {
    if (motion.matches || document.hidden || !['strawberry', 'mint'].includes(ingredient)) return;
    if (!field) {
      field = document.createElement('div');
      field.className = 'ingredient-field';
      field.setAttribute('aria-hidden', 'true');
      document.querySelector('.glass-refraction').before(field);
    }
    const mint = ingredient === 'mint';
    const count = innerWidth < 760 ? (mint ? 7 : 5) : (mint ? 10 : 7);
    while (drops.size + count > 24) removeDrop(drops.values().next().value);
    const width = innerWidth, height = innerHeight;
    // Shuffle horizontal lanes so entry timing never draws a left-to-right row.
    const lanes = Array.from({ length: count }, (_, i) => i);
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    for (let i = 0; i < count; i++) {
      const depth = .6 + Math.random() * .4;
      const size = (mint ? 78 + Math.random() * 34 : 102 + Math.random() * 40) * depth * (width < 760 ? .82 : 1);
      const element = document.createElement('span');
      element.className = 'ingredient-drop';
      const left = size * .4 + (lanes[i] + .2 + Math.random() * .6) / count * (width - size * 1.8);
      element.style.left = `${left}px`;
      element.style.width = `${size}px`;
      element.style.height = `${size * 1.24}px`;
      const art = document.createElement('img');
      art.className = 'ingredient-art';
      art.src = new URL(`${ingredient}.svg`, assets).href;
      art.alt = ''; art.draggable = false; art.width = 100; art.height = 124;
      art.style.setProperty('--ingredient-softness', `${((1 - depth) * 1.6).toFixed(2)}px`);
      element.append(art); field.append(element);
      const duration = (mint ? 7800 : 6000) + Math.random() * 3800;
      const delay = i === 0 ? 0 : 180 + Math.random() * 1600;
      const startY = -size * 1.5 - (i === 0 ? 0 : Math.random() * height * .32);
      const endY = height + size * 1.6;
      const sway = (mint ? 48 + Math.random() * 90 : 28 + Math.random() * 62) * Math.min(1, width / 900);
      const phase = Math.random() * Math.PI * 2;
      const turns = .65 + Math.random() * .8;
      const fallRate = .85 + Math.random() * .4;
      const angle = (Math.random() - .5) * 90;
      const turn = (Math.random() < .5 ? -1 : 1) * (mint ? 110 : 55);
      const drop = { element, animations: [] };
      drops.add(drop);
      // Each ingredient follows its own continuous curve and vertical pace.
      const path = Array.from({ length: 25 }, (_, index) => {
        const progress = index / 24;
        const drift = (Math.sin(phase + progress * Math.PI * 2 * turns) - Math.sin(phase)) * sway;
        const x = Math.max(size * .35 - left, Math.min(width - size * 1.35 - left, drift));
        const y = startY + (endY - startY) * progress ** fallRate;
        const opacity = depth * Math.min(1, progress / .07, (1 - progress) / .26);
        return { transform: `translate3d(${x}px, ${y}px, 0)`, opacity, offset: progress };
      });
      const fall = element.animate(path, { duration, delay, easing: 'linear', fill: 'both' });
      const tumble = art.animate([
        { transform: `rotate(${angle}deg) rotateY(-12deg)` },
        { transform: `rotate(${angle + turn * .55}deg) rotateY(14deg)`, offset: .5 },
        { transform: `rotate(${angle + turn}deg) rotateY(-8deg)` }
      ], { duration, delay, easing: 'ease-in-out', fill: 'both' });
      drop.animations.push(fall, tumble);
      // Observe both finished promises because clearing a burst cancels both animations.
      tumble.finished.catch(() => {});
      fall.finished.then(() => removeDrop(drop), () => removeDrop(drop));
    }
  }
  document.addEventListener('lemonade:ingredient-drop', event => dropIngredients(event.detail?.ingredient));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') clearDrops(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearDrops(); });
  motion.addEventListener('change', () => { if (motion.matches) clearDrops(); });
})();
