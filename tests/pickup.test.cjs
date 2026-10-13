const { test } = require('node:test');
const assert = require('node:assert/strict');
const { select, validate } = require('../schedule-engine.js');
const pickup = require('../data/pickup.json');

test('Prime feature stays visible through October 19 in JST, then hides at midnight', () => {
  assert.doesNotThrow(() => validate(pickup));
  assert.deepEqual(select(pickup, new Date('2026-10-19T14:59:59.999Z')).articles.map(article => article.id), [
    'prime-thanksgiving-2026',
    'hana-prime-thanksgiving-2026'
  ]);
  assert.equal(select(pickup, new Date('2026-10-19T15:00:00.000Z')).articles.length, 0);
});

test('HANA appears below Prime from October 14 JST without changing Prime before that', () => {
  assert.deepEqual(select(pickup, new Date('2026-10-13T14:59:59.999Z')).articles.map(article => article.id), ['prime-thanksgiving-2026']);
  assert.deepEqual(select(pickup, new Date('2026-10-13T15:00:00.000Z')).articles.map(article => article.id), [
    'prime-thanksgiving-2026',
    'hana-prime-thanksgiving-2026'
  ]);
});

test('the same JSON supports a later start date for future limited features', () => {
  const future = { ...pickup, articles: [{ ...pickup.articles[0], startDate: '2026-10-15' }] };
  assert.equal(select(future, new Date('2026-10-14T14:59:59Z')).articles.length, 0);
  assert.equal(select(future, new Date('2026-10-14T15:00:00Z')).articles.length, 1);
});
