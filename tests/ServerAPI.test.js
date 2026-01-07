const { spawn } = require('child_process');
const http = require('http');

async function waitForServer(proc, timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await httpGet('/api/catalog');
      if (res && res.status === 200) return;
    } catch (e) {
    }
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('timeout waiting for server');
}

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 3000, path, agent: false }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

function httpPost(path, obj) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(obj);
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('Server API', () => {
  let proc;
  beforeAll(async () => {
  proc = spawn(process.execPath, ['src/server.js'], { stdio: ['ignore', 'ignore', 'ignore'] });
  await waitForServer(proc, 4000);
  }, 10000);

  afterAll(async () => {
    if (proc && !proc.killed) {
      proc.kill();
      await new Promise(resolve => {
        const to = setTimeout(() => {
          try { proc.kill('SIGKILL'); } catch (e) {}
          resolve();
        }, 2000);
        proc.on('exit', () => { clearTimeout(to); resolve(); });
      });
    }
  });

  test('GET / returns index and /api/catalog returns products', async () => {
    const r = await httpGet('/');
    expect(r.status).toBe(200);
    expect(r.body).toContain("Jerry's Quick Mart");

    const cat = await httpGet('/api/catalog');
    expect(cat.status).toBe(200);
    const products = JSON.parse(cat.body);
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty('name');
  });

  test('POST /api/checkout preview and commit with cash', async () => {
    const catResp = await httpGet('/api/catalog');
    const products = JSON.parse(catResp.body);
    const p = products.find(x => Number(x.quantity) > 0);
    expect(p).toBeDefined();

    const cart = [{ name: p.name, quantity: 1 }];
    const preview = await httpPost('/api/checkout', { cart, customerType: 'regular', commit: false });
    expect(preview.status).toBe(200);
    const previewJson = JSON.parse(preview.body);
    expect(previewJson).toHaveProperty('subtotal');

    const commitResp = await httpPost('/api/checkout', { cart, customerType: 'regular', commit: true, cash: 1000 });
    expect(commitResp.status).toBe(200);
    const commitJson = JSON.parse(commitResp.body);
    expect(commitJson).toHaveProperty('receipt');
    expect(commitJson).toHaveProperty('committed');
    expect(commitJson.committed).toBe(true);
  });

  test('POST /api/printReceipt saves and returns filename', async () => {
    const body = { receipt: 'TEST RECEIPT', transId: '000001', date: new Date().toISOString() };
    const resp = await httpPost('/api/printReceipt', body);
    expect(resp.status).toBe(200);
    const j = JSON.parse(resp.body);
    expect(j).toHaveProperty('fileName');
    expect(typeof j.fileName).toBe('string');
  });
});
