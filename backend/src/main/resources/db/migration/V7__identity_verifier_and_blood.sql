ALTER TABLE users
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN blood_group VARCHAR(8),
  ADD COLUMN identity_document_type ENUM('NID','BIRTH_CERTIFICATE'),
  ADD COLUMN identity_document_file VARCHAR(255),
  ADD COLUMN donor_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN last_blood_donation_at DATETIME(6),
  ADD COLUMN verifier_code VARCHAR(255) UNIQUE;

UPDATE users SET verifier_code = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 12))
  WHERE role = 'VERIFIER' AND verifier_code IS NULL;

ALTER TABLE campaigns
  ADD COLUMN requested_verifier_id BIGINT,
  ADD CONSTRAINT fk_campaign_requested_verifier FOREIGN KEY (requested_verifier_id) REFERENCES users(id);
UPDATE campaigns SET requested_verifier_id = verified_by WHERE verified_by IS NOT NULL;
