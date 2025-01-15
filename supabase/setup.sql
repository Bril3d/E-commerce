-- Create profiles table
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  category_id uuid references categories(id) on delete set null,
  stock_quantity integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create addresses table
create table addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null,
  city text not null,
  country text not null,
  postal_code text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered')),
  total_amount decimal(10,2) not null,
  shipping_address_id uuid references addresses(id) on delete set null,
  tracking_number text,
  estimated_delivery timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order items table
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Create wishlist table
create table wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Create newsletter subscribers table
create table newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unsubscribed_at timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'unsubscribed'))
);

-- Create order tracking table
create table order_tracking (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  status text not null,
  location text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table wishlist enable row level security;
alter table newsletter_subscribers enable row level security;
alter table order_tracking enable row level security;

-- RLS Policies

-- Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Categories
create policy "Categories are viewable by everyone"
  on categories for select using (true);

-- Products
create policy "Products are viewable by everyone"
  on products for select using (true);

-- Addresses
create policy "Users can view their own addresses"
  on addresses for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses"
  on addresses for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses"
  on addresses for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses"
  on addresses for delete using (auth.uid() = user_id);

-- Orders
create policy "Users can view their own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on orders for insert with check (auth.uid() = user_id);

-- Order Items
create policy "Users can view their own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Reviews
create policy "Reviews are viewable by everyone"
  on reviews for select using (true);

create policy "Authenticated users can create reviews"
  on reviews for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on reviews for update using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on reviews for delete using (auth.uid() = user_id);

-- Wishlist
create policy "Users can view their own wishlist"
  on wishlist for select using (auth.uid() = user_id);

create policy "Users can add items to their wishlist"
  on wishlist for insert with check (auth.uid() = user_id);

create policy "Users can remove items from their wishlist"
  on wishlist for delete using (auth.uid() = user_id);

-- Newsletter
create policy "Newsletter subscribers are managed by service role"
  on newsletter_subscribers for all to service_role using (true) with check (true);

-- Order Tracking
create policy "Users can view tracking for their orders"
  on order_tracking for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_tracking.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert some sample categories
insert into categories (name, description) values
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Fashion and apparel'),
  ('Books', 'Books and literature'),
  ('Home & Garden', 'Home decor and gardening supplies'),
  ('Sports & Outdoors', 'Sports equipment and outdoor gear');

-- Insert some sample products
insert into products (name, description, price, category_id, stock_quantity, image_url) 
select
  'Sample Product ' || i,
  'This is a description for sample product ' || i,
  (random() * 900 + 100)::decimal(10,2),
  (select id from categories order by random() limit 1),
  (random() * 100 + 1)::integer,
  'https://picsum.photos/seed/' || i || '/400'
from generate_series(1, 20) i;


-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);