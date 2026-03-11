-- Ensure only one invoice per quote (prevent race condition duplicates)
ALTER TABLE invoices ADD CONSTRAINT invoices_quote_id_unique UNIQUE (quote_id);
