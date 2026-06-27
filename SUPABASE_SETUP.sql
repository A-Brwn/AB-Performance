-- AB Performance — Supabase schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New Query)
-- Click "Run" after pasting — this only needs to be done ONCE.

-- Enable required extension
create extension if not exists "uuid-ossp";

-- Table: client_profiles
-- Stores onboarding/intake data per user
create table if not exists client_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  age int,
  height_cm numeric,
  weight_kg numeric,
  sex text,
  activity_level numeric,
  goal_adjustment int,
  programme text,
  split text,
  one_rm numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: logged_weights
-- Stores every weight/RPE entry a client logs, keyed by exercise + session
create table if not exists logged_weights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  programme text not null,
  session_key text not null,
  exercise_key text not null,
  weight numeric,
  rpe numeric,
  notes text,
  logged_at timestamp with time zone default now(),
  unique(user_id, programme, session_key, exercise_key)
);

-- Table: session_notes
-- Free text notes per session
create table if not exists session_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  programme text not null,
  session_key text not null,
  notes text,
  updated_at timestamp with time zone default now(),
  unique(user_id, programme, session_key)
);

-- Row Level Security — users can only see/edit their own data
alter table client_profiles enable row level security;
alter table logged_weights enable row level security;
alter table session_notes enable row level security;

create policy "Users can view own profile" on client_profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on client_profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on client_profiles
  for insert with check (auth.uid() = id);

create policy "Users can view own logged weights" on logged_weights
  for select using (auth.uid() = user_id);
create policy "Users can insert own logged weights" on logged_weights
  for insert with check (auth.uid() = user_id);
create policy "Users can update own logged weights" on logged_weights
  for update using (auth.uid() = user_id);

create policy "Users can view own session notes" on session_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert own session notes" on session_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own session notes" on session_notes
  for update using (auth.uid() = user_id);
