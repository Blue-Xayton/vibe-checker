-- Create profiles table for user data and gamification stats
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  texts_processed integer default 0 not null,
  batches_completed integer default 0 not null,
  average_confidence numeric default 0 not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create sentiment_results table
create table public.sentiment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  label text not null,
  confidence numeric not null,
  explanation text not null,
  keywords jsonb not null,
  scores jsonb not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on sentiment_results
alter table public.sentiment_results enable row level security;

-- Sentiment results policies
create policy "Users can view own results"
  on public.sentiment_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own results"
  on public.sentiment_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own results"
  on public.sentiment_results for delete
  using (auth.uid() = user_id);

-- Create function to update profile updated_at
create or replace function public.update_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profile updates
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_profile_updated_at();

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();