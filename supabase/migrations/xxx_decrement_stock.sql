create or replace function decrement_stock(p_id uuid, amount int)
returns int
language plpgsql
as $$
declare
  current_stock int;
begin
  select stock_quantity into current_stock
  from products
  where id = p_id;
  
  return current_stock - amount;
end;
$$; 