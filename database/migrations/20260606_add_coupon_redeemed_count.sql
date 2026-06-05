ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS redeemed_count INT NOT NULL DEFAULT 0 AFTER usage_limit;

UPDATE coupons c
SET redeemed_count = (
  SELECT COUNT(*)
  FROM user_coupons uc
  WHERE uc.coupon_id = c.id
    AND uc.source = 'points_exchange'
);
