
# HUSTLEHUB — Supabase Setup

## Project Information
- Platform: Supabase
- Project URL: https://osumagzwxvyaepycksin.supabase.co
- Website: https://billy2-b.github.io/Hustlehub/
- Purpose: Authentication, database storage, job listings and administrator access.

## Database Tables

### 1. profiles
Stores information about registered users.

Important columns:
- id
- full_name
- role
- referral_code
- referred_by
- created_at
- is_activated
- activated_at

New users should receive the job_seeker role by default.
Administrator privileges must only be assigned by an authorized administrator.

### 2. jobs
Stores job listings.

Important columns:
- id
- title
- company_name
- county
- work_type
- category
- description
- application_url
- verified
- status
- created_at

Job statuses:
- draft
- published

Only published jobs should appear in the public jobs list.

## Authentication
- Email and password registration are configured.
- Login uses Supabase Auth.
- Email confirmation may be required depending on the Auth settings.
- User profile records are created through a database trigger.

## Row Level Security (RLS)
- Users should only be able to view their own profile.
- Ordinary users must not be able to assign themselves administrator privileges.
- Public visitors may read published jobs only.
- Only authorized administrators may create, edit or delete jobs.
- Database policies must enforce these rules independently of the website interface.

## Administrator Access
The website checks the signed-in user's profile role.
The database must also enforce administrator permissions using secure policies and functions.

## M-Pesa Integration
The project uses Safaricom Daraja sandbox for development.
The Supabase Edge Function is named mpesa-stk-push.

Payment credentials and callback secrets must be stored as Supabase Edge Function secrets, never in public website JavaScript.

## Security Rules
- Never commit service-role keys, database passwords or secret API credentials.
- Never store Safaricom Consumer Secrets in public files.
- The publishable key may be used in the public website when Row Level Security is correctly configured.
- Test payments using the sandbox before considering live payments.
- Do not store sensitive payment credentials in GitHub.

## Remaining Checks
1. Verify published jobs appear publicly.
2. Test access using a normal job-seeker account.
3. Test database permissions for each role.
4. Verify payment callbacks securely.
5. Review database policies before public launch.
