-- Payment tracking schema for Split application
-- This tracks payment requests, statuses, and settlements between users

-- Payment requests table - tracks who owes what to whom
CREATE TABLE IF NOT EXISTS payment_requests (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'accepted', 'completed', 'rejected', 'cancelled', 'disputed')),

    -- Payment method and external references
    payment_method VARCHAR(50), -- 'manual', 'stripe', 'paypal', 'venmo', etc.
    external_payment_id VARCHAR(255), -- Reference to external payment processor

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,

    -- Ensure no duplicate payment requests for same bill between same users
    UNIQUE(bill_id, payer_id, payee_id)
);

-- Settlements table - tracks actual payments made
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    payment_request_id INTEGER REFERENCES payment_requests(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    settlement_method VARCHAR(50) NOT NULL, -- 'cash', 'venmo', 'paypal', 'stripe', 'bank_transfer'

    -- External payment details
    external_transaction_id VARCHAR(255),
    external_fee DECIMAL(10,2) DEFAULT 0,

    -- Status and verification
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    verified_by_payee BOOLEAN DEFAULT FALSE,
    verified_by_payer BOOLEAN DEFAULT FALSE,

    -- Evidence/proof of payment
    receipt_url VARCHAR(500),
    proof_image_url VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,

    -- Notes and metadata
    notes TEXT
);

-- Payment reminders table - tracks reminder history
CREATE TABLE IF NOT EXISTS payment_reminders (
    id SERIAL PRIMARY KEY,
    payment_request_id INTEGER REFERENCES payment_requests(id) ON DELETE CASCADE,
    sent_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) DEFAULT 'gentle' CHECK (reminder_type IN ('gentle', 'urgent', 'final')),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Payment disputes table - tracks disputes and resolutions
CREATE TABLE IF NOT EXISTS payment_disputes (
    id SERIAL PRIMARY KEY,
    payment_request_id INTEGER REFERENCES payment_requests(id) ON DELETE CASCADE,
    initiated_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dispute_reason VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated', 'closed')),
    resolution TEXT,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_payer ON payment_requests(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payee ON payment_requests(payee_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_bill ON payment_requests(bill_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payment_request ON settlements(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_request ON payment_reminders(payment_request_id);

-- Update bills table to track payment status
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'overdue'));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP;

-- Update bill_participants to track individual payment status
ALTER TABLE bill_participants ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid'));
ALTER TABLE bill_participants ADD COLUMN IF NOT EXISTS last_reminded TIMESTAMP;

-- Create a view for payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    COUNT(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payer_id = u.id THEN 1 END) as pending_payments,
    COUNT(CASE WHEN pr.status = 'completed' AND pr.payer_id = u.id THEN 1 END) as completed_payments,
    COUNT(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payee_id = u.id THEN 1 END) as incoming_requests,
    COALESCE(SUM(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payer_id = u.id THEN pr.amount END), 0) as total_owed,
    COALESCE(SUM(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payee_id = u.id THEN pr.amount END), 0) as total_owed_to_me,
    COALESCE(SUM(CASE WHEN pr.status = 'completed' AND pr.payer_id = u.id THEN pr.amount END), 0) as total_paid_out,
    COALESCE(SUM(CASE WHEN pr.status = 'completed' AND pr.payee_id = u.id THEN pr.amount END), 0) as total_received
FROM users u
LEFT JOIN payment_requests pr ON u.id = pr.payer_id OR u.id = pr.payee_id
GROUP BY u.id, u.name, u.email;
