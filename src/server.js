const http = require('http');
const path = require('path');
const { parseProductFile, updateTxtFile, printIntoTxt } = require('./utils/IOParser');
const Receipt = require('./models/Receipt');
const Item = require('./models/Item');
const Cart = require('./models/Cart');

const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.txt');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/catalog') {
    const raw = parseProductFile(inventoryPath);
    const products = raw.map(p => ({
      name: p.item,
      quantity: p.quantity,
      regularPrice: p.regularPrice,
      memberPrice: p.memberPrice,
      taxStatus: p.taxStatus
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/checkout') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const cartRequest = data.cart || [];
        const commit = Boolean(data.commit);
        const products = parseProductFile(inventoryPath).map(p => new Item(p.item, p.quantity, p.regularPrice, p.memberPrice, p.taxStatus));
        const cartModel = new Cart();
        for (const ci of cartRequest) {
          const prod = products.find(p => p.name === ci.name);
          if (!prod) {
            res.writeHead(400, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: `Product ${ci.name} not found` }));
            return;
          }
          const price = data.customerType === 'rewards' ? prod.memberPrice : prod.regularPrice;
          const added = cartModel.addItem(prod, ci.quantity, price, prod.regularPrice);
          if (!added) {
            res.writeHead(400, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: `Insufficient stock for ${ci.name}` }));
            return;
          }
        }
        const previewReceipt = cartModel.goToCheckout(); 
        const subtotal = previewReceipt.calculateSubtotal();
        const TAX = previewReceipt.calculateTax();
        const total = previewReceipt.calculateTotal();

        if (commit) {
          if (typeof data.cash !== 'undefined') {
            const finalReceipt = cartModel.goToCheckout(data.cash);
            if (!finalReceipt) {
              res.writeHead(400, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ error: 'Insufficient cash for total' }));
              return;
            }

            for (const li of finalReceipt.lineItems) {
              const prod = products.find(p => p.name === li.name);
              if (prod) prod.quantity = Math.max(0, prod.quantity - li.quantity);
            }
            const ok = updateTxtFile(inventoryPath, products);
            if (!ok) {
              res.writeHead(500, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ error: 'Failed to update inventory' }));
              return;
            }

            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ receipt: finalReceipt.generateReceipt(), transId: finalReceipt.transId, date: finalReceipt.date.toISOString(), subtotal, tax: TAX, total: finalReceipt.calculateTotal(), committed: true }));
            return;
          }

          // commit requested without cash (non-cash flow) — persist inventory based on cartModel.items
          for (const li of cartModel.items) {
            const prod = products.find(p => p.name === li.item.name);
            if (prod) prod.quantity = Math.max(0, prod.quantity - li.quantity);
          }
          const ok = updateTxtFile(inventoryPath, products);
          if (!ok) {
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: 'Failed to update inventory' }));
            return;
          }
        }

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ subtotal, tax: TAX, total, committed: commit }));
      } catch (err) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'invalid body' }));
      }
    });
    return;
  }

  // Print/save receipt to file
  if (req.method === 'POST' && req.url === '/api/printReceipt') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const receiptText = data.receipt || '';
        const transId = data.transId || (String(Math.floor(Math.random() * 1000000)).padStart(6, '0'));
        const date = data.date ? new Date(data.date) : new Date();
        const fileName = printIntoTxt(receiptText, transId, date);
        if (!fileName) {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: 'failed to save receipt' }));
          return;
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ fileName }));
      } catch (err) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: 'invalid body' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/')) {
    const urlPath = req.url === '/' ? '/view/index.html' : `/view${req.url}`;
    const filePath = path.join(__dirname, '..', urlPath);
    require('fs').readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running at http://localhost:${port}`));