export type SessionRole = 'member' | 'admin';

export type SessionPayload = {
  userId: string;
  displayName: string;
  avatar: string | null;
  role: SessionRole;
  expiresAt: number;
};

export type OrderLine = {
  id: string;
  qty: number;
};

export type Order = {
  id: string;
  discord_user_id: string;
  nickname: string;
  lines: OrderLine[];
  selfSupply: string[];
  note: string;
  status: string;
  createdAt: number;
  completedAt: number | null;
};

export type Event = {
  id: string;
  type: string;
  text: string;
  at: number;
  orderId: string | null;
  nickname: string | null;
};

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DISCORD_CLIENT_ID: string;
  DISCORD_GUILD_ID: string;
  DISCORD_ADMIN_ROLE_ID: string;
  DISCORD_ADMIN_USER_ID: string;
  DISCORD_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  /** 只在本機 .dev.vars 設為 '1'，用來啟用 /api/auth/dev 假登入。正式環境永遠不存在。 */
  DEV_LOGIN?: string;
}
