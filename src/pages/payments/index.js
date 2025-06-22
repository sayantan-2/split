import React, { useState, useEffect, useCallback } from 'react';
import { useAuthRedirect, AuthLoadingSpinner } from '@/lib/auth';
import {
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Plus
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

const PaymentsPage = () => {
    const { session, status } = useAuthRedirect();
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [allRequests, setAllRequests] = useState([]); // For tab counts
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [filterStatus, setFilterStatus] = useState(''); const fetchPaymentRequests = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch all requests for tab counts (only when needed)
            if (allRequests.length === 0) {
                const allResponse = await fetch('/api/payments/requests');
                if (allResponse.ok) {
                    const allData = await allResponse.json();
                    setAllRequests(allData.requests || []);
                }
            }

            // Fetch filtered requests for current tab
            const params = new URLSearchParams();
            // Map UI tabs to API types:
            // 'incoming' tab (requests you owe) -> API type 'outgoing' (you are payer)
            // 'outgoing' tab (requests others owe you) -> API type 'incoming' (you are payee)
            let typeParam = activeTab;
            if (activeTab === 'incoming') {
                typeParam = 'outgoing';  // You are the payer (owe money)
            } else if (activeTab === 'outgoing') {
                typeParam = 'incoming';  // You are the payee (others owe you)
            }
            if (typeParam !== 'all') params.append('type', typeParam);
            if (filterStatus) params.append('status', filterStatus);

            const response = await fetch(`/api/payments/requests?${params}`);
            if (response.ok) {
                const data = await response.json();
                setPaymentRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching payment requests:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filterStatus, allRequests.length]);

    useEffect(() => {
        if (session) {
            fetchPaymentRequests();
        }
    }, [session, fetchPaymentRequests]); const handleQuickAction = async (requestId, newStatus) => {
        try {
            const response = await fetch(`/api/payments/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Refresh the payment requests list
                await fetchPaymentRequests();
                // Show success message
                const statusLabels = {
                    'accepted': 'accepted',
                    'rejected': 'declined',
                    'paid_pending_confirmation': 'marked as paid',
                    'completed': 'confirmed as received',
                    'disputed': 'disputed'
                };
                alert(`Payment request ${statusLabels[newStatus]} successfully!`);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert(`Failed to update payment: ${error.message}`);
        }
    }; const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
            case 'sent':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'paid_pending_confirmation':
                return <Clock className="w-4 h-4 text-orange-500" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-gray-500" />;
            case 'disputed':
                return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    }; const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'sent':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'accepted':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'paid_pending_confirmation':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'cancelled':
                return 'bg-gray-50 text-gray-700 border-gray-200';
            case 'disputed':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatCurrency = (amount, currency = 'USD') => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
        return `${symbols[currency] || currency}${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }; const getContextualStatus = (request, currentUserId) => {
        const isPayee = request.payee_id === currentUserId; // The one who receives money (usually sent the request)
        const isPayer = request.payer_id === currentUserId; // The one who pays money (usually received the request)
        const status = request.status;

        switch (status) {
            case 'sent':
                return isPayee ? 'Sent' : 'Waiting for your response';
            case 'pending':
                return isPayee ? '' : 'Waiting for your response';
            case 'accepted':
                return isPayee ? 'They accepted' : 'You accepted';
            case 'paid_pending_confirmation':
                return isPayee ? 'Confirm payment received' : 'Marked as paid';
            case 'completed':
                return isPayee ? 'They paid you' : 'You paid';
            case 'rejected':
                return isPayee ? 'They declined' : 'You declined';
            case 'cancelled':
                return isPayee ? 'You cancelled' : 'They cancelled';
            case 'disputed':
                return 'Under dispute';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    if (status === "loading" || loading) {
        const message = status === "loading" ? "Authenticating..." : "Loading payment requests...";
        return <AuthLoadingSpinner message={message} />;
    }

    if (!session) {
        return null;
    }    // Client-side filtering is only for display counts on tabs
    // Use allRequests for accurate tab counts
    const currentUserId = parseInt(session.user.id);
    const incomingRequests = allRequests.filter(req => req.payer_id === currentUserId);
    const outgoingRequests = allRequests.filter(req => req.payee_id === currentUserId);

    const getDisplayRequests = () => {
        // Return the API-filtered results based on current tab
        return paymentRequests;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                            <p className="text-gray-600 mt-1">Track your payment requests and settlements</p>
                        </div>
                        <Link
                            href="/payments/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Request
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex space-x-8">                        {[
                        { key: 'all', label: 'All', count: allRequests.length },
                        { key: 'incoming', label: 'Incoming', count: incomingRequests.length },
                        { key: 'outgoing', label: 'Outgoing', count: outgoingRequests.length }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Filter className="w-4 h-4 text-gray-400" />                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="paid_pending_confirmation">Paid (Pending Confirmation)</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="disputed">Disputed</option>
                    </select>
                </div>
            </div>            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 pb-6">
                {getDisplayRequests().length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab === 'incoming'
                                ? 'No incoming payment requests'
                                : activeTab === 'outgoing'
                                    ? 'No outgoing payment requests'
                                    : 'No payment requests yet'
                            }
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'incoming'
                                ? 'Payment requests from friends will appear here'
                                : 'Get started by creating your first payment request'
                            }
                        </p>
                        <Link
                            href="/payments/create"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Payment Request
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">                        {getDisplayRequests().map((request) => {                            // Convert IDs to numbers for comparison
                        const currentUserId = parseInt(session.user.id);
                        const isPayer = request.payer_id === currentUserId;
                        const isPayee = request.payee_id === currentUserId;
                        const canAccept = isPayer && ['sent', 'pending'].includes(request.status);
                        const canReject = isPayer && ['sent', 'pending'].includes(request.status);
                        const canMarkPaid = isPayer && request.status === 'accepted';
                        const canConfirmPayment = isPayee && request.status === 'paid_pending_confirmation';
                        const needsAction = canAccept || canReject || canMarkPaid || canConfirmPayment;

                        return (
                            <div key={request.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${needsAction ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
                                }`}>                                {needsAction && (
                                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-800 font-medium">
                                            🔔 Action Required: {
                                                canConfirmPayment
                                                    ? `${request.payer_name} marked payment as sent`
                                                    : `${request.payee_name} requested a payment`
                                            }
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">                                            {/* Direction indicator */}
                                        <div className={`p-2 rounded-full ${request.payer_id === currentUserId
                                            ? 'bg-green-50'
                                            : 'bg-red-50'
                                            }`}>
                                            {request.payer_id === currentUserId ? (
                                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>

                                        <div className="flex-1">                                                <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900">
                                                {request.payee_id === currentUserId
                                                    ? `Request to ${request.payer_name}`
                                                    : `Request from ${request.payee_name}`
                                                }
                                            </h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(request.status)}`}>
                                                {getStatusIcon(request.status)}
                                                {getContextualStatus(request, currentUserId)}
                                            </span>
                                        </div>

                                            {request.bill_title && (
                                                <p className="text-sm text-gray-600 mb-1">
                                                    From: {request.bill_title}
                                                </p>
                                            )}

                                            {request.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {request.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>Created: {formatDate(request.created_at)}</span>
                                                {request.due_date && (
                                                    <span>Due: {formatDate(request.due_date)}</span>
                                                )}
                                                {request.completed_at && (
                                                    <span>Completed: {formatDate(request.completed_at)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right ml-4">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(request.amount, request.currency)}
                                        </div>                                            {/* Action buttons for payer */}
                                        {canAccept && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleQuickAction(request.id, 'accepted')}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAction(request.id, 'rejected')}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}                                        {canMarkPaid && (
                                            <button
                                                onClick={() => handleQuickAction(request.id, 'paid_pending_confirmation')}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors mt-2"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        {canConfirmPayment && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleQuickAction(request.id, 'completed')}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                >
                                                    Confirm Received
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAction(request.id, 'disputed')}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Dispute
                                                </button>
                                            </div>
                                        )}

                                        <Link
                                            href={`/payments/${request.id}`}
                                            className="block text-sm text-blue-600 hover:text-blue-700 transition-colors mt-1"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>            <BottomNav active="payments" />
        </div>
    );
};

export default PaymentsPage;
