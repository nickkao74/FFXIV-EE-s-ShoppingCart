import type { Env, Order, SessionPayload } from './types';
import { parseCookies, makeOAuthStateCookie, makeExpiredOAuthStateCookie, makeSessionCookie, makeExpiredSessionCookie, signSessionToken, verifySessionToken, createOAuthState, getSessionRole } from './auth';
import { createOrder, createEvent, deleteOrder, getEvents, getOrderById, getOrders, getState, getStock, patchStock, putStock, updateOrderStatus } from './db';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function jsonResponse(body: unknown, status = 200, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) },
    ...init
  });
}

function textResponse(text: string, status = 200) {
  return new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  return url.origin;
}

function requireSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  return origin === getOrigin(request);
}

function parseJson(request: Request): Promise<unknown> {
  return request.text().then((text) => {
    if (!text) return {}; 
    try { return JSON.parse(text); } catch { throw new Error('invalid json'); }
  });
}

function authError(message: string) {
  return jsonResponse({ ok: false, error: message }, 401);
}

function forbiddenError(message: string) {
  return jsonResponse({ ok: false, error: message }, 403);
}

function notFoundError(message: string) {
  return jsonResponse({ ok: false, error: message }, 404);
}

function badRequestError(message: string) {
  return jsonResponse({ ok: false, error: message }, 400);
}

function serverError(message: string) {
  return jsonResponse({ ok: false, error: message }, 500);
}

function isNonGetApi(request: Request): boolean {
  return request.method !== 'GET' && request.method !== 'HEAD';
}

async function getSession(request: Request, env: Env): Promise<SessionPayload | null> {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['__Host-ffxiv_session'];
  if (!token) return null;
  if (!env.SESSION_SECRET) return null;
  return verifySessionToken(token, env.SESSION_SECRET);
}

function buildError(message: string, status = 500) {
  return jsonResponse({ ok: false, error: message }, status);
}

async function fetchDiscordJson(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error('discord api error');
  return res.json();
}

function userDisplayName(me: any, member: any): string {
  if (member && typeof member.nick === 'string' && member.nick.trim()) return member.nick.trim();
  if (typeof me.global_name === 'string' && me.global_name.trim()) return me.global_name.trim();
  if (typeof me.username === 'string') return me.username;
  return 'Discord 用戶';
}

function orderPublic(order: Order) {
  return order;
}

function buildSessionPayload(userId: string, displayName: string, avatar: string | null, role: 'member' | 'admin'): SessionPayload {
  return {
    userId,
    displayName,
    avatar,
    role,
    expiresAt: Date.now() + 86400_000
  };
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) {
        return handleApi(request, url, env);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return serverError('伺服器發生錯誤，請稍後再試');
    }
  }
};

