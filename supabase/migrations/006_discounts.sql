-- Discount columns on quotes
alter table quotes add column if not exists discount_percent numeric(5,2) default 0;
alter table quotes add column if not exists discount_amount numeric(12,2) default 0;
