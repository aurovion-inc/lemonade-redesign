// Only hide scroll-reveal content when it can animate back in.
  if (matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window)
    document.documentElement.classList.add("reveal-on");

// Run page interactions after the HTML has been parsed.
document.addEventListener('DOMContentLoaded', () => {
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// In-page links scroll with JavaScript, so they also work where fragment navigation is blocked (some previews).
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.getElementById(a.getAttribute("href").slice(1));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
// Floating coins keep their depth: scroll works on touch; pointer adds a gentle lateral drift.
// Transform composes with the coins' existing translate-based bobbing animation.
const skyMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(pointer: fine)");
const skyScenes = [...document.querySelectorAll(".hero, .finale")].map(section => ({
  section, x: 0, y: 0,
  layers: [...section.querySelectorAll('.gems .coin')].map(coin => ({
    element: coin.querySelector('.coin-visual'), depth: Number(coin.dataset.depth), x: 0, y: 0
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
  boss: ['Found it: the bug only appears on Fridays.', 'Plot twist: it was a timezone bug.', 'Regression test added. Tiny victory dance unlocked.'],
  berry: ['One pixel right. Much better.', 'One pixel left. Just checking.', 'Perfect. Now test it on mobile.']
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
