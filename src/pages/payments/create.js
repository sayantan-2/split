import React, { useState, useEffect } from 'react';
import { useAuthRedirect, AuthLoadingSpinner } from '@/lib/auth';
import { ArrowLeft, DollarSign, Calendar, MessageSquare, User } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const CreatePaymentRequest = () => {
    const router = useRouter();
    const { session, status } = useAuthRedirect();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        payer_id: '',
        amount: '',
        currency: 'USD',
        description: '',
        due_date: '',
        payment_method: 'manual',
        notes: ''
    });

    useEffect(() => {
        if (session) {
            fetchFriends();
        }
    }, [session]);

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/friends');
            if (response.ok) {
                const data = await response.json();
                setFriends(data.friends || []);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.payer_id || !formData.amount) {
            alert('Please select a friend and enter an amount');
            return;
        } setSubmitting(true);
        try {
            const response = await fetch('/api/payments/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payer_id: formData.payer_id,
                    payee_id: session.user.id,
                    amount: parseFloat(formData.amount),
                    currency: formData.currency,
                    description: formData.description,
                    due_date: formData.due_date || null,
                    payment_method: formData.payment_method,
                    notes: formData.notes
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/payments/${data.request.id}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create payment request');
            }
        } catch (error) {
            console.error('Error creating payment request:', error);
            alert('Failed to create payment request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (status === "loading" || loading) {
        const message = status === "loading" ? "Authenticating..." : "Loading friends...";
        return <AuthLoadingSpinner message={message} />;
    }

    if (!session) {
        return null; // Will redirect to signin
    }

    const formatCurrency = (currency) => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
        return symbols[currency] || currency;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/payments"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Create Payment Request</h1>
                            <p className="text-sm text-gray-600">Send a request to a friend - they can accept or decline</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Select Friend */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Request payment from</label>
                        </div>
                        {friends.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">You don&apos;t have any friends added yet.</p>
                                <Link
                                    href="/friends"
                                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Friends
                                </Link>
                            </div>
                        ) : (
                            <select
                                value={formData.payer_id}
                                onChange={(e) => handleInputChange('payer_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select a friend</option>
                                {friends.map(friend => (
                                    <option key={friend.id} value={friend.id}>
                                        {friend.name} ({friend.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Amount</label>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={formData.currency}
                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    {formatCurrency(formData.currency)}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Description</label>
                        </div>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="What is this payment for?"
                            required
                        />
                    </div>

                    {/* Due Date (Optional) */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Due Date (Optional)</label>
                        </div>
                        <input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => handleInputChange('due_date', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={new Date().toISOString().slice(0, 16)}
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Payment Method</label>
                        </div>
                        <select
                            value={formData.payment_method}
                            onChange={(e) => handleInputChange('payment_method', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="manual">Manual/Cash</option>
                            <option value="venmo">Venmo</option>
                            <option value="paypal">PayPal</option>
                            <option value="zelle">Zelle</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-900">Notes (Optional)</label>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            placeholder="Additional notes or instructions..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <Link
                            href="/payments"
                            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
                        >
                            Cancel
                        </Link>                        <button
                            type="submit"
                            disabled={submitting || friends.length === 0}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {submitting ? 'Sending...' : 'Send Payment Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePaymentRequest;
