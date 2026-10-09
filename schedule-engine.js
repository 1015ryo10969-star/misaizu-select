(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SelectSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  function jstDate(now = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function dateOnly(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日付は YYYY-MM-DD で設定してください。');
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`存在しない日付です: ${value}`);
    return value;
  }
  function validate(config) {
    if (!config || config.timezone !== 'Asia/Tokyo' || !Array.isArray(config.articles)) throw new Error('timezone と articles を確認してください。');
    if (config.seed !== undefined && typeof config.seed !== 'string') throw new Error('seed は文字列で設定してください。');
    const ids = new Set();
    return config.articles.map(article => {
      if (!article || typeof article.id !== 'string' || !article.id.trim() || ids.has(article.id)) throw new Error('記事の id は重複しない文字列にしてください。');
      ids.add(article.id);
      for (const key of ['title', 'description', 'url', 'image', 'imageAlt', 'category']) {
        if (typeof article[key] !== 'string' || !article[key].trim()) throw new Error(`${article.id}: ${key} を設定してください。`);
      }
      if (!/^https:\/\//i.test(article.url) || !/^https:$/.test(new URL(article.url).protocol)) throw new Error('記事URLは https:// で設定してください。');
      if (!/^assets\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g|svg)$/i.test(article.image) || article.image.includes('..')) throw new Error('画像は assets/ 内のファイルを指定してください。');
      if (article.enabled !== undefined && typeof article.enabled !== 'boolean') throw new Error('enabled は true または false です。');
      if (article.priority !== undefined && !Number.isFinite(article.priority)) throw new Error('priority は数値です。');
      if (article.buttonText !== undefined && (typeof article.buttonText !== 'string' || !article.buttonText.trim())) throw new Error('buttonText は空でない文字列です。');
      const startDate = dateOnly(article.startDate), endDate = dateOnly(article.endDate);
      if (startDate && endDate && startDate > endDate) throw new Error(`${article.id}: 終了日は開始日以降にしてください。`);
      return { ...article, startDate, endDate };
    });
  }
  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) { value ^= text.charCodeAt(i); value = Math.imul(value, 16777619); }
    value ^= value >>> 16; value = Math.imul(value, 0x85ebca6b);
    value ^= value >>> 13; value = Math.imul(value, 0xc2b2ae35);
    return (value ^ (value >>> 16)) >>> 0;
  }
  function select(config, now = new Date()) {
    const day = jstDate(now);
    const articles = validate(config).filter(a => a.enabled !== false);
    const scheduled = articles.filter(a => (a.startDate || a.endDate) && (!a.startDate || a.startDate <= day) && (!a.endDate || day <= a.endDate));
    if (scheduled.length) return { day, mode: 'scheduled', articles: scheduled.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.id < b.id ? -1 : 1)) };
    const candidates = articles.filter(a => !a.startDate && !a.endDate).sort((a, b) => a.id < b.id ? -1 : 1);
    if (!candidates.length) return { day, mode: 'empty', articles: [] };
    const index = hash(`${config.seed || 'misaizu-select'}:${day}`) % candidates.length;
    return { day, mode: 'daily', articles: [candidates[index]] };
  }
  return { jstDate, validate, select };
});
