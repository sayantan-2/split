-- Bills schema for Split application
-- This tracks bills and their items

-- Bills table - tracks overall bill information
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    merchant VARCHAR(255),

    -- Financial details
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Bill metadata
    bill_date TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Processing details
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai_receipt', 'import'
    receipt_image_url VARCHAR(500),
    ai_confidence DECIMAL(3,2), -- Confidence score from AI processing (0.00-1.00)

    -- Status and timestamps
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled', 'disputed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Notes and additional info
    notes TEXT,
    tags TEXT[] -- PostgreSQL array for categorization
);

-- Bill items table - tracks individual items on the bill
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,

    -- Item details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(8,2) DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,

    -- Tax information
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,

    -- Splitting configuration
    split_type VARCHAR(20) DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares')),
    is_shared BOOLEAN DEFAULT true,

    -- Order and organization
    line_number INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bill_id, line_number)
);

-- Bill participants table - tracks who participated in the bill
CREATE TABLE IF NOT EXISTS bill_participants (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Participation details
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('creator', 'participant', 'payer')),
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP,

    -- User's share of the bill
    total_share DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0, -- negative means they owe, positive means they're owed

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'declined')),

    UNIQUE(bill_id, user_id)
);

-- Bill item splits table - tracks how each item is split among participants
CREATE TABLE IF NOT EXISTS bill_item_splits (
    id SERIAL PRIMARY KEY,
    bill_item_id INTEGER NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Split details
    share_amount DECIMAL(8,4) NOT NULL DEFAULT 0, -- For shares/portions
    share_percentage DECIMAL(5,2), -- For percentage splits
    fixed_amount DECIMAL(10,2), -- For exact amount splits

    -- Calculated amounts (including tax)
    subtotal_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bill_item_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_line_number ON bill_items(bill_id, line_number);

CREATE INDEX IF NOT EXISTS idx_bill_participants_bill_id ON bill_participants(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_participants_user_id ON bill_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_bill_item_splits_item_id ON bill_item_splits(bill_item_id);
CREATE INDEX IF NOT EXISTS idx_bill_item_splits_user_id ON bill_item_splits(user_id);

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
