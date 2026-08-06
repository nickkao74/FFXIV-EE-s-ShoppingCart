import type { Env, Event, Order, OrderLine } from './types';

const MAX_EVENTS = 200;

function cleanString(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanLines(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];
  const out: OrderLine[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < value.length && out.length < 400; i += 1) {
    const item = value[i];
    if (!item || typeof item !== 'object') continue;
    const id = typeof item.id === 'string' ? item.id.trim().slice(0, 80) : '';
    const qty = Number(item.qty);
    if (!id || Number.isNaN(qty)) continue;
    const qtyInt = Math.max(1, Math.min(999, Math.floor(qty)));
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, qty: qtyInt });
  }
  return out;
}

function cleanSelfSupply(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < value.length && out.length < 400; i += 1) {
    const item = value[i];
    if (typeof item !== 'string') continue;
    const name = item.trim().slice(0, 60);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function orderRowToPublic(row: D1OrderRow): Order {
  return {
    id: row.id,
    discord_user_id: row.discord_user_id,
    nickname: row.nickname,
    lines: parseJsonField<OrderLine[]>(row.lines_json, []),
    selfSupply: parseJsonField<string[]>(row.self_supply_json, []),
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at === null ? null : row.completed_at
  };
}

interface D1OrderRow {
  id: string;
  discord_user_id: string;
  nickname: string;
  lines_json: string;
  self_supply_json: string;
  note: string;
  status: string;
  created_at: number;
  completed_at: number | null;
}

interface D1EventRow {
  id: string;
  type: string;
  text: string;
  at: number;
  order_id: string | null;
  nickname: string | null;
}

export async function getState(env: Env): Promise<{ orders: Order[]; stock: Record<string, number>; events: Event[] }> {
  const [orders, stock, events] = await Promise.all([
    getOrders(env),
    getStock(env),
    getEvents(env)
  ]);
  return { orders, stock, events };
}

export async function getOrders(env: Env): Promise<Order[]> {
  const result = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all<D1OrderRow>();
  return (result.results ?? []).map(orderRowToPublic);
}

export async function getOrderById(env: Env, id: string): Promise<Order | null> {
  const result = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<D1OrderRow>();
  return result ? orderRowToPublic(result) : null;
}

export async function createOrder(env: Env, args: {
  id: string;
  discord_user_id: string;
  nickname: string;
  lines: unknown;
  selfSupply: unknown;
  note: unknown;
  status: string;
  createdAt: number;
}): Promise<Order> {
  const lines = cleanLines(args.lines);
  const selfSupply = cleanSelfSupply(args.selfSupply);
  const note = cleanString(args.note, 300);
  await env.DB.prepare(
    'INSERT INTO orders (id, discord_user_id, nickname, lines_json, self_supply_json, note, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)'
  )
    .bind(
      args.id,
      args.discord_user_id,
      args.nickname,
      JSON.stringify(lines),
      JSON.stringify(selfSupply),
      note,
      args.status,
      args.createdAt
    )
    .run();
  return {
    id: args.id,
    discord_user_id: args.discord_user_id,
    nickname: args.nickname,
    lines,
    selfSupply,
    note,
    status: args.status,
    createdAt: args.createdAt,
    completedAt: null
  };
}

export async function deleteOrder(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
}

export async function updateOrderStatus(env: Env, id: string, status: string): Promise<Order | null> {
  const completedAt = status === 'done' ? Date.now() : null;
  await env.DB.prepare('UPDATE orders SET status = ?, completed_at = ? WHERE id = ?').bind(status, completedAt, id).run();
  return getOrderById(env, id);
}

export async function getStock(env: Env): Promise<Record<string, number>> {
  const result = await env.DB.prepare('SELECT name, qty FROM stock').all<{ name: string; qty: number }>();
  const rows = result.results ?? [];
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.name] = row.qty;
    return acc;
  }, {});
}

export async function patchStock(env: Env, patch: Record<string, unknown>): Promise<Record<string, number>> {
  const cleaned: Record<string, number> = {};
  Object.keys(patch).slice(0, 400).forEach((k) => {
    const name = typeof k === 'string' ? k.trim().slice(0, 60) : '';
    if (!name) return;
    const qty = Math.floor(Number(patch[k]) || 0);
    if (qty > 0) cleaned[name] = Math.min(qty, 999999);
  });
  const existing = await getStock(env);
  const updates = { ...existing, ...cleaned };
  const toRemove = Object.keys(patch).filter((k) => {
    const name = typeof k === 'string' ? k.trim().slice(0, 60) : '';
    return name && Math.floor(Number(patch[k]) || 0) <= 0;
  });
  const tx = env.DB.batch();
  Object.keys(updates).forEach((name) => {
    const qty = updates[name];
    if (qty <= 0) return;
    tx.prepare('INSERT INTO stock (name, qty) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET qty = excluded.qty').bind(name, qty).run();
  });
  toRemove.forEach((name) => {
    const key = typeof name === 'string' ? name.trim().slice(0, 60) : '';
    if (key) tx.prepare('DELETE FROM stock WHERE name = ?').bind(key).run();
  });
  await tx.flush();
  return getStock(env);
}

export async function putStock(env: Env, stock: Record<string, unknown>): Promise<Record<string, number>> {
  const mapped: Record<string, number> = {};
  Object.keys(stock).slice(0, 400).forEach((k) => {
    const name = typeof k === 'string' ? k.trim().slice(0, 60) : '';
    if (!name) return;
    const qty = Math.floor(Number(stock[k]) || 0);
    if (qty > 0) mapped[name] = Math.min(qty, 999999);
  });
  const existing = await getStock(env);
  const deletion = Object.keys(existing).filter((name) => mapped[name] === undefined);
  const tx = env.DB.batch();
  Object.keys(mapped).forEach((name) => {
    tx.prepare('INSERT INTO stock (name, qty) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET qty = excluded.qty').bind(name, mapped[name]).run();
  });
  deletion.forEach((name) => {
    tx.prepare('DELETE FROM stock WHERE name = ?').bind(name).run();
  });
  await tx.flush();
  return getStock(env);
}

export async function getEvents(env: Env): Promise<Event[]> {
  const result = await env.DB.prepare('SELECT * FROM events ORDER BY at DESC LIMIT ?').bind(MAX_EVENTS).all<D1EventRow>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    text: row.text,
    at: row.at,
    orderId: row.order_id,
    nickname: row.nickname
  }));
}

export async function createEvent(env: Env, event: {
  id: string;
  type: string;
  text: string;
  at: number;
  orderId: string | null;
  nickname: string | null;
}): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO events (id, type, text, at, order_id, nickname) VALUES (?, ?, ?, ?, ?, ?)' 
  )
    .bind(event.id, event.type, event.text, event.at, event.orderId, event.nickname)
    .run();
  await trimEvents(env);
}

async function trimEvents(env: Env): Promise<void> {
  const countResult = await env.DB.prepare('SELECT COUNT(*) AS count FROM events').all<{ count: number }>();
  const count = Number(countResult.results?.[0]?.count ?? 0);
  if (count <= MAX_EVENTS) return;
  const excess = count - MAX_EVENTS;
  const oldRows = await env.DB.prepare('SELECT id FROM events ORDER BY at ASC LIMIT ?').bind(excess).all<{ id: string }>();
  const ids = (oldRows.results ?? []).map((row) => row.id);
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(`DELETE FROM events WHERE id IN (${placeholders})`).bind(...ids).run();
}
