(function () {
  'use strict';
  const region = document.querySelector('#featured');
  const list = document.querySelector('#feature-list');
  const status = document.querySelector('#feature-status');
  const empty = document.querySelector('#feature-empty');
  let config, renderedKey = '', busy = false;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function renderCard(article) {
    const card = element('article', 'feature');
    card.dataset.featureId = article.id;
    const image = element('img', 'feature-photo');
    image.src = article.image; image.alt = article.imageAlt;
    image.width = 1000; image.height = 750; image.loading = 'lazy'; image.decoding = 'async';
    const body = element('div', 'feature-copy');
    body.append(element('div', 'feature-meta', "EDITOR'S PICK"), element('span', 'tag', article.category));
    const heading = element('h3');
    article.title.split('\n').forEach((line, i) => { if (i) heading.append(document.createElement('br')); heading.append(document.createTextNode(line)); });
    const link = element('a', 'button rose', article.buttonText || '特集を読む');
    link.href = article.url;
    body.append(heading, element('p', '', article.description), link);
    card.append(image, body);
    return card;
  }
  function refresh() {
    if (!config) return;
    const selected = SelectSchedule.select(config);
    const key = JSON.stringify(selected);
    if (key === renderedKey) return;
    list.replaceChildren(...selected.articles.map(renderCard));
    list.dataset.day = selected.day; list.dataset.mode = selected.mode;
    empty.hidden = selected.articles.length !== 0;
    status.hidden = true;
    renderedKey = key;
  }
  async function load() {
    if (busy) return;
    busy = true;
    region.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('data/featured.json', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      SelectSchedule.validate(next);
      config = next;
      refresh();
      status.hidden = true;
    } catch (error) {
      console.warn('FEATURED:', error.message);
      // 通信エラーでも、読込済みの設定があれば日付による終了判定を続ける。
      if (config) refresh();
      else {
        list.replaceChildren(); empty.hidden = true;
        status.textContent = '特集を読み込めませんでした。記事の棚からおすすめをご覧ください。';
        status.hidden = false;
      }
    } finally {
      clearTimeout(timeout); busy = false;
      region.setAttribute('aria-busy', 'false');
    }
  }
  load();
  // JSTの午前0時で切り替え。休止・復帰時にも再判定する。
  function tick() {
    refresh();
    const now = Date.now(), dayMs = 86400000;
    const untilMidnight = dayMs - ((now + 9 * 3600000) % dayMs);
    setTimeout(tick, Math.min(untilMidnight + 20, 60000));
  }
  tick();
  setInterval(load, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refresh(); load(); } });
  window.addEventListener('pageshow', () => { refresh(); load(); });
})();
