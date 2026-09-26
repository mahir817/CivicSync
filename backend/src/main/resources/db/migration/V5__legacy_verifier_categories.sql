INSERT INTO verifier_categories (user_id, category)
SELECT u.id, c.category
FROM users u
CROSS JOIN (
  SELECT 'BLOOD' AS category
  UNION ALL SELECT 'PET_CARE'
  UNION ALL SELECT 'CHARITY'
  UNION ALL SELECT 'DISASTER_RELIEF'
) c
WHERE u.role = 'VERIFIER' AND u.legacy_role_needs_review = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM verifier_categories existing
    WHERE existing.user_id = u.id AND existing.category = c.category
  );
