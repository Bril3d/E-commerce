-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for inserting orders (authenticated users can create their own orders)
CREATE POLICY "Users can create their own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for viewing orders (authenticated users can view their own orders)
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- Policy for updating orders (authenticated users can update their own orders)
CREATE POLICY "Users can update their own orders" ON orders
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting orders (authenticated users can delete their own orders)
CREATE POLICY "Users can delete their own orders" ON orders
FOR DELETE USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON orders TO authenticated; 