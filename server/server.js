/* EE的FFXIV購物車 —— 後端伺服器
 *
 * 零相依（只用 Node 內建模組），資料存成 server/db.json。
 * 啟動：node server/server.js        （預設 http://0.0.0.0:8787）
 * 環境變數：PORT / HOST / FFXIV_PASSWORD
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(__dirname, 'db.json');
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';
const PASSWORD = process.env.FFXIV_PASSWORD || '654321';

/* ------------------------------------------------------------------ *
 * 資料庫（單一 JSON 檔，寫入時整份覆寫；此工具的併發量極低，足夠了）
 * ------------------------------------------------------------------ */
const EMPTY_DB = { secret: '', orders: [], stock: {}, events: [], seq: 0 };

function loadDb() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return Object.assign({}, EMPTY_DB, db);
  } catch (e) {
    return Object.assign({}, EMPTY_DB);
  }
}

let db = loadDb();
let saveTimer = null;
function saveDb() {
  // 節流：短時間內的多次寫入合併成一次落地
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = DB_FILE + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('[db] 寫入失敗：', e.message);
    }
  }, 50);
}

if (!db.secret) {
  db.secret = crypto.randomBytes(24).toString('hex');
  saveDb();
}

function nextId(prefix) {
  db.seq += 1;
  return prefix + '_' + Date.now().toString(36) + '_' + db.seq;
}

/** 入口頁的動態紀錄；只保留最近 200 筆 */
function logEvent(type, text, extra) {
  db.events.unshift(Object.assign({
    id: nextId('ev'), type, text, at: Date.now()
  }, extra || {}));
  if (db.events.length > 200) db.events.length = 200;
}

/* ------------------------------------------------------------------ *
 * 驗證
 * ------------------------------------------------------------------ */
function expectedToken() {
  return crypto.createHash('sha256').update(PASSWORD + '|' + db.secret).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function isAuthed(req) {
  const token = req.headers['x-auth'] || '';
  return token ? safeEqual(token, expectedToken()) : false;
}

/* ------------------------------------------------------------------ *
 * 輸入清洗
 * ------------------------------------------------------------------ */
function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max || 60) : '';
}

function cleanLines(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 400).map((l) => ({
    id: str(l && l.id, 80),
    qty: Math.max(1, Math.min(999, Math.floor(Number(l && l.qty) || 0)))
  })).filter((l) => l.id);
}

function cleanNames(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  v.slice(0, 400).forEach((n) => {
    const s = str(n, 60);
    if (s && out.indexOf(s) < 0) out.push(s);
  });
  return out;
}

function cleanStock(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.keys(v).slice(0, 400).forEach((k) => {
    const name = str(k, 60);
    const qty = Math.floor(Number(v[k]) || 0);
    if (name && qty > 0) out[name] = Math.min(qty, 999999);
  });
  return out;
}

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */
function json(res, code, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store'
  });
  res.end(buf);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 512 * 1024) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function publicOrder(o) {
  return {
    id: o.id, nickname: o.nickname, lines: o.lines, selfSupply: o.selfSupply,
    note: o.note, status: o.status, createdAt: o.createdAt, completedAt: o.completedAt
  };
}

