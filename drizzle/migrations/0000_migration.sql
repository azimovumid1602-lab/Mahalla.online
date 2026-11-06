
create type public.app_role as enum ('admin','user');
create type public.problem_status as enum ('yuborildi','korib_chiqilmoqda','jarayonda','hal_qilindi');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  street text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('pensiya','yigilish','kommunal','tadbir','muhim')),
  event_at timestamptz,
  pinned boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "ann read" on public.announcements for select using (true);
create policy "ann admin insert" on public.announcements for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "ann admin update" on public.announcements for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "ann admin delete" on public.announcements for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  author_name text not null default '',
  title text not null,
  category text not null check (category in ('yol','suv','elektr','gaz','chiqindi','yoritish','boshqa')),
  description text not null,
  address text not null default '',
  photo_url text,
  status problem_status not null default 'yuborildi',
  upvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.problems to anon;
grant select, insert, update, delete on public.problems to authenticated;
grant all on public.problems to service_role;
alter table public.problems enable row level security;
create policy "prob read" on public.problems for select using (true);
create policy "prob insert own" on public.problems for insert to authenticated with check (auth.uid() = user_id and status = 'yuborildi' and upvotes = 0);
create policy "prob admin update" on public.problems for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "prob delete" on public.problems for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.problem_upvotes (
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (problem_id, user_id)
);
grant select on public.problem_upvotes to anon;
grant select, insert, delete on public.problem_upvotes to authenticated;
grant all on public.problem_upvotes to service_role;
alter table public.problem_upvotes enable row level security;
create policy "up read" on public.problem_upvotes for select using (true);
create policy "up insert" on public.problem_upvotes for insert to authenticated with check (auth.uid() = user_id);
create policy "up delete" on public.problem_upvotes for delete to authenticated using (auth.uid() = user_id);

create or replace function public.sync_upvotes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.problems set upvotes = (select count(*) from public.problem_upvotes where problem_id = coalesce(new.problem_id, old.problem_id))
  where id = coalesce(new.problem_id, old.problem_id);
  return null;
end; $$;
create trigger upvotes_sync after insert or delete on public.problem_upvotes for each row execute function public.sync_upvotes();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);
grant select on public.comments to anon;
grant select, insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "com read" on public.comments for select using (true);
create policy "com insert" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "com delete" on public.comments for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0
);
create table public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
grant select on public.polls, public.poll_options, public.poll_votes to anon;
grant select, insert, update, delete on public.polls, public.poll_options to authenticated;
grant select, insert on public.poll_votes to authenticated;
grant all on public.polls, public.poll_options, public.poll_votes to service_role;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
create policy "poll read" on public.polls for select using (true);
create policy "poll admin all" on public.polls for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "opt read" on public.poll_options for select using (true);
create policy "opt admin all" on public.poll_options for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "vote read" on public.poll_votes for select using (true);
create policy "vote insert" on public.poll_votes for insert to authenticated with check (auth.uid() = user_id);

insert into public.announcements (title, body, category, event_at, pinned) values
('Pensiya to''lovlari 5-noyabrdan boshlanadi', 'Noyabr oyi pensiyalari 5-noyabrdan boshlab mahalla idorasi yonidagi bank shoxobchasida beriladi. Pasportingizni unutmang.', 'pensiya', now() + interval '3 days', true),
('Ertaga 10:00–16:00 suv o''chiriladi', 'Navoiy va Bog''bon ko''chalarida quvur ta''mirlash sababli ichimlik suvi vaqtincha o''chiriladi. Oldindan suv zaxiralab qo''ying.', 'kommunal', now() + interval '1 day', true),
('Mahalla umumiy yig''ilishi', 'Ko''chalarni obodonlashtirish va qishki tayyorgarlik masalalari muhokama qilinadi. Barcha xonadon vakillari taklif etiladi.', 'yigilish', now() + interval '6 days', false),
('Navro''z hashari va bayram tadbiri', 'Mahalla bog''ida daraxt ekish hashari, so''ng palov va bolalar uchun o''yinlar tashkil etiladi.', 'tadbir', now() + interval '12 days', false),
('Gaz hisoblagichlarini tekshirish', 'Hududgaz xodimlari uyma-uy yurib hisoblagichlarni tekshiradi. Iltimos, xodimlarga yordam bering.', 'muhim', now() + interval '2 days', false);

insert into public.problems (author_name, title, category, description, address, status, upvotes, created_at) values
('Dilnoza A.', 'Ko''chada katta chuqur paydo bo''ldi', 'yol', 'Yomg''irdan keyin yo''l o''rtasida chuqur ochildi, mashinalar va bolalar uchun xavfli.', 'Navoiy ko''chasi, 14-uy yonida', 'jarayonda', 12, now() - interval '5 days'),
('Akmal R.', 'Ko''cha chiroqlari yonmayapti', 'yoritish', 'Kechqurun ko''cha butunlay qorong''i, keksalar chiqishga qo''rqishadi.', 'Bog''bon ko''chasi', 'korib_chiqilmoqda', 18, now() - interval '3 days'),
('Malika T.', 'Chiqindi uch kundan beri olib ketilmagan', 'chiqindi', 'Konteynerlar to''lib ketgan, hid tarqalyapti.', 'Mustaqillik ko''chasi, 3-konteyner maydoni', 'hal_qilindi', 9, now() - interval '10 days'),
('Shavkat M.', 'Suv bosimi juda past', 'suv', 'Ikkinchi qavatga suv chiqmayapti, ayniqsa ertalab.', 'Yangi hayot ko''chasi, 27-uy', 'yuborildi', 5, now() - interval '1 day'),
('Gulnora S.', 'Elektr tez-tez o''chib qolyapti', 'elektr', 'Kuniga 3-4 marta svet o''chadi, maishiy texnika buzilishidan qo''rqamiz.', 'Paxtakor ko''chasi', 'jarayonda', 21, now() - interval '7 days'),
('Bahodir Y.', 'Gaz quvurida hid sezilmoqda', 'gaz', 'Ko''cha boshidagi quvur yonida gaz hidi bor, tezda tekshirish kerak.', 'Do''stlik ko''chasi, 2-uy', 'hal_qilindi', 15, now() - interval '14 days');

with p as (insert into public.polls (question) values ('Ko''cha yoritilishi uchun pul yig''amizmi?') returning id)
insert into public.poll_options (poll_id, label, position)
select p.id, x.label, x.pos from p, (values ('Ha, qo''llab-quvvatlayman',0),('Yo''q, hokimiyat qilsin',1),('Avval yig''ilishda muhokama qilaylik',2)) as x(label,pos);
