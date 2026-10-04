// Only hide scroll-reveal content when it can animate back in.
  if (matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window)
    document.documentElement.classList.add("reveal-on");

// Run page interactions after the HTML has been parsed.
document.addEventListener('DOMContentLoaded', () => {
// Lemonade's twelve templates, with the images and icons from lemonade.gg.
// The example ideas are written for this concept.
const TEMPLATES = [
  { name: "Dodge game", dir: 2, file: "blade-ball", idea: "a ball speeds up every time someone dodges it" },
  { name: "Shooter game", dir: 2, file: "rivals", idea: "every round is a 1v1 and each win unlocks a new weapon" },
  { name: "Lemonade stand", dir: 1, file: "sell-lemons", idea: "you grow a lemonade stand into a juice empire" },
  { name: "Murder mystery", dir: 3, file: "mm2", idea: "one player is secretly the murderer and everyone else has to work out who" },
  { name: "Prison game", dir: 2, file: "jailbreak", idea: "you plan a prison break with your friends" },
  { name: "Aura game", dir: 1, file: "cart", idea: "you roll for rare auras and show them off" },
  { name: "Bedwars game", dir: 3, file: "bedwars", idea: "teams defend their bed while raiding everyone else's" },
  { name: "Survival game", dir: 2, file: "99nights", idea: "you survive 99 nights in a forest that fights back" },
  { name: "Fish game", dir: 3, file: "fishit", idea: "you fish, sell your catch and upgrade your rod" },
  { name: "Farm game", dir: 1, file: "grow-a-garden", idea: "you grow a garden and trade the rarest plants" },
  { name: "Pet game", dir: 3, file: "adopt-me", idea: "you adopt, raise and trade pets" },
  { name: "Brainrot game", dir: 1, file: "pvp", idea: "you collect brainrot characters and battle your friends" }
];
const IMG = (t, w = 640) => `https://lemonade.gg/_next/image?url=%2Fvideos%2F${t.dir}%2F${t.file}.webp&w=${w}&q=75`;
const ICON = t => `https://lemonade.gg/videos/${t.dir}/${t.file}.svg`;
const promptFor = t => `Make a game where ${t.idea}.`;

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const behavior = reduceMotion ? "auto" : "smooth";

// Hero collage: six real game cards; clicking one loads its idea into the prompt.
const FEATURED = [2, 3, 0, 10, 7, 8];
$("#collage").innerHTML = FEATURED.map((i, n) => {
  const t = TEMPLATES[i];
  return `
    <button class="tile t${n + 1}" style="--n:${n}" data-use="${i}" aria-label="Use the ${esc(t.name)} idea">
      <span class="tile-visual" aria-hidden="true">
        <span class="tile-card"><img src="${IMG(t)}" alt="" width="640" height="480"></span>
        <span class="tile-chip"><img src="${ICON(t)}" alt="" width="18" height="18">${esc(t.name)}</span>
      </span>
    </button>`;
}).join("");

// Starter chips under the prompt
const STARTERS = [2, 0, 7, 10, 3];
$("#starters").innerHTML = STARTERS.map(i => `
  <button class="starter" data-use="${i}"><img src="${ICON(TEMPLATES[i])}" alt="" width="18" height="18">${esc(TEMPLATES[i].name)}</button>`).join("")
  + `<a class="starter" href="#templates">All ${TEMPLATES.length} games</a>`;

// A browsable library: one accessible card per game, with filters and an explicit expansion.
const GENRES = ['action', 'action', 'build', 'action', 'action', 'explore', 'action', 'explore', 'explore', 'build', 'build', 'action'];
const GENRE_LABELS = { build: 'Build & grow', action: 'Action', explore: 'Explore' };
const LIBRARY_ORDER = [2, 0, 7, 10, 3, 8, 1, 4, 5, 6, 9, 11];
let activeGenre = 'all', allGames = false;
const gameCard = i => {
  const t = TEMPLATES[i];
  return `<article class="game-cover">
    <div class="cover-art"><img src="${IMG(t)}" alt="${esc(t.name)} on Roblox" width="640" height="480" loading="lazy"><span class="cover-genre">${GENRE_LABELS[GENRES[i]]}</span><span class="cover-icon" aria-hidden="true"><img src="${ICON(t)}" alt="" width="22" height="22"></span></div>
    <div class="cover-copy"><h3>${esc(t.name)}</h3><p>${esc(promptFor(t))}</p><button type="button" data-use="${i}">Use this idea <span aria-hidden="true">&#8599;</span><span class="sr-only">: ${esc(t.name)}</span></button></div>
  </article>`;
};
function renderLibrary() {
  const matching = LIBRARY_ORDER.filter(i => activeGenre === 'all' || GENRES[i] === activeGenre);
  const visible = allGames || activeGenre !== 'all' ? matching : matching.slice(0, 6);
  $('#game-grid').innerHTML = visible.map(gameCard).join('');
  $('#library-count').textContent = `${visible.length} of ${matching.length} ideas`;
  $('#show-games').hidden = activeGenre !== 'all';
  $('#show-games').setAttribute('aria-expanded', String(allGames));
  $('#show-games').innerHTML = allGames ? 'Show fewer games <span aria-hidden="true">&#8593;</span>' : 'Show all 12 games <span aria-hidden="true">&#8595;</span>';
}
document.querySelectorAll('[data-genre]').forEach(button => button.addEventListener('click', () => {
  activeGenre = button.dataset.genre;
  document.querySelectorAll('[data-genre]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderLibrary();
}));
$('#show-games').addEventListener('click', () => {
  allGames = !allGames;
  renderLibrary();
  if (!allGames) document.querySelector('.library-toolbar').scrollIntoView({ behavior, block: 'start' });
});
renderLibrary();

// Native scrolling advances a pinned stage reel without intercepting wheel or touch input.
const studioPanels = [...document.querySelectorAll('.studio-panel')];
const walkthrough = document.querySelector('.walkthrough-track');
const studio = document.querySelector('.creation-studio');
const walkthroughMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Each preview is a separate floating object; the copy remains a steady reading anchor.
const stageLabels = [['A tiny stand', 'Your rules'], ['A world to build', 'An idea takes shape'], ['Try. Tweak. Repeat.', 'Your first playtest'], ['Made by you', 'Next stop: Roblox']];
const stageVisuals = studioPanels.map((panel, i) => {
  const preview = panel.lastElementChild;
  const visual = document.createElement('div');
  visual.className = 'stage-visual';
  preview.before(visual);
  visual.append(preview);
  stageLabels[i].forEach((label, n) => {
    const tag = document.createElement('span');
    tag.className = `stage-float stage-float-${n + 1}`;
    tag.textContent = label;
    tag.setAttribute('aria-hidden', 'true');
    visual.append(tag);
  });
  return { visual, copy: panel.querySelector('.studio-copy'), tags: [...visual.querySelectorAll('.stage-float')] };
});
let studioStep = 0, scrollStudio = false, stageTravel = 0, stickyTop = 84, studioFrame = 0;
function setStudioSelection(index) {
  studioStep = index;
  studioPanels.forEach((panel, i) => {
    const inactive = scrollStudio && i !== index;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', String(inactive));
    panel.inert = inactive;
  });
}
function studioScrollStart() { return scrollY + walkthrough.getBoundingClientRect().top - stickyTop; }
function updateStudioScroll() {
  studioFrame = 0;
  if (!scrollStudio) return;
  const raw = Math.max(0, Math.min(3, (scrollY - studioScrollStart()) / stageTravel));
  const whole = Math.floor(raw);
  // A reading hold on each stage, followed by an eased handoff to the next card.
  const phase = Math.max(0, Math.min(1, (raw - whole - .22) / .56));
  const progress = whole + phase * phase * (3 - 2 * phase);
  const selected = Math.min(3, Math.floor(progress + .5));
  if (selected !== studioStep) setStudioSelection(selected);
  studioPanels.forEach((panel, i) => {
    const offset = i - progress, distance = Math.abs(offset);
    const { visual, copy, tags } = stageVisuals[i];
    panel.style.visibility = (walkthroughMotion.matches ? i === selected : distance < 1.05) ? 'visible' : 'hidden';
    panel.style.zIndex = i === selected ? '2' : '1';
    // Reduced motion keeps the scroll walkthrough, with stationary stage changes.
    if (walkthroughMotion.matches) {
      visual.style.transform = 'none';
      copy.style.transform = 'none';
      visual.style.opacity = copy.style.opacity = i === selected ? '1' : '0';
      tags.forEach(tag => { tag.style.transform = 'none'; });
      return;
    }
    // The preview moves through the scene; its labels travel at different depths.
    visual.style.transform = `translate3d(${offset * 18}px, ${offset * 122}%, 0) rotate(${[-3, 2, -2, 3][i] + offset * 6}deg) scale(${1 - Math.min(distance, 1) * .08})`;
    // Fade before the moving card approaches the viewport edge; finish before visibility changes.
    const fade = Math.max(0, Math.min(1, (distance - .12) / .6));
    visual.style.opacity = 1 - fade * fade * (3 - 2 * fade);
    copy.style.transform = `translate3d(0, ${offset * 28}px, 0)`;
    const copyFade = Math.max(0, Math.min(1, distance / .48));
    copy.style.opacity = 1 - copyFade * copyFade * (3 - 2 * copyFade);
    tags.forEach((tag, n) => { tag.style.transform = `translate3d(${offset * (n ? -22 : 20)}px, ${offset * (n ? 70 : -55)}px, 0)`; });
  });
}
function queueStudioScroll() {
  if (scrollStudio && !studioFrame) studioFrame = requestAnimationFrame(updateStudioScroll);
}
function configureStudioScroll() {
  cancelAnimationFrame(studioFrame); studioFrame = 0;
  walkthrough.classList.remove('scroll-enabled');
  studioPanels.forEach((panel, i) => {
    panel.hidden = false;
    ['transform', 'visibility', 'z-index'].forEach(property => panel.style.removeProperty(property));
    const { visual, copy, tags } = stageVisuals[i];
    [visual, copy, ...tags].forEach(element => {
      element.style.removeProperty('transform'); element.style.removeProperty('opacity');
    });
  });
  const panelHeight = Math.ceil(Math.max(...studioPanels.map(panel => panel.getBoundingClientRect().height)));
  const navHeight = Math.ceil(document.querySelector('.nav').getBoundingClientRect().height);
  // Fit tall stages instead of silently replacing the reel with four static cards.
  const availableHeight = Math.max(1, innerHeight - navHeight - 40);
  const sceneScale = Math.min(1, availableHeight / panelHeight);
  const sceneHeight = panelHeight * sceneScale;
  stickyTop = Math.round(navHeight + (innerHeight - navHeight - sceneHeight) / 2);
  stageTravel = Math.max(460, innerHeight * .85);
  walkthrough.style.setProperty('--panel-height', `${panelHeight}px`);
  walkthrough.style.setProperty('--studio-scale', sceneScale);
  walkthrough.style.setProperty('--studio-height', `${sceneHeight}px`);
  walkthrough.style.setProperty('--walkthrough-top', `${stickyTop}px`);
  walkthrough.style.setProperty('--walkthrough-height', `${sceneHeight + stageTravel * 3.65}px`);
  scrollStudio = true;
  walkthrough.classList.add('scroll-enabled');
  setStudioSelection(studioStep);
  updateStudioScroll();
}
function showStudioStep(index, focus = false) {
  if (scrollStudio) {
    // Jump to the exact stage rather than leaving the reel between panels.
    scrollTo({ top: studioScrollStart() + index * stageTravel, behavior: 'instant' });
    updateStudioScroll();
  } else {
    setStudioSelection(index);
    studioPanels[index].scrollIntoView({ behavior: walkthroughMotion.matches ? 'auto' : 'smooth', block: 'center' });
  }
  if (focus) studioPanels[index].focus({ preventScroll: true });
}
document.querySelectorAll('[data-next-step]').forEach(button => button.addEventListener('click', () => showStudioStep(Number(button.dataset.nextStep), true)));
addEventListener('scroll', queueStudioScroll, { passive: true });
addEventListener('resize', configureStudioScroll);
addEventListener('load', configureStudioScroll, { once: true });
walkthroughMotion.addEventListener('change', configureStudioScroll);
if (document.fonts) document.fonts.ready.then(configureStudioScroll);
configureStudioScroll();
// Prompt
const form = $("#prompt");
const idea = $("#idea");
const msg = $("#prompt-msg");

function useIdea(i) {
  idea.value = promptFor(TEMPLATES[i]);
  msg.textContent = "";
  msg.className = "prompt-msg";
  form.scrollIntoView({ behavior, block: "center" });
  idea.focus({ preventScroll: true });
  idea.setSelectionRange(idea.value.length, idea.value.length);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-use]");
  if (b) useIdea(Number(b.dataset.use));
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = idea.value.trim();
  if (!text) {
    msg.className = "prompt-msg error";
    msg.textContent = "Describe your game first, or pick one of the ideas below.";
    form.classList.remove("shake");
    void form.offsetWidth; // restart the shake
    form.classList.add("shake");
    idea.focus();
    return;
  }
  // A concept can't build anything: hand the idea over to the real product.
  const short = text.length > 60 ? text.slice(0, 60) + "…" : text;
  msg.className = "prompt-msg";
  msg.innerHTML = `This concept can't build games. <a href="https://lemonade.gg/sign-in" target="_blank" rel="noopener">Build “${esc(short)}” on lemonade.gg ↗</a>`;
});
idea.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Typewriter: the prompt's placeholder and the "Describe" bubble cycle through real template ideas.
function typewriter(write, texts, { pause = () => false } = {}) {
  let n = 0, length = 0, deleting = false;
  (function tick() {
    if (pause()) return setTimeout(tick, 1200);
    const full = texts[n];
    length += deleting ? -1 : 1;
    write(full.slice(0, length));
    let delay = deleting ? 18 : 45;
    if (!deleting && length === full.length) { deleting = true; delay = 1800; }
    else if (deleting && length === 0) { deleting = false; n = (n + 1) % texts.length; delay = 300; }
    setTimeout(tick, delay);
  })();
}
if (!reduceMotion) {
  const ideas = TEMPLATES.map(promptFor);
  typewriter(t => (idea.placeholder = t || "Make a game where…"), ideas.slice(2).concat(ideas.slice(0, 2)), {
    pause: () => document.activeElement === idea || idea.value !== ""
  });

}

// Hero cards drift a little with the pointer, deeper cards further.
const hero = $(".hero");
if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5) * 2);
    hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
}