async function handleApi(req, res, url) {
  const p = url.pathname;

  // 登入不需要 token
  if (p === '/api/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (safeEqual(str(body.password, 64), PASSWORD)) {
      return json(res, 200, { ok: true, token: expectedToken() });
    }
    return json(res, 401, { ok: false, error: '密碼錯誤' });
  }

  if (p === '/api/session' && req.method === 'GET') {
    return json(res, 200, { ok: isAuthed(req) });
  }

  if (!isAuthed(req)) return json(res, 401, { ok: false, error: '請先輸入密碼' });

  // 一次抓齊 EE 列表需要的所有資料
  if (p === '/api/state' && req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      orders: db.orders.map(publicOrder),
      stock: db.stock,
      events: db.events
    });
  }

  if (p === '/api/orders' && req.method === 'GET') {
    return json(res, 200, { ok: true, orders: db.orders.map(publicOrder) });
  }

  if (p === '/api/orders' && req.method === 'POST') {
    const body = await readBody(req);
    const nickname = str(body.nickname, 24);
    const lines = cleanLines(body.lines);
    if (!nickname) return json(res, 400, { ok: false, error: '請填寫暱稱' });
    if (!lines.length) return json(res, 400, { ok: false, error: '購物車是空的' });

    const order = {
      id: nextId('od'),
      nickname,
      lines,
      selfSupply: cleanNames(body.selfSupply),
      note: str(body.note, 300),
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null
    };
    db.orders.unshift(order);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    logEvent('order', nickname + ' 送出了一張訂單（' + count + ' 項）', { orderId: order.id, nickname });
    saveDb();
    return json(res, 200, { ok: true, order: publicOrder(order) });
  }

  const m = p.match(/^\/api\/orders\/([A-Za-z0-9_]+)(\/complete|\/reopen)?$/);
  if (m) {
    const order = db.orders.find((o) => o.id === m[1]);
    if (!order) return json(res, 404, { ok: false, error: '找不到這張訂單' });

    if (!m[2] && req.method === 'DELETE') {
      db.orders = db.orders.filter((o) => o.id !== order.id);
      logEvent('delete', order.nickname + ' 的訂單被刪除', { nickname: order.nickname });
      saveDb();
      return json(res, 200, { ok: true });
    }
    if (m[2] === '/complete' && req.method === 'POST') {
      order.status = 'done';
      order.completedAt = Date.now();
      logEvent('done', order.nickname + ' 的訂單已完成', { orderId: order.id, nickname: order.nickname });
      saveDb();
      return json(res, 200, { ok: true, order: publicOrder(order) });
    }
    if (m[2] === '/reopen' && req.method === 'POST') {
      order.status = 'pending';
      order.completedAt = null;
      logEvent('reopen', order.nickname + ' 的訂單重新開啟', { orderId: order.id, nickname: order.nickname });
      saveDb();
      return json(res, 200, { ok: true, order: publicOrder(order) });
    }
  }

  if (p === '/api/stock' && req.method === 'GET') {
    return json(res, 200, { ok: true, stock: db.stock });
  }

  // EE 手上已有的素材；部分更新（只傳有變動的項目，qty <= 0 代表移除）
  if (p === '/api/stock' && req.method === 'PATCH') {
    const body = await readBody(req);
    const patch = body.stock && typeof body.stock === 'object' ? body.stock : {};
    Object.keys(patch).slice(0, 400).forEach((k) => {
      const name = str(k, 60);
      if (!name) return;
      const qty = Math.floor(Number(patch[k]) || 0);
      if (qty > 0) db.stock[name] = Math.min(qty, 999999);
      else delete db.stock[name];
    });
    saveDb();
    return json(res, 200, { ok: true, stock: db.stock });
  }

  if (p === '/api/stock' && req.method === 'PUT') {
    const body = await readBody(req);
    db.stock = cleanStock(body.stock);
    saveDb();
    return json(res, 200, { ok: true, stock: db.stock });
  }

  if (p === '/api/events' && req.method === 'GET') {
    return json(res, 200, { ok: true, events: db.events });
  }

  return json(res, 404, { ok: false, error: 'unknown api' });
}

/* ------------------------------------------------------------------ *
 * 靜態檔案
 * ------------------------------------------------------------------ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';

  const full = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
  // 阻擋跳出網站根目錄，以及伺服器自身的資料檔
  if (!full.startsWith(ROOT) || full.startsWith(path.join(ROOT, 'server'))) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(full).pipe(res);
  });
}

/* ------------------------------------------------------------------ */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));

  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch((e) => {
      json(res, 400, { ok: false, error: e.message || 'bad request' });
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method Not Allowed');
    return;
  }
  serveStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
  console.log('EE的FFXIV購物車 已啟動');
  console.log('  本機：    http://localhost:' + PORT);
  console.log('  區域網路：http://<這台電腦的IP>:' + PORT);
  console.log('  資料檔：  ' + DB_FILE);
});
