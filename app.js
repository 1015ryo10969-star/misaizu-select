const cards = [...document.querySelectorAll('[data-card]')];
const sections = [...document.querySelectorAll('.media-section')];
let filter = 'all';
const isCurrent = (element, now = Date.now()) => {
  const start = element.dataset.start, end = element.dataset.end;
  return (!start || Date.parse(start) <= now) && (!end || now < Date.parse(end));
};
function refresh() {
  let count = 0;
  cards.forEach(card => {
    const match = filter === 'all' || card.dataset.media === filter || (filter === 'new' && card.dataset.new === 'true');
    card.hidden = !isCurrent(card) || !match;
    if (!card.hidden) count++;
  });
  sections.forEach(section => section.hidden = ![...section.querySelectorAll('[data-card]')].some(c => !c.hidden));
  document.querySelector('#result-count').textContent = `${count}件のおすすめ記事`;
  document.querySelector('#empty-state').hidden = count !== 0;
  document.querySelectorAll('#on-air[data-scheduled]').forEach(el => el.hidden = !isCurrent(el));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  refresh();
}));
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  const destination = link.getAttribute('href').slice(1);
  if (['oshi','ai','note'].includes(destination)) {
    filter = 'all';
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')));
    refresh();
  }
}));
refresh();
setInterval(refresh, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