// Floating coins keep their depth: scroll works on touch; pointer adds a gentle lateral drift.
// Transform composes with the coins' existing translate-based bobbing animation.
const skyMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(pointer: fine)");
const skyScenes = [...document.querySelectorAll(".hero, .finale")].map(section => ({
  section, x: 0, y: 0,
  layers: [...section.querySelectorAll(".gems img")].map((element, index) => ({
    element, depth: Number(element.dataset.depth || (0.75 + (index % 3) * 0.3)), x: 0, y: 0
  }))
}));
let skyFrame = 0;
let skyLastTime = 0;
function requestSkyFrame() {
  if (!skyFrame && !skyMotion.matches && !document.hidden) skyFrame = requestAnimationFrame(updateSky);
}
function updateSky(time) {
  skyFrame = 0;
  const ease = 1 - Math.exp(-Math.min(time - skyLastTime || 16, 64) / 100);
  skyLastTime = time;
  let settling = false;
  for (const scene of skyScenes) {
    const rect = scene.section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) continue;
    const scroll = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / ((innerHeight + rect.height) / 2)));
    for (const layer of scene.layers) {
      const targetX = scene.x * 24 * layer.depth;
      const targetY = (scroll * 64 + scene.y * 16) * layer.depth;
      layer.x += (targetX - layer.x) * ease;
      layer.y += (targetY - layer.y) * ease;
      layer.element.style.setProperty("--px", `${layer.x.toFixed(2)}px`);
      layer.element.style.setProperty("--py", `${layer.y.toFixed(2)}px`);
      if (Math.abs(targetX - layer.x) + Math.abs(targetY - layer.y) > 0.1) settling = true;
    }
  }
  if (settling) requestSkyFrame();
}
for (const scene of skyScenes) {
  scene.section.addEventListener("pointermove", event => {
    if (skyMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
    const rect = scene.section.getBoundingClientRect();
    scene.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    scene.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    requestSkyFrame();
  }, { passive: true });
  scene.section.addEventListener("pointerleave", () => {
    scene.x = scene.y = 0;
    requestSkyFrame();
  });
}
addEventListener("scroll", requestSkyFrame, { passive: true });
addEventListener("resize", requestSkyFrame, { passive: true });
document.addEventListener("visibilitychange", requestSkyFrame);
skyMotion.addEventListener("change", () => {
  cancelAnimationFrame(skyFrame);
  skyFrame = 0;
  for (const scene of skyScenes) {
    scene.x = scene.y = 0;
    for (const layer of scene.layers) {
      layer.x = layer.y = 0;
      layer.element.style.removeProperty("--px");
      layer.element.style.removeProperty("--py");
    }
  }
  requestSkyFrame();
});
requestSkyFrame();

// In-page links scroll with JavaScript, so they also work where fragment navigation is blocked (some previews).
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  if (id === "top") scrollTo({ top: 0, behavior });
  else target.scrollIntoView({ behavior });
});

// Scroll reveal
if (document.documentElement.classList.contains("reveal-on")) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}
// Measure the actual header so a wrapped concept notice still fits the first screen.
function fitOpening() {
  const notice = document.querySelector('.concept-bar').getBoundingClientRect().height;
  const nav = document.querySelector('.nav').getBoundingClientRect().height;
  document.documentElement.style.setProperty('--opening-offset', `${notice + nav}px`);
  document.documentElement.style.setProperty('--sky-fold', `calc(100svh - ${notice}px)`);
}
fitOpening();
if ('ResizeObserver' in window) {
  const openingObserver = new ResizeObserver(fitOpening);
  openingObserver.observe(document.querySelector('.concept-bar'));
  openingObserver.observe(document.querySelector('.nav'));
}
function updateScrollCue() {
  document.documentElement.classList.toggle('has-scrolled', scrollY > 0);
}
addEventListener('scroll', updateScrollCue, { passive: true });
addEventListener('pageshow', updateScrollCue);
updateScrollCue();

// Small discoveries: every interaction also works with a keyboard and reduced motion.
const eggLines = {
  boss: ['The lemon is mildly annoyed. Boss HP: 2/3.', 'Critical squeeze! Boss HP: 1/3.', 'Boss defeated. Loot: one very dramatic lemonade.'],
  mix: ['Stirring... the sugar is considering its options.', 'One more stir. No lumps left behind.', 'Lemonade unlocked! +10 refreshment.'],
  berry: ['Strawberry DLC installed. Fresh fruit, coming in.', 'Mint expansion unlocked. Extremely fancy.', 'All upgrades acquired. Please enjoy your beverage.']
};
// Feedback stays on the note; each third step earns a small completion mark.
const eggMotion = matchMedia('(prefers-reduced-motion: reduce)');
const discoveryAnimations = new Set();
function discoveryAnimate(element, frames, options) {
  if (eggMotion.matches) return;
  const animation = element.animate(frames, options);
  discoveryAnimations.add(animation);
  animation.finished.catch(() => {}).finally(() => discoveryAnimations.delete(animation));
  return animation;
}
eggMotion.addEventListener('change', () => {
  if (eggMotion.matches) discoveryAnimations.forEach(animation => animation.cancel());
});
document.querySelectorAll('[data-egg]').forEach(button => {
  let taps = 0;
  const output = button.nextElementSibling;
  const progress = document.createElement('span');
  progress.className = 'egg-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<i></i><i></i><i></i><svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  button.after(progress);
  let feedback;
  button.addEventListener('click', () => {
    const step = taps++ % 3;
    output.textContent = eggLines[button.dataset.egg][step];
    if (button.dataset.egg === 'berry') {
      if (step < 2) document.dispatchEvent(new CustomEvent('lemonade:ingredient-drop', { detail: { ingredient: step === 0 ? 'strawberry' : 'mint' } }));
      button.textContent = ['Add mint leaves', 'Finish the upgrade', 'Install strawberry DLC'][step];
    }
    progress.querySelectorAll('i').forEach((bar, index) => bar.classList.toggle('is-filled', index <= step));
    progress.classList.toggle('is-complete', step === 2);
    feedback?.cancel();
    feedback = discoveryAnimate(output, [{ opacity: .35, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.16,1,.3,1)' });
    if (step === 2) discoveryAnimate(progress.querySelector('svg'), [{ transform: 'scale(.7)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
});

// Wide screens show the paper; phones keep it tucked into small, expandable tabs.
const noteMargins = matchMedia('(min-width: 1200px)');
function arrangeNotes() {
  document.querySelectorAll('.note-pocket').forEach(note => { note.open = noteMargins.matches; });
}
noteMargins.addEventListener('change', arrangeNotes);
arrangeNotes();
}, { once: true });
