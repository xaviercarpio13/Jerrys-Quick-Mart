const readline = require('readline');
const path = require('path');
const { parseProductFile, updateTxtFile, printIntoTxt } = require('./utils/IOParser');
const Item = require('./models/Item');
const Catalog = require('./models/Catalog');
const RegularCustomer = require('./models/RegularCustomer');
const RewardsMember = require('./models/RewardsCustomer');
const Cart = require('./models/Cart');

const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.txt');

function prompt(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

function loadItems() {
  const data = parseProductFile(inventoryPath);
  return data.map(p => new Item(p.item, p.quantity, p.regularPrice, p.memberPrice, p.taxStatus));
}

function showCatalogForCustomer(items, customer) {
  const catalog = new Catalog(items);
  const view = catalog.getCatalogForCustomer(customer);
  console.log('\n=== Catalog ===');
  view.forEach((it, idx) => {
    console.log(`${idx}. ${it.name} | Stock: ${it.quantity} | Price: $${it.price.toFixed(2)} | Tax: ${it.taxStatus}`);
  });
  console.log('Type the item index to add it to cart, or commands: cart, remove, empty, checkout, help, quit');
  return view;
}

function showCart(cart) {
  console.log('\n=== Cart ===');
  if (!cart.items.length) { console.log('(empty)'); return; }
  cart.items.forEach((li, idx) => {
    console.log(`${idx}. ${li.item.name} x${li.quantity} @ $${li.unitPrice.toFixed(2)} => $${(li.unitPrice*li.quantity).toFixed(2)}`);
  });
  console.log(`Subtotal: $${cart.calculateSubtotal().toFixed(2)}`);
}

async function cli() {
  const items = loadItems();
  const name = (await prompt('Your name: ')).trim() || 'Customer';
  let custType;
  while (true) {
    const t = (await prompt('Customer type (1=regular, 2=rewards): ')).trim();
    if (t === '1') { custType = 'regular'; break; }
    if (t === '2') { custType = 'rewards'; break; }
    console.log('Invalid input. Enter 1 or 2.');
  }
  const customer = custType === 'rewards' ? new RewardsMember(name, new Date()) : new RegularCustomer(name, new Date());
  const catalogView = showCatalogForCustomer(items, customer);

  const cart = Cart.getInstance();

  while (true) {
    const cmd = (await prompt('\n> ')).trim();
    if (cmd === 'quit' || cmd === 'q' || cmd === 'exit') {
      console.log('Goodbye');
      process.exit(0);
    }
    if (cmd === 'help') {
      console.log('Commands: index (number) to add, cart, remove, empty, list, checkout, help, quit');
      continue;
    }
    if (cmd === 'list') { showCatalogForCustomer(items, customer); continue; }
    if (cmd === 'cart') { showCart(cart); continue; }
    if (cmd === 'empty') { cart.items = []; console.log('Cart emptied'); continue; }
    if (cmd.startsWith('remove')) {
      // remove [index] or remove name
      const parts = cmd.split(' ').slice(1);
      if (!parts.length) { console.log('Usage: remove <index|name> [qty]'); continue; }
      const key = parts[0];
      const qty = parts[1] ? Number(parts[1]) : null;
      let nameToRemove = key;
      if (/^\d+$/.test(key)) {
        const idx = Number(key);
        if (!cart.items[idx]) { console.log('Invalid cart index'); continue; }
        nameToRemove = cart.items[idx].item.name;
      }
      cart.deleteItem(nameToRemove, qty);
      console.log(`Removed ${qty||'all'} of ${nameToRemove} from cart`);
      continue;
    }
    if (cmd === 'checkout') {
      if (!cart.items.length) { console.log('Cart is empty'); continue; }
  const preview = cart.goToCheckout();
  console.log('\n=== Receipt Preview ===');
  console.log(preview.generateReceipt(false));
      let cashVal = null;
      while (true) {
        const c = (await prompt('Enter cash amount (or type cancel): ')).trim();
        if (c.toLowerCase() === 'cancel') { console.log('Checkout cancelled'); break; }
        const num = Number(c);
        if (isNaN(num)) { console.log('Invalid number'); continue; }
        cashVal = num; break;
      }
      if (cashVal === null) continue;
      const receipt = cart.goToCheckout(cashVal);
      if (!receipt) { console.log('Insufficient cash. Checkout aborted.'); continue; }
      console.log('\n=== RECEIPT ===');
      console.log(receipt.generateReceipt());
      cart.items = [];
      receipt.lineItems.forEach(li => {
        const master = items.find(it => it.name === li.name);
        if (master) master.quantity = Math.max(0, master.quantity - li.quantity);
      });
      const ok = updateTxtFile(inventoryPath, items.map(it => ({ name: it.name, quantity: it.quantity, regularPrice: it.regularPrice, memberPrice: it.memberPrice, taxStatus: it.taxStatus })));
      if (!ok) console.log('Failed to update inventory file');
      try {
        const fileName = printIntoTxt(receipt.generateReceipt(), receipt.transId, receipt.date);
        if (fileName) console.log(`Receipt saved as receipts/${fileName}`);
      } catch (e) { console.error('Failed to save receipt file', e && e.message); }
      continue;
    }

    // try interpret as index to add
    if (/^\d+$/.test(cmd)) {
      const idx = Number(cmd);
      const view = catalogView;
      if (idx < 0 || idx >= view.length) { console.log('Invalid index'); continue; }
      const qtyStr = (await prompt('Quantity: ')).trim();
      const qty = Math.max(1, Number(qtyStr) || 1);
      const prodName = view[idx].name;
      const masterItem = items.find(it => it.name === prodName);
      const unitPrice = custType === 'rewards' ? masterItem.memberPrice : masterItem.regularPrice;
      const added = cart.addItem(masterItem, qty, unitPrice, masterItem.regularPrice);
      if (added) {
        console.log(`Added ${qty} x ${masterItem.name} to cart`);
      } else {
        console.log('Failed to add to cart (insufficient stock)');
      }
      continue;
    }

    console.log('Unknown command. Type help for commands');
  }
}

if (require.main === module) {
  cli().catch(err => { console.error('CLI error', err); process.exit(1); });
}
