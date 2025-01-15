-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy for inserting order items (authenticated users can insert their own orders' items)
CREATE POLICY "Users can insert their own order items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy for viewing order items (authenticated users can view their own orders' items)
CREATE POLICY "Users can view their own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy for updating order items (authenticated users can update their own orders' items)
CREATE POLICY "Users can update their own order items" ON order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy for deleting order items (authenticated users can delete their own orders' items)
CREATE POLICY "Users can delete their own order items" ON order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Grant access to authenticated users
GRANT ALL ON order_items TO authenticated; 