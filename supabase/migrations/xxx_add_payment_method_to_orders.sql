ALTER TABLE orders 
ADD COLUMN payment_method text NOT NULL DEFAULT 'card' 
CHECK (payment_method IN ('card', 'cash')); 