-- Back up first. Apply once, before deploying the new application.
ALTER TABLE quotes ADD COLUMN client_snapshot TEXT NULL;
UPDATE quotes q JOIN customers c ON c.id = q.customer_id AND c.user_id = q.user_id
SET q.client_snapshot = JSON_OBJECT('name', c.name, 'phone', c.phone, 'email', c.email, 'address', c.address)
WHERE q.client_snapshot IS NULL;
