# Supreme School Management System

A Ghana-focused school management system for student records, fee collection, attendance, teachers, classes and reports.

## Supabase setup

1. Open the Supabase project for this application.
2. Open **SQL Editor** and run `supabase.sql` from this repository.
3. In **Authentication → Users**, create the administrator account that will sign in to the website.
4. Deploy/enable GitHub Pages for the repository.

The browser uses the Supabase **publishable key** only. The `service_role` key must never be placed in this repository.

## Current version

- Supabase Auth admin login/logout
- Live student records from Supabase
- Add students
- Record fee payments
- Fee collection and outstanding-balance dashboard
- Attendance records by date/class
- Teacher management
- Class management
- Outstanding-fees report with print support
- Responsive desktop/mobile layout

## Database

The database schema and Row Level Security policies are in `supabase.sql`. All school data tables require an authenticated Supabase user.