async function handleApi(request: Request, url: URL, env: Env): Promise<Response> {
  if (isNonGetApi(request) && !requireSameOrigin(request)) {
    return forbiddenError('無效的來源');
  }

  const path = url.pathname;
  if (path === '/api/auth/discord' && request.method === 'GET') {
    const state = await createOAuthState();
    const origin = getOrigin(request);
    const redirectUri = `${origin}/api/auth/discord/callback`;
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.members.read',
      state
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
        'Set-Cookie': makeOAuthStateCookie(state)
      }
    });
  }

  if (path === '/api/auth/discord/callback' && request.method === 'GET') {
    const origin = getOrigin(request);
    const redirectUri = `${origin}/api/auth/discord/callback`;
    const params = url.searchParams;
    const code = params.get('code');
    const state = params.get('state');
    const cookies = parseCookies(request.headers.get('Cookie'));
    const cookieState = cookies['__Host-ffxiv_oauth_state'];

    if (!code || !state || !cookieState || state !== cookieState) {
      return badRequestError('Discord 登入失敗：未通過安全驗證');
    }

    if (!env.DISCORD_CLIENT_SECRET) {
      return serverError('伺服器尚未設定 Discord secrets');
    }

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        scope: 'identify guilds.members.read'
      })
    });

    if (!tokenRes.ok) {
      return badRequestError('Discord 登入失敗，請稍後再試');
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return badRequestError('Discord 登入失敗，未取得存取權杖');
    }

    const me = await fetchDiscordJson('https://discord.com/api/users/@me', accessToken);
    if (!me || typeof me.id !== 'string') {
      return badRequestError('Discord 帳號資料取得失敗');
    }

    const member = await fetchDiscordJson(`https://discord.com/api/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`, accessToken);
    if (!member || member.pending === true) {
      return forbiddenError('您尚未通過 Discord 伺服器的成員審核，無法登入');
    }

    const role = getSessionRole(me.id, Array.isArray(member.roles) ? member.roles : [], env.DISCORD_ADMIN_ROLE_ID, env.DISCORD_ADMIN_USER_ID);
    const avatar = me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png` : null;
    const payload = buildSessionPayload(me.id, userDisplayName(me, member), avatar, role);
    const token = await signSessionToken(payload, env.SESSION_SECRET);

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/index.html',
        'Set-Cookie': `${makeSessionCookie(token)}; ${makeExpiredOAuthStateCookie()}`
      }
    });
  }

  if (path === '/api/session' && request.method === 'GET') {
    const session = await getSession(request, env);
    if (!session) return authError('未登入');
    return jsonResponse({ ok: true, session });
  }

  if (path === '/api/logout' && request.method === 'POST') {
    return jsonResponse({ ok: true }, 200, { headers: { 'Set-Cookie': makeExpiredSessionCookie() } });
  }

  const session = await getSession(request, env);
  if (!session) return authError('請先登入');

  if (path === '/api/events' && request.method === 'GET') {
    const events = await getEvents(env);
    return jsonResponse({ ok: true, events });
  }

  if (path === '/api/orders' && request.method === 'POST') {
    const body = await parseJson(request);
    const lines = (body as any).lines;
    const selfSupply = (body as any).selfSupply;
    const note = (body as any).note;
    if (!Array.isArray(lines) || !lines.length) return badRequestError('購物車是空的');
    const order = await createOrder(env, {
      id: crypto.randomUUID(),
      discord_user_id: session.userId,
      nickname: session.displayName,
      lines,
      selfSupply,
      note,
      status: 'pending',
      createdAt: Date.now()
    });
    await createEvent(env, {
      id: crypto.randomUUID(),
      type: 'order',
      text: `${session.displayName} 送出了一張訂單（${order.lines.reduce((sum, l) => sum + l.qty, 0)} 項）`,
      at: Date.now(),
      orderId: order.id,
      nickname: session.displayName
    });
    return jsonResponse({ ok: true, order: orderPublic(order) });
  }

  if (path === '/api/orders' && request.method === 'GET') {
    if (!session) return authError('請先登入');
    if (session.role !== 'admin') return forbiddenError('沒有管理權限');
    const orders = await getOrders(env);
    return jsonResponse({ ok: true, orders });
  }

  const orderMatch = path.match(/^\/api\/orders\/([^/]+)(?:\/(complete|reopen))?$/);
  if (orderMatch) {
    const id = orderMatch[1];
    const action = orderMatch[2];
    if (session.role !== 'admin') return forbiddenError('沒有管理權限');
    const order = await getOrderById(env, id);
    if (!order) return notFoundError('找不到這張訂單');
    if (!action && request.method === 'DELETE') {
      await deleteOrder(env, id);
      await createEvent(env, {
        id: crypto.randomUUID(),
        type: 'delete',
        text: `${order.nickname} 的訂單被刪除`,
        at: Date.now(),
        orderId: id,
        nickname: order.nickname
      });
      return jsonResponse({ ok: true });
    }
    if (action === 'complete' && request.method === 'POST') {
      const updated = await updateOrderStatus(env, id, 'done');
      if (!updated) return notFoundError('找不到這張訂單');
      await createEvent(env, {
        id: crypto.randomUUID(),
        type: 'done',
        text: `${order.nickname} 的訂單已完成`,
        at: Date.now(),
        orderId: id,
        nickname: order.nickname
      });
      return jsonResponse({ ok: true, order: orderPublic(updated) });
    }
    if (action === 'reopen' && request.method === 'POST') {
      const updated = await updateOrderStatus(env, id, 'pending');
      if (!updated) return notFoundError('找不到這張訂單');
      await createEvent(env, {
        id: crypto.randomUUID(),
        type: 'reopen',
        text: `${order.nickname} 的訂單重新開啟`,
        at: Date.now(),
        orderId: id,
        nickname: order.nickname
      });
      return jsonResponse({ ok: true, order: orderPublic(updated) });
    }
  }

  if (path === '/api/stock' && request.method === 'GET') {
    if (session.role !== 'admin') return forbiddenError('沒有管理權限');
    const stock = await getStock(env);
    return jsonResponse({ ok: true, stock });
  }

  if ((path === '/api/stock' && request.method === 'PATCH') || (path === '/api/stock' && request.method === 'PUT')) {
    if (session.role !== 'admin') return forbiddenError('沒有管理權限');
    const body = await parseJson(request);
    const stock = request.method === 'PATCH' ? await patchStock(env, (body as any).stock || {}) : await putStock(env, (body as any).stock || {});
    return jsonResponse({ ok: true, stock });
  }

  if (path === '/api/state' && request.method === 'GET') {
    if (session.role !== 'admin') return forbiddenError('沒有管理權限');
    const state = await getState(env);
    return jsonResponse({ ok: true, ...state });
  }

  return notFoundError('unknown api');
}
