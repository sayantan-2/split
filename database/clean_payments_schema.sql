-- Clean Payment tracking schema for Split application
-- Only includes tables and features actually used by the application

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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_payer ON payment_requests(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payee ON payment_requests(payee_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_bill ON payment_requests(bill_id);

-- Update bills table to track payment status (if columns don't exist)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'overdue'));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP;

-- Update bill_participants to track individual payment status (if columns don't exist)
ALTER TABLE bill_participants ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid'));
ALTER TABLE bill_participants ADD COLUMN IF NOT EXISTS last_reminded TIMESTAMP;
