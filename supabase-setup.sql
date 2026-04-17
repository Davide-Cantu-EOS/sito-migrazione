-- Eseguire questo script nel SQL Editor di Supabase

-- Tabella migrazioni
create table migrations (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dependencies jsonb not null default '{}'
);

-- Tabella app da installare
create table install_apps (
  id text primary key,
  migration_id text not null references migrations(id) on delete cascade,
  name text not null,
  installed boolean not null default false,
  updated_by jsonb,
  updated_at timestamptz
);

-- Tabella app da compilare
create table compile_apps (
  id text primary key,
  migration_id text not null references migrations(id) on delete cascade,
  name text not null,
  level integer not null,
  status text not null default 'not_started',
  updated_by jsonb,
  updated_at timestamptz
);

-- Indici
create index idx_install_apps_migration on install_apps(migration_id);
create index idx_compile_apps_migration on compile_apps(migration_id);

-- RLS (Row Level Security)
alter table migrations enable row level security;
alter table install_apps enable row level security;
alter table compile_apps enable row level security;

-- Policy: utenti autenticati possono leggere e scrivere tutto
create policy "Authenticated read" on migrations for select to authenticated using (true);
create policy "Authenticated write" on migrations for all to authenticated using (true) with check (true);

create policy "Authenticated read" on install_apps for select to authenticated using (true);
create policy "Authenticated write" on install_apps for all to authenticated using (true) with check (true);

create policy "Authenticated read" on compile_apps for select to authenticated using (true);
create policy "Authenticated write" on compile_apps for all to authenticated using (true) with check (true);

-- Abilitare Realtime sulle tabelle
alter publication supabase_realtime add table migrations;
alter publication supabase_realtime add table install_apps;
alter publication supabase_realtime add table compile_apps;
