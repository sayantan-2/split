-- Friends system schema for Split application
-- This extends your existing users table with friendship functionality

-- Friendships table to track relationships between users
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure no duplicate friendships and no self-friendship
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Bills table to track shared expenses (simplified version)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled'))
);

-- Bill participants table to track who's involved in each bill
CREATE TABLE IF NOT EXISTS bill_participants (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_owed DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure no duplicate participants per bill
    UNIQUE(bill_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bill_participants_bill_id ON bill_participants(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_participants_user_id ON bill_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Function to automatically create reciprocal friendship when one is accepted
CREATE OR REPLACE FUNCTION create_reciprocal_friendship()
RETURNS TRIGGER AS $$
BEGIN
    -- When a friendship is accepted, create the reciprocal relationship
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
        VALUES (NEW.friend_id, NEW.user_id, 'accepted', NOW(), NOW())
        ON CONFLICT (user_id, friend_id)
        DO UPDATE SET status = 'accepted', updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reciprocal friendships
DROP TRIGGER IF EXISTS trigger_reciprocal_friendship ON friendships;
CREATE TRIGGER trigger_reciprocal_friendship
    AFTER UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION create_reciprocal_friendship();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
