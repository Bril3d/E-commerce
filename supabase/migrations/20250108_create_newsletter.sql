-- Create newsletter subscribers table
create table newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unsubscribed_at timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'unsubscribed'))
);

-- Add RLS policies
alter table newsletter_subscribers enable row level security;

-- Allow service role to manage subscribers
create policy "Service role can manage newsletter subscribers"
  on newsletter_subscribers for all
  to service_role
  using (true)
  with check (true);

-- Create indexes
create index newsletter_subscribers_email_idx on newsletter_subscribers(email);
create index newsletter_subscribers_status_idx on newsletter_subscribers(status);
