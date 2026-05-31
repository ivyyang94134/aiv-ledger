-- ============================================================
--  愛V記帳 — Supabase Schema（在 SQL Editor 貼上整段執行一次）
--  每位使用者只看得到自己的資料（Row Level Security）
-- ============================================================

-- ---------- 帳戶 ----------
create table if not exists accounts (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  currency    text not null default 'TWD',
  initial     numeric not null default 0,
  type        text not null default 'BANK',
  icon        text not null default 'wallet',
  color       text not null default '#1F6FEB',
  "createdAt" timestamptz not null default now()
);

-- ---------- 類別 ----------
create table if not exists categories (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  icon        text default 'tag',
  color       text default '#0E9AA7',
  type        text not null default 'EXPENSE',
  "parentId"  text,
  "sortOrder" int default 0
);

-- ---------- 專案 ----------
create table if not exists projects (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  budget      numeric default 0,
  "startDate" text,
  "endDate"   text,
  color       text default '#6C5CE7'
);

-- ---------- 標籤 ----------
create table if not exists tags (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name    text not null,
  color   text default '',
  primary key (user_id, name)
);

-- ---------- 交易 ----------
create table if not exists transactions (
  id             text primary key,
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type           text not null,
  amount         numeric not null default 0,
  currency       text default 'TWD',
  "exchangeRate" numeric default 1,
  date           timestamptz not null default now(),
  name           text,
  merchant       text,
  fee            numeric default 0,
  discount       numeric default 0,
  note           text,
  "imageUrl"     text,
  "dueDate"      timestamptz,
  "isSettled"    boolean default false,
  "settledDate"  timestamptz,
  "accountId"    text,
  "toAccountId"  text,
  "categoryId"   text,
  "projectId"    text,
  "recurringId"  text,
  "installmentId" text,
  "periodNo"     int,
  tags           jsonb default '[]'::jsonb,
  "createdAt"    timestamptz default now()
);
create index if not exists idx_txn_user_date on transactions (user_id, date desc);

-- ---------- 偏好（主題）每人一列 ----------
create table if not exists prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  accent  text default 'blue',
  surface text default 'warm',
  font    text default 'round'
);

-- ============================================================
--  Row Level Security：每人只能存取自己的資料
-- ============================================================
alter table accounts     enable row level security;
alter table categories   enable row level security;
alter table projects     enable row level security;
alter table tags         enable row level security;
alter table transactions enable row level security;
alter table prefs        enable row level security;

drop policy if exists p_accounts     on accounts;
drop policy if exists p_categories   on categories;
drop policy if exists p_projects     on projects;
drop policy if exists p_tags         on tags;
drop policy if exists p_transactions on transactions;
drop policy if exists p_prefs        on prefs;

create policy p_accounts     on accounts     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_categories   on categories   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_projects     on projects     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_tags         on tags         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_transactions on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_prefs        on prefs        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
