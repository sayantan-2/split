import { useState } from 'react';
import PropTypes from 'prop-types';
import './Payment.css';

/**
 * Payment component that displays and manages a payment with items and splits
 */
const Payment = ({
    id,
    name,
    currency,
    creator,
    items,
    location = null,
    tags = null,
    receiptRef = null,
    description = null,
    onUpdate = null,
    className = '',
}) => {
    const [paymentState, setPaymentState] = useState({
        name,
        items: [...items],
        description,
    });

    // Calculate item subtotal (after discount)
    const calculateItemSubtotal = (item) => {
        const subtotal = item.unitPrice * item.quantity;
        const discount = subtotal * ((item.discountPercentage || 0) / 100);
        return subtotal - discount;
    };

    // Calculate item tax
    const calculateItemTax = (item) => {
        const subtotal = calculateItemSubtotal(item);
        return subtotal * ((item.taxPercentage || 0) / 100);
    };

    // Calculate item total (subtotal + tax)
    const calculateItemTotal = (item) => {
        const subtotal = calculateItemSubtotal(item);
        const tax = calculateItemTax(item);
        return subtotal + tax;
    };

    // Calculate total amount for all items (before tax)
    const getTotalAmount = () => {
        return paymentState.items.reduce(
            (sum, item) => sum + calculateItemSubtotal(item),
            0
        );
    };

    // Calculate total tax amount for all items
    const getTotalTax = () => {
        return paymentState.items.reduce(
            (sum, item) => sum + calculateItemTax(item),
            0
        );
    };

    // Handle item updates
    const updateItem = (index, updates) => {
        const updatedItems = [...paymentState.items];
        updatedItems[index] = { ...updatedItems[index], ...updates };

        setPaymentState(prev => ({
            ...prev,
            items: updatedItems,
        }));

        // Notify parent component of the update
        if (onUpdate) {
            onUpdate({
                id,
                name: paymentState.name,
                currency,
                creator,
                lastUpdatedAt: new Date(),
                items: updatedItems,
                location,
                tags,
                receiptRef,
                description: paymentState.description,
            });
        }
    };

    // Handle adding a new item
    const addItem = () => {
        const newItem = {
            name: 'New Item',
            unitPrice: 0,
            quantity: 1,
            discountPercentage: 0,
            taxPercentage: 0,
            splitEqually: null,
            splitByExactAmounts: null,
            splitByPercentages: null,
            splitByShares: null,
            splitByAdjustments: null,
        };

        setPaymentState(prev => ({
            ...prev,
            items: [...prev.items, newItem],
        }));
    };

    // Handle removing an item
    const removeItem = (index) => {
        const updatedItems = [...paymentState.items];
        updatedItems.splice(index, 1);
        setPaymentState(prev => ({
            ...prev,
            items: updatedItems,
        }));

        if (onUpdate) {
            onUpdate({
                id,
                name: paymentState.name,
                currency,
                creator,
                lastUpdatedAt: new Date(),
                items: updatedItems,
                location,
                tags,
                receiptRef,
                description: paymentState.description,
            });
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    return (
        <div className={`payment-container ${className}`}>
            <div className="payment-header">
                <h2 className="payment-title">{paymentState.name}</h2>
                {description && <p className="payment-description">{paymentState.description}</p>}
                <div className="payment-totals">
                    <div>Subtotal: {formatCurrency(getTotalAmount())}</div>
                    <div>Tax: {formatCurrency(getTotalTax())}</div>
                    <div className="total-amount">Total: {formatCurrency(getTotalAmount() + getTotalTax())}</div>
                </div>
            </div>

            <div className="items-list">
                {paymentState.items.length > 0 && (
                    <div className="item-row header">
                        <div className="form-group">
                            <label>Item Name</label>
                        </div>
                        <div className="form-group">
                            <label>Unit Price<br />({currency})</label>
                        </div>
                        <div className="form-group">
                            <label>Qty</label>
                        </div>
                        <div className="form-group">
                            <label>Disc. %</label>
                        </div>
                        <div className="form-group">
                            <label>Tax %</label>
                        </div>
                        <div className="form-group">
                            <label>Total</label>
                        </div>
                        <div></div>
                    </div>
                )}

                {paymentState.items.map((item, index) => (
                    <div key={index} className="item-row">
                        <div className="form-group">
                            {/* <label>Item Name</label> */}
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(index, { name: e.target.value })}
                                className="form-control"
                                placeholder="Item name"
                            />
                        </div>
                        <div className="form-group">
                            {/* <label>Unit Price<br />({currency})</label> */}
                            <input
                                type="text"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="unit price"
                            />
                        </div>
                        <div className="form-group">
                            {/* <label>Qty</label> */}
                            <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="quantity"
                            />
                        </div>
                        <div className="form-group">
                            {/* <label>Disc. %</label> */}
                            <input
                                type="text"
                                value={item.discountPercentage || 0}
                                onChange={(e) => updateItem(index, { discountPercentage: parseFloat(e.target.value) || 0 })}
                                className="form-control"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="discount %"
                            />
                        </div>
                        <div className="form-group">
                            {/* <label>Tax %</label> */}
                            <input
                                type="text"
                                value={item.taxPercentage || 0}
                                onChange={(e) => updateItem(index, { taxPercentage: parseFloat(e.target.value) || 0 })}
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="tax %"
                            />
                        </div>
                        <div className="form-group">
                            {/* <label>Total</label> */}
                            <input
                                disabled
                                type="text"
                                value={calculateItemTotal(item)}
                                onChange={(e) => updateItem(index, { taxPercentage: parseFloat(e.target.value) || 0 })}
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="total"
                            />

                        </div>
                        <div className="item-actions">
                            <button
                                type="button"
                                className="remove-item-btn"
                                onClick={() => removeItem(index)}
                                title="Remove item"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addItem} className="add-item-btn">
                    + Add Item
                </button>
            </div>
        </div>
    );
};

// Prop type validation
Payment.propTypes = {
    /** Unique identifier for the payment */
    id: PropTypes.string.isRequired,

    /** Name or description of the payment */
    name: PropTypes.string.isRequired,

    /** Currency code (e.g., 'USD', 'INR') */
    currency: PropTypes.string.isRequired,

    /** User who created the payment */
    creator: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,

    /** When the payment was last updated */
    lastUpdatedAt: PropTypes.instanceOf(Date).isRequired,

    /** List of items in the payment */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            unitPrice: PropTypes.number.isRequired,
            quantity: PropTypes.number.isRequired,
            discountPercentage: PropTypes.number,
            taxPercentage: PropTypes.number,
            splitEqually: PropTypes.instanceOf(Set),
            splitByExactAmounts: PropTypes.instanceOf(Map),
            splitByPercentages: PropTypes.instanceOf(Map),
            splitByShares: PropTypes.instanceOf(Map),
            splitByAdjustments: PropTypes.instanceOf(Map),
        })
    ).isRequired,

    /** Optional location where the payment was made */
    location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
    }),

    /** Optional tags for categorization */
    tags: PropTypes.instanceOf(Set),

    /** Optional reference to a receipt */
    receiptRef: PropTypes.shape({
        ref: PropTypes.string.isRequired,
        url: PropTypes.string,
    }),

    /** Optional additional details */
    description: PropTypes.string,

    /** Callback when payment is updated */
    onUpdate: PropTypes.func,

    /** Optional CSS class name */
    className: PropTypes.string,
};

// Default props
Payment.defaultProps = {
    location: null,
    tags: null,
    receiptRef: null,
    description: null,
    onUpdate: null,
    className: '',
};

export default Payment;