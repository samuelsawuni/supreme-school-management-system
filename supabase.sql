-- Supreme School Management System
-- Run this in Supabase SQL Editor.
-- The web app uses Supabase Auth for the admin login.

create extension if not exists pgcrypto;

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  role text not null default 'Teacher',
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  admission_no text unique,
  name text not null,
  class_id uuid references public.classes(id) on delete set null,
  total_fees numeric(12,2) not null default 0,
  phone text,
  guardian_name text,
  guardian_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash',
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  attendance_date date not null default current_date,
  status text not null check (status in ('Present','Late','Absent')),
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

create index if not exists students_class_id_idx on public.students(class_id);
create index if not exists payments_student_id_idx on public.payments(student_id);
create index if not exists payments_date_idx on public.payments(payment_date);
create index if not exists attendance_date_idx on public.attendance(attendance_date);

-- Helpful reporting views used by the dashboard.
create or replace view public.student_fee_summary as
select
  s.id,
  s.admission_no,
  s.name,
  s.class_id,
  c.name as class_name,
  s.total_fees,
  coalesce(sum(p.amount),0)::numeric(12,2) as total_paid,
  greatest(s.total_fees - coalesce(sum(p.amount),0),0)::numeric(12,2) as balance
from public.students s
left join public.classes c on c.id=s.class_id
left join public.payments p on p.student_id=s.id
group by s.id,s.admission_no,s.name,s.class_id,c.name,s.total_fees;

create or replace view public.attendance_details as
select a.id,a.student_id,s.name as student_name,a.teacher_id,t.name as teacher_name,
       a.attendance_date,a.status,a.created_at
from public.attendance a
join public.students s on s.id=a.student_id
left join public.teachers t on t.id=a.teacher_id;

-- Enable RLS. Only signed-in users can access school data.
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "authenticated teachers" on public.teachers;
create policy "authenticated teachers" on public.teachers for all to authenticated using (true) with check (true);

drop policy if exists "authenticated classes" on public.classes;
create policy "authenticated classes" on public.classes for all to authenticated using (true) with check (true);

drop policy if exists "authenticated students" on public.students;
create policy "authenticated students" on public.students for all to authenticated using (true) with check (true);

drop policy if exists "authenticated payments" on public.payments;
create policy "authenticated payments" on public.payments for all to authenticated using (true) with check (true);

drop policy if exists "authenticated attendance" on public.attendance;
create policy "authenticated attendance" on public.attendance for all to authenticated using (true) with check (true);

-- Optional starter classes. Safe to run more than once.
insert into public.classes(name) values
('Nursery'),('KG 1'),('KG 2'),('P1'),('P2'),('P3'),('P4'),('P5'),('P6'),('JHS 1'),('JHS 2'),('JHS 3')
on conflict (name) do nothing;

-- IMPORTANT: create your Admin user in Supabase Dashboard > Authentication > Users.
-- Do not put a service_role key in this GitHub repository.
