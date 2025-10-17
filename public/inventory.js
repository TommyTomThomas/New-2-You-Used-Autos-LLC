async function fetchVehicles() {
  const res = await fetch('/api/vehicles');
  return res.json();
}
function renderGrid(items) {
  const grid = document.getElementById('grid');
  grid.innerHTML = items.map(v => `
    <div class="card">
      ${v.images && v.images[0] ? `<img src="${v.images[0]}" alt="vehicle photo" />` : `<img src="/car.png" alt="vehicle" />`}
      <div class="body">
        <div><strong>${v.year || ''} ${v.make || ''} ${v.model || ''}</strong></div>
        <div class="meta">
          <span>${(v.mileage||0).toLocaleString()} mi</span>
          <span>${v.color||''}</span>
        </div>
        <div class="price">$${Number(v.price||0).toLocaleString()}</div>
        <p style="color:#c8c8c8">${(v.description||'').slice(0,120)}</p>
        ${v.images && v.images.length > 1 ? `<div class="meta">+${v.images.length-1} more photo(s)</div>` : ''}
      </div>
    </div>
  `).join('');
}
function filterSort(items) {
  const q = document.getElementById('q').value.trim().toLowerCase();
  const sort = document.getElementById('sort').value;
  let list = items.filter(v => {
    const s = `${v.make} ${v.model} ${v.color} ${v.year}`.toLowerCase();
    return s.includes(q);
  });
  if (sort === 'price-asc') list.sort((a,b)=> (a.price||0)-(b.price||0));
  else if (sort === 'price-desc') list.sort((a,b)=> (b.price||0)-(a.price||0));
  else if (sort === 'year-desc') list.sort((a,b)=> (b.year||0)-(a.year||0));
  else if (sort === 'year-asc') list.sort((a,b)=> (a.year||0)-(b.year||0));
  renderGrid(list);
}
let VEHICLES = [];
fetchVehicles().then(v => { VEHICLES = v; filterSort(VEHICLES); });
document.getElementById('q').addEventListener('input', ()=> filterSort(VEHICLES));
document.getElementById('sort').addEventListener('change', ()=> filterSort(VEHICLES));
