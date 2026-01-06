const TAX_RATE = 0.065;
let products = [];
let cart = [];
let customerType = 'regular'; // or 'rewards'

async function loadProducts() {
  const resp = await fetch('/api/catalog');
  products = await resp.json();
  renderCatalog();
}

function renderCatalog() {
  const container = document.getElementById('catalog');
  container.innerHTML = '';
  products.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'card';
    const price = customerType === 'rewards' ? p.memberPrice : p.regularPrice;
    el.innerHTML = `<h3>${p.name}</h3>
      <div class="meta">Stock: ${p.quantity}</div>
      <div class="price">$${price.toFixed(2)}</div>
      <div style="margin-top:10px"><button data-idx="${idx}">Add to cart</button></div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', onAdd));
}

function onAdd(e) {
  const idx = Number(e.currentTarget.dataset.idx);
  const p = products[idx];
  const price = customerType === 'rewards' ? p.memberPrice : p.regularPrice;
  // cart-level stock validation
  const inCart = cart.find(ci => ci.name === p.name);
  const cartQty = inCart ? inCart.quantity : 0;
  if (cartQty + 1 > p.quantity) {
    alert('Not enough stock');
    return;
  }
  if (inCart) inCart.quantity += 1;
  else cart.push({ name: p.name, quantity: 1, unitPrice: price, taxStatus: p.taxStatus });
  renderCartCount();
}

function renderCartCount() {
  document.getElementById('cart-count').textContent = cart.reduce((s,i)=> s + i.quantity,0);
}

function showCart() {
  document.getElementById('cart-panel').classList.remove('hidden');
  const rows = document.getElementById('cart-rows');
  rows.innerHTML = '';
  cart.forEach(it => {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<div>${it.name} x${it.quantity}</div><div>$${(it.unitPrice*it.quantity).toFixed(2)}</div>`;
    rows.appendChild(r);
  });
  document.getElementById('cart-subtotal').textContent = cart.reduce((s,i)=> s + i.unitPrice*i.quantity,0).toFixed(2);
}

function checkout() {
  // Ask server to validate and compute totals (no commit)
  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, customerType, commit: false })
  }).then(r=>r.json()).then(resp=>{
    if (resp.error) {
      alert(resp.error);
      return;
    }
    // populate payment panel
    document.getElementById('pay-subtotal').textContent = resp.subtotal.toFixed(2);
    document.getElementById('pay-tax').textContent = resp.tax.toFixed(2);
    document.getElementById('pay-total').textContent = resp.total.toFixed(2);
    document.getElementById('pay-change').textContent = '0.00';
    document.getElementById('cash-given').value = '';
    document.getElementById('cart-panel').classList.add('hidden');
    document.getElementById('payment-panel').classList.remove('hidden');
  }).catch(err=>{ alert('Checkout failed'); });
}

function finalizePayment() {
  const cash = parseFloat(document.getElementById('cash-given').value || '0');
  const total = parseFloat(document.getElementById('pay-total').textContent || '0');
  if (isNaN(cash)) return alert('Invalid cash amount');
  if (cash < total) return alert('Not enough cash provided');
  // commit the purchase on server
  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, customerType, commit: true })
  }).then(r=>r.json()).then(resp=>{
    if (resp.error) { alert(resp.error); return; }
    const change = cash - resp.total;
    document.getElementById('pay-change').textContent = change.toFixed(2);
    // show receipt
    const lines = [];
    cart.forEach(i => lines.push(`${i.name} x${i.quantity}  $${(i.unitPrice*i.quantity).toFixed(2)}`));
    lines.push(`Subtotal: $${resp.subtotal.toFixed(2)}`);
    lines.push(`Tax: $${resp.tax.toFixed(2)}`);
    lines.push(`Total: $${resp.total.toFixed(2)}`);
    lines.push(`Cash: $${cash.toFixed(2)}`);
    lines.push(`Change: $${change.toFixed(2)}`);
    document.getElementById('receipt-text').textContent = lines.join('\n');
    document.getElementById('payment-panel').classList.add('hidden');
    document.getElementById('receipt-panel').classList.remove('hidden');
    // clear cart and refresh catalog
    cart = [];
    renderCartCount();
    loadProducts();
  }).catch(err=>{ alert('Payment failed'); });
}

function cancelPayment() {
  document.getElementById('payment-panel').classList.add('hidden');
  document.getElementById('cart-panel').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementsByName('customer').forEach(inp => inp.addEventListener('change', e=>{ customerType = e.target.value; renderCatalog(); }));
  document.getElementById('view-cart').addEventListener('click', showCart);
  document.getElementById('close-cart').addEventListener('click', ()=>document.getElementById('cart-panel').classList.add('hidden'));
  document.getElementById('close-receipt').addEventListener('click', ()=>document.getElementById('receipt-panel').classList.add('hidden'));
  document.getElementById('checkout').addEventListener('click', checkout);
  document.getElementById('pay-now').addEventListener('click', finalizePayment);
  document.getElementById('cancel-pay').addEventListener('click', cancelPayment);
});
