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

export type EquipmentHistoryOrder = {
  status: 'pending' | 'done';
  lines: OrderLine[];
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
  DISCORD_ADMIN_USER_IDS: string[];
  DISCORD_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}
