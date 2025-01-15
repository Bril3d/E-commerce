ALTER TABLE profiles 
ADD COLUMN role text NOT NULL DEFAULT 'customer' 
CHECK (role IN ('admin', 'customer'));

-- Create an initial admin user (replace with your admin user's ID)
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-admin-user-id'; 