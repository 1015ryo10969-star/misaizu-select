const { test } = require('node:test');
const assert = require('node:assert/strict');
const { jstDate, select, validate } = require('../schedule-engine.js');
const base = { id:'test', title:'特集', description:'紹介', url:'https://example.com/', image:'assets/hero.webp', imageAlt:'建物', category:'特集' };
const item = (id, extra = {}) => ({ ...base, id, ...extra });
const config = (...articles) => ({ timezone:'Asia/Tokyo', seed:'test', articles });
const at = (iso) => new Date(iso);
test('JST date switches at 15:00 UTC, including year boundaries', () => {
  assert.equal(jstDate(at('2026-12-31T14:59:59Z')), '2026-12-31');
  assert.equal(jstDate(at('2026-12-31T15:00:00Z')), '2027-01-01');
});
test('start and end dates are inclusive in JST; no expired/future fallback', () => {
  const c=config(item('special',{startDate:'2026-10-10',endDate:'2026-10-11'}),item('daily'));
  assert.equal(select(c,at('2026-10-09T14:59:59Z')).articles[0].id,'daily');
  assert.equal(select(c,at('2026-10-09T15:00:00Z')).articles[0].id,'special');
  assert.equal(select(c,at('2026-10-11T14:59:59.999Z')).articles[0].id,'special');
  assert.equal(select(c,at('2026-10-11T15:00:00Z')).articles[0].id,'daily');
});
test('single-day, one-sided dates and overlapping schedules', () => {
  const c=config(item('a',{startDate:'2026-10-10',endDate:'2026-10-10',priority:5}),item('b',{endDate:'2026-10-10',priority:10}),item('c',{startDate:'2026-10-11'}),item('daily'));
  assert.deepEqual(select(c,at('2026-10-10T03:00:00Z')).articles.map(a=>a.id),['b','a']);
  assert.deepEqual(select(c,at('2026-10-11T03:00:00Z')).articles.map(a=>a.id),['c']);
});
test('same JST day is stable across reload, timezone and JSON order', () => {
  const c=config(item('a'),item('b'),item('c'));
  const first=select(c,at('2026-10-09T15:00:00Z')).articles[0].id;
  for(const tz of ['UTC','America/Los_Angeles','Asia/Tokyo']) {
    process.env.TZ=tz;
    assert.equal(select(c,at('2026-10-10T14:59:59Z')).articles[0].id,first);
    assert.equal(select({...c,articles:[...c.articles].reverse()},at('2026-10-10T12:00:00Z')).articles[0].id,first);
  }
  const chosen=new Set(Array.from({length:31},(_,i)=>select(c,new Date(Date.UTC(2026,9,i+1))).articles[0].id));
  assert.ok(chosen.size>1,'daily selection must not be constant');
});
test('disabled items and empty candidates are handled', () => {
  assert.equal(select(config(item('disabled',{enabled:false}))).mode,'empty');
  assert.equal(select(config(item('expired',{endDate:'2020-01-01'}))).articles.length,0);
  assert.equal(select(config(item('empty-dates',{startDate:'',endDate:null}))).mode,'daily');
});
test('invalid configurations fail closed', () => {
  for (const date of ['2026-02-30','2026-13-01','2026/10/10','2026-10-10T12:00:00+09:00']) assert.throws(()=>validate(config(item('bad',{startDate:date}))));
  assert.doesNotThrow(()=>validate(config(item('leap',{startDate:'2028-02-29'}))));
  assert.throws(()=>validate(config(item('reverse',{startDate:'2026-10-11',endDate:'2026-10-10'}))));
  assert.throws(()=>validate(config(item('same'),item('same'))));
  assert.throws(()=>validate(config(item('unsafe',{url:'javascript:alert(1)'}))));
  assert.throws(()=>validate(config(item('unsafe',{image:'../private.png'}))));
});
