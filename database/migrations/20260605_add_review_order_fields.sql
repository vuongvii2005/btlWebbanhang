

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS order_id INT NULL AFTER product_id,
    ADD COLUMN IF NOT EXISTS images JSON NULL AFTER comment,
    ADD COLUMN IF NOT EXISTS is_visible TINYINT(1) NOT NULL DEFAULT 1 AFTER images,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE reviews
    ADD INDEX IF NOT EXISTS idx_reviews_product_visible (product_id, is_visible),
    ADD INDEX IF NOT EXISTS idx_reviews_order (order_id),
    ADD UNIQUE KEY IF NOT EXISTS uk_reviews_user_product_order (user_id, product_id, order_id);

