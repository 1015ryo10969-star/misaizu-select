(function () {
  'use strict';
  const section = document.querySelector('#pickup');
  const mount = document.querySelector('#pickup-content');
  let config;
  let renderedKey = '';
  let busy = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function card(article) {
    const wrapper = element('article', 'pickup-card');
    const imageLink = element('a', 'pickup-media');
    imageLink.href = article.url;
    imageLink.setAttribute('aria-label', `${article.title}を見る`);
    const image = element('img');
    image.src = article.image;
    image.alt = article.imageAlt;
    image.width = 780;
    image.height = 408;
    image.loading = 'lazy';
    image.decoding = 'async';
    imageLink.append(image);

    const copy = element('div', 'pickup-copy');
    copy.append(element('span', 'pickup-kicker', 'LIMITED FEATURE'));
    copy.append(element('h3', '', article.title));
    copy.append(element('p', '', article.description));
    if (article.endDate) {
      const [, month, day] = article.endDate.split('-');
      copy.append(element('span', 'pickup-until', `${Number(month)}月${Number(day)}日まで`));
    }
    const button = element('a', 'button green', article.buttonText || '特集を見る');
    button.href = article.url;
    copy.append(button);
    wrapper.append(imageLink, copy);
    return wrapper;
  }

  function refresh() {
    if (!config) return;
    const selected = SelectSchedule.select(config);
    const article = selected.articles[0];
    if (!article) {
      mount.replaceChildren();
      section.hidden = true;
      renderedKey = '';
      return;
    }
    const key = JSON.stringify(article);
    if (key !== renderedKey) {
      mount.replaceChildren(card(article));
      renderedKey = key;
    }
    section.hidden = false;
  }

  async function load() {
    if (busy) return;
    busy = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('data/pickup.json', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      SelectSchedule.validate(next);
      config = next;
      refresh();
    } catch (error) {
      console.warn('PICK UP:', error.message);
      // 読込済み設定があれば、通信障害中も終了日の判定を続ける。
      if (config) refresh();
      else section.hidden = true;
    } finally {
      clearTimeout(timeout);
      busy = false;
    }
  }

  load();
  function tick() {
    refresh();
    const now = Date.now();
    const untilMidnight = 86400000 - ((now + 9 * 3600000) % 86400000);
    setTimeout(tick, Math.min(untilMidnight + 20, 60000));
  }
  tick();
  setInterval(load, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refresh(); load(); } });
  window.addEventListener('pageshow', () => { refresh(); load(); });
})();
