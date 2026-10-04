// Load before styles so a transferred pink background is present on the first paint.
(() => {
  const root = document.documentElement;
  const project = new URL('./', document.currentScript.src);
  const storageKey = `lemonade-background-v1:${project.href}`;
  const parameter = 'glass-state';
  const pages = ['main/index.html', 'careers/index.html'].map(path => new URL(path, project).href);
  const normalize = value => ({
    pink: value?.pink === true,
    fizzUntil: Number.isFinite(value?.fizzUntil) && value.fizzUntil > Date.now() && value.fizzUntil <= Date.now() + 8000 ? value.fizzUntil : 0
  });
  function readStored() {
    try { const value = sessionStorage.getItem(storageKey); return value ? normalize(JSON.parse(value)) : null; }
    catch { return null; }
  }
  let state = readStored() || normalize(null);
  function storeState() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); return true; }
    catch { return false; }
  }
  const current = new URL(location.href);
  const incoming = current.searchParams.get(parameter)?.match(/^(pink|yellow)(?::(\d{13}))?$/);
  if (incoming) {
    state = normalize({ pink: incoming[1] === 'pink', fizzUntil: Number(incoming[2]) });
    if (storeState()) {
      current.searchParams.delete(parameter);
      try { history.replaceState(history.state, '', current.href); } catch { /* File previews can restrict history changes. */ }
    }
  }
  const get = () => normalize(state);
  function decorateLink(link) {
    if (!link?.hasAttribute('href')) return;
    const destination = new URL(link.getAttribute('href'), location.href);
    if (!pages.some(page => {
      const route = new URL(page);
      return destination.protocol === route.protocol && destination.host === route.host && destination.pathname === route.pathname;
    }) || destination.pathname === location.pathname) return;
    const saved = get();
    destination.searchParams.set(parameter, `${saved.pink ? 'pink' : 'yellow'}${saved.fizzUntil ? ':' + saved.fizzUntil : ''}`);
    link.setAttribute('href', destination.href);
  }
  function refreshLinks() { document.querySelectorAll('a[href]').forEach(decorateLink); }
  function restorePaint() {
    root.classList.add('restoring-glass');
    root.classList.toggle('pink-lemonade', get().pink);
  }
  function finishRestore() {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('restoring-glass')));
  }
  window.lemonadeBackground = {
    get,
    set(changes) { state = normalize({ ...state, ...changes }); storeState(); refreshLinks(); }
  };
  restorePaint();
  document.addEventListener('DOMContentLoaded', () => { refreshLinks(); finishRestore(); }, { once: true });
  // Refresh just before following a link, preserving its destination fragment and query.
  document.addEventListener('click', event => decorateLink(event.target.closest('a[href]')), true);
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    state = readStored() || get();
    restorePaint(); refreshLinks();
    document.dispatchEvent(new CustomEvent('lemonade:background-restore'));
    finishRestore();
  });
})();
