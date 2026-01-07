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
    // include quantity input so user can choose how many to add
    el.innerHTML = `<h3>${p.name}</h3>
      <div class="meta">Stock: ${p.quantity}</div>
      <div class="price">$${price.toFixed(2)}</div>
      <div style="margin-top:10px">
        <label>Qty <input class="qty-input" data-idx="${idx}" type="number" min="1" value="1" style="width:60px;padding:6px;border-radius:6px;border:1px solid #e6eef8" /></label>
        <button data-idx="${idx}">Add to cart</button>
      </div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', onAdd));
}

function onAdd(e) {
  const idx = Number(e.currentTarget.dataset.idx);
  const p = products[idx];
  const price = customerType === 'rewards' ? p.memberPrice : p.regularPrice;
  // read desired qty from input on the same card
  const container = e.currentTarget.closest('.card');
  let desired = 1;
  const qInput = container && container.querySelector('.qty-input');
  if (qInput) desired = Math.max(1, Number(qInput.value) || 1);

  // cart-level stock validation
  const inCart = cart.find(ci => ci.name === p.name);
  const cartQty = inCart ? inCart.quantity : 0;
  if (cartQty + desired > p.quantity) {
    alert('Not enough stock');
    return;
  }
  if (inCart) inCart.quantity += desired;
  else cart.push({ name: p.name, quantity: desired, unitPrice: price, taxStatus: p.taxStatus });
  renderCartCount();
  showToast(`${p.name} added to cart`);
}

function renderCartCount() {
  document.getElementById('cart-count').textContent = cart.reduce((s,i)=> s + i.quantity,0);
  const checkoutBtn = document.getElementById('checkout');
  const emptyBtn = document.getElementById('empty-cart');
  const hasItems = cart.length > 0;
  if (checkoutBtn) checkoutBtn.disabled = !hasItems;
  if (emptyBtn) emptyBtn.disabled = !hasItems;
}

function showCart() {
  document.getElementById('cart-panel').classList.remove('hidden');
  const rows = document.getElementById('cart-rows');
  rows.innerHTML = '';
  cart.forEach(it => {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<div><strong>${it.name}</strong> <button class="minus" data-name="${it.name}">-</button> <span class="qty" data-name="${it.name}">${it.quantity}</span> <button class="plus" data-name="${it.name}">+</button></div>
                   <div>$${(it.unitPrice*it.quantity).toFixed(2)} <button class="remove" data-name="${it.name}">Remove</button></div>`;
    rows.appendChild(r);
  });
  document.getElementById('cart-subtotal').textContent = cart.reduce((s,i)=> s + i.unitPrice*i.quantity,0).toFixed(2);
  // attach remove handlers
  rows.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const name = ev.currentTarget.dataset.name;
    removeFromCart(name);
  }));
  // attach plus/minus handlers
  rows.querySelectorAll('.plus').forEach(btn => btn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const name = ev.currentTarget.dataset.name;
    const prod = products.find(p=>p.name===name);
    if (!prod) return showToast('Product not found');
    const inCart = cart.find(i=>i.name===name);
    if (!inCart) return;
    if (inCart.quantity + 1 > prod.quantity) { showToast('Not enough stock'); return; }
    inCart.quantity += 1;
    renderCartCount();
    showCart();
  }));
  rows.querySelectorAll('.minus').forEach(btn => btn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const name = ev.currentTarget.dataset.name;
    const inCart = cart.find(i=>i.name===name);
    if (!inCart) return;
    if (inCart.quantity > 1) {
      inCart.quantity -= 1;
      renderCartCount();
      showCart();
    } else {
      removeFromCart(name);
    }
  }));
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  renderCartCount();
  showCart();
  showToast(`${name} removed from cart`);
}

function emptyCart() {
  if (cart.length === 0) { showToast('Cart is already empty'); return; }
  cart = [];
  renderCartCount();
  showCart();
  showToast('Cart emptied');
}

function showToast(msg, timeout = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.add('hidden'), timeout);
}

