const http = require('http');
const path = require('path');
const { parseProductFile, updateTxtFile, printIntoTxt } = require('./utils/IOParser');
const Receipt = require('./models/Receipt');

const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.txt');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/catalog') {
    const products = parseProductFile(inventoryPath).map(p => ({
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
        const cart = data.cart || [];
        const commit = Boolean(data.commit);
        const products = parseProductFile(inventoryPath).map(p => ({
          name: p.item,
          quantity: p.quantity,
          regularPrice: p.regularPrice,
          memberPrice: p.memberPrice,
          taxStatus: p.taxStatus
        }));

        for (const ci of cart) {
          const prod = products.find(p => p.name === ci.name);
          if (!prod) {
            res.writeHead(400, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: `Product ${ci.name} not found` }));
            return;
          }
          if (prod.quantity < ci.quantity) {
            res.writeHead(400, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: `Insufficient stock for ${ci.name}` }));
            return;
          }
        }

        const subtotal = cart.reduce((s,ci)=>{
          const prod = products.find(p=>p.name===ci.name);
          const price = data.customerType==='rewards' ? prod.memberPrice : prod.regularPrice;
          return s + price * ci.quantity;
        },0);
        const TAX = cart.reduce((s,ci)=>{
          const prod = products.find(p=>p.name===ci.name);
          const price = data.customerType==='rewards' ? prod.memberPrice : prod.regularPrice;
          const taxable = (typeof prod.taxStatus==='string') ? prod.taxStatus.toLowerCase().includes('taxable') : Boolean(prod.taxStatus);
          return s + (taxable ? price * ci.quantity * 0.065 : 0);
        },0);
        const total = subtotal + TAX;

        if (commit) {
          const lineItems = cart.map(ci => {
            const prod = products.find(p => p.name === ci.name);
            const price = data.customerType === 'rewards' ? prod.memberPrice : prod.regularPrice;
            return {
              item: { name: prod.name, regularPrice: prod.regularPrice, memberPrice: prod.memberPrice, taxStatus: prod.taxStatus },
              quantity: ci.quantity,
              unitPrice: price,
              regularPrice: prod.regularPrice
            };
          });

          if (typeof data.cash !== 'undefined') {
            const receipt = new Receipt(lineItems, data.cash);
            const totalFromReceipt = receipt.calculateTotal();
            if (Number(data.cash) < totalFromReceipt) {
              res.writeHead(400, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ error: 'Insufficient cash for total' }));
              return;
            }

            for (const ci of cart) {
              const prod = products.find(p => p.name === ci.name);
              prod.quantity = Math.max(0, prod.quantity - ci.quantity);
            }
            const ok = updateTxtFile(inventoryPath, products);
            if (!ok) {
              res.writeHead(500, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ error: 'Failed to update inventory' }));
              return;
            }

            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ receipt: receipt.generateReceipt(), transId: receipt.transId, date: receipt.date.toISOString(), subtotal, tax: TAX, total: totalFromReceipt, committed: true }));
            return;
          }

          for (const ci of cart) {
            const prod = products.find(p => p.name === ci.name);
            prod.quantity = Math.max(0, prod.quantity - ci.quantity);
          }
          const ok = updateTxtFile(inventoryPath, products);
          if (!ok) {
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: 'Failed to update inventory' }));
            return;
          }
        }

        // default response: totals only (no commit or preview)
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
