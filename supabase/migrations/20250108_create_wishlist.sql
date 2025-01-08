-- Create wishlist table
create table wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Add RLS policies
alter table wishlist enable row level security;

-- Allow users to view their own wishlist
create policy "Users can view their own wishlist"
  on wishlist for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow users to add items to their wishlist
create policy "Users can add items to their wishlist"
  on wishlist for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to remove items from their wishlist
create policy "Users can remove items from their wishlist"
  on wishlist for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index wishlist_user_id_idx on wishlist(user_id);
create index wishlist_product_id_idx on wishlist(product_id);
