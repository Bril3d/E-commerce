-- Add tracking fields to orders table
alter table orders
add column tracking_number text,
add column estimated_delivery timestamp with time zone,
add column status text not null default 'pending'
  check (status in ('pending', 'processing', 'shipped', 'delivered'));

-- Create order tracking table for detailed updates
create table order_tracking (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  status text not null,
  location text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table order_tracking enable row level security;

-- Allow public read access for order tracking
create policy "Order tracking is viewable by everyone"
  on order_tracking for select
  using (true);

-- Allow service role to manage order tracking
create policy "Service role can manage order tracking"
  on order_tracking for all
  to service_role
  using (true)
  with check (true);

-- Create indexes for better performance
create index order_tracking_order_id_idx on order_tracking(order_id);
create index order_tracking_timestamp_idx on order_tracking(timestamp);