function checkout() {

  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, customerType, commit: false })
  })
  .then(r => {
    return r.text();
  })
  .then(text => {
    try {
      const resp = JSON.parse(text);
      return resp;
    } catch (e) {
      console.error("JSON PARSE FAILED!", e);
      throw e;   // force into catch block
    }
  })
  .then(resp => {

    if (resp.error) {
      alert(resp.error);
      return;
    }

    document.getElementById('pay-subtotal').textContent = resp.subtotal.toFixed(2);
    document.getElementById('pay-tax').textContent = resp.tax.toFixed(2);
    document.getElementById('pay-total').textContent = resp.total.toFixed(2);

    document.getElementById('cash-given').value = '';

    document.getElementById('cart-panel').classList.add('hidden');
    document.getElementById('payment-panel').classList.remove('hidden');

  })
  .catch(err => {

    console.error("CHECKOUT FAILED – actual error object:");
    console.error(err);

    alert("Checkout failed – see console for details");
  });
}

function finalizePayment() {
  const cash = parseFloat(document.getElementById('cash-given').value || '0');
  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, customerType, cash, commit: true })
  })
  .then(r => r.json())
  .then(resp => {

    if (resp.error) {
      alert(resp.error);
      return;
    }

    const change = cash - resp.total;
    // ----- SHOW RECEIPT PANEL -----
    document.getElementById('receipt-text').textContent = resp.receipt;
    document.getElementById('payment-panel').classList.add('hidden');
    document.getElementById('receipt-panel').classList.remove('hidden');
    cart = [];
    renderCartCount();
    loadProducts();

  })
  .catch(err => {
    console.error("Payment failed:", err);
    alert("Payment failed");
  });
}



function cancelPayment() {
  document.getElementById('payment-panel').classList.add('hidden');
  document.getElementById('cart-panel').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementsByName('customer').forEach(inp => inp.addEventListener('change', e=>{
    const newType = e.target.value;
    if (newType === customerType) return;
    const previous = customerType;
    customerType = newType;
    renderCatalog();
    if (cart.length > 0) {
      cart = [];
      renderCartCount();
      // hide cart panel in case it is open
      const panel = document.getElementById('cart-panel');
      if (panel) panel.classList.add('hidden');
      showToast(`Customer switched to ${customerType}. Cart was cleared because customer types cannot be mixed.`);
    } else {
      showToast(`Customer switched to ${customerType}.`);
    }
  }));
  document.getElementById('view-cart').addEventListener('click', showCart);
  document.getElementById('close-cart').addEventListener('click', ()=>document.getElementById('cart-panel').classList.add('hidden'));
  document.getElementById('empty-cart').addEventListener('click', emptyCart);
  document.getElementById('close-receipt').addEventListener('click', ()=>document.getElementById('receipt-panel').classList.add('hidden'));
  document.getElementById('checkout').addEventListener('click', checkout);
  document.getElementById('pay-now').addEventListener('click', finalizePayment);
  document.getElementById('cancel-pay').addEventListener('click', cancelPayment);
  document.getElementById('download-receipt').addEventListener('click', downloadReceipt);
  // click outside cart-panel closes it
  document.addEventListener('click', function onDocClick(e) {
    const panel = document.getElementById('cart-panel');
    if (panel.classList.contains('hidden')) return;
    // Use composedPath to determine whether the click started inside the panel or view-cart button.
    const path = (e.composedPath && e.composedPath()) || (function(){
      const arr = []; let n = e.target; while(n){ arr.push(n); n = n.parentNode; } return arr;
    })();
    if (path.includes(panel) || path.some(n=> n && n.id === 'view-cart')) return;
    panel.classList.add('hidden');
  });
  // initialize cart buttons state
  renderCartCount();
});

function downloadReceipt() {
  const receipt = document.getElementById('receipt-text').textContent;
  if (!receipt) {
    showToast("No receipt available");
    return;
  }
  const transId = document.getElementById('receipt-panel').dataset.transId;
  const date = document.getElementById('receipt-panel').dataset.date;

  fetch('/api/printReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt, transId, date })
  })
  .then(r => {
    return r.json();
  })
  .then(resp => {
    if (resp.error) {
      alert(resp.error);
      return;
    }
    showToast(`Saved as ${resp.fileName}`);
    // Trigger client-side download directly from the receipt text (do not rely on /receipts URL)
    try {
      const blob = new Blob([receipt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resp.fileName || `receipt_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Receipt downloaded');
    } catch (err) {
      console.error('Client download failed after server save:', err);
      alert('Download failed');
    }
  })
  .catch(err => {
    console.error("Download receipt FAILED (server save):", err);
    // Fallback: attempt client-side download even if server save failed
    try {
      const blob = new Blob([receipt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Receipt downloaded (local)');
    } catch (e) {
      console.error('Client fallback download also failed', e);
      alert('Receipt download failed – see console');
    }
  });
}

