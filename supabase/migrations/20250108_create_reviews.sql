-- Create reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table reviews enable row level security;

-- Allow public read access
create policy "Reviews are viewable by everyone"
  on reviews for select
  using (true);

-- Allow authenticated users to create reviews
create policy "Authenticated users can create reviews"
  on reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own reviews
create policy "Users can update their own reviews"
  on reviews for update
  to authenticated
  using (auth.uid() = user_id);

-- Allow users to delete their own reviews
create policy "Users can delete their own reviews"
  on reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create trigger to update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_reviews_updated_at
  before update on reviews
  for each row
  execute function update_updated_at_column();

-- Create index for faster queries
create index reviews_product_id_idx on reviews(product_id);
create index reviews_user_id_idx on reviews(user_id);
create index reviews_created_at_idx on reviews(created_at);

-- Add unique constraint to prevent multiple reviews from same user on same product
create unique index reviews_user_product_unique_idx on reviews(user_id, product_id);
