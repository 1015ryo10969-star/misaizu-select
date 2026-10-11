const { test } = require('node:test');
const assert = require('node:assert/strict');
const { select, validate } = require('../schedule-engine.js');
const pickup = require('../data/pickup.json');

test('Prime feature stays visible through October 19 in JST, then hides at midnight', () => {
  assert.doesNotThrow(() => validate(pickup));
  assert.equal(select(pickup, new Date('2026-10-19T14:59:59.999Z')).articles[0].id, 'prime-thanksgiving-2026');
  assert.equal(select(pickup, new Date('2026-10-19T15:00:00.000Z')).articles.length, 0);
});

test('the same JSON supports a later start date for future limited features', () => {
  const future = { ...pickup, articles: [{ ...pickup.articles[0], startDate: '2026-10-15' }] };
  assert.equal(select(future, new Date('2026-10-14T14:59:59Z')).articles.length, 0);
  assert.equal(select(future, new Date('2026-10-14T15:00:00Z')).articles.length, 1);
});
