ALTER TABLE users
  ADD COLUMN area VARCHAR(255),
  ADD COLUMN phone VARCHAR(255),
  ADD COLUMN language VARCHAR(8) NOT NULL DEFAULT 'en',
  ADD COLUMN reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN legacy_role_needs_review BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE users SET legacy_role_needs_review = TRUE WHERE role IN ('VERIFIER','ADMIN');

ALTER TABLE campaigns
  ADD COLUMN outcome_summary VARCHAR(2000),
  ADD COLUMN outcome_proof_url VARCHAR(255),
  ADD COLUMN outcome_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN completed_at DATETIME(6);

ALTER TABLE donations
  ADD COLUMN status ENUM('PENDING_RECEIPT','CONFIRMED','PLEDGED') NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN confirmed_at DATETIME(6),
  ADD COLUMN confirmed_by_id BIGINT,
  ADD CONSTRAINT fk_donation_confirmer FOREIGN KEY (confirmed_by_id) REFERENCES users(id);
UPDATE donations SET status = 'PLEDGED' WHERE type = 'PLEDGE';

CREATE TABLE user_interests (
  user_id BIGINT NOT NULL,
  category ENUM('BLOOD','PET_CARE','CHARITY','DISASTER_RELIEF') NOT NULL,
  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE verifier_categories (
  user_id BIGINT NOT NULL,
  category ENUM('BLOOD','PET_CARE','CHARITY','DISASTER_RELIEF') NOT NULL,
  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE civic_confirmations (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  UNIQUE KEY uq_civic_confirmation (report_id, user_id),
  FOREIGN KEY (report_id) REFERENCES civic_reports(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE disputes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_type ENUM('CAMPAIGN','CIVIC_REPORT') NOT NULL,
  post_id BIGINT NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status ENUM('OPEN','RESOLVED','DISMISSED') NOT NULL,
  created_by_id BIGINT,
  reviewed_by_id BIGINT,
  created_at DATETIME(6),
  reviewed_at DATETIME(6),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);
CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  dedupe_key VARCHAR(255) NOT NULL,
  message_key VARCHAR(255) NOT NULL,
  campaign_id BIGINT,
  read_state BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6),
  UNIQUE KEY uq_notification (user_id, dedupe_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
