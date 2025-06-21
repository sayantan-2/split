-- Migration to update payment request status constraint

-- Drop the old constraint
ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_status_check;

-- Add the new constraint with additional status values
ALTER TABLE payment_requests ADD CONSTRAINT payment_requests_status_check
    CHECK (status IN ('pending', 'sent', 'accepted', 'completed', 'rejected', 'cancelled', 'disputed'));
