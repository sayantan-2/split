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
    const [filterStatus, setFilterStatus] = useState('');

    const fetchPaymentRequests = useCallback(async () => {
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
    }, [session, fetchPaymentRequests]);

    const handleQuickAction = async (requestId, newStatus) => {
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
    };

    const getStatusIcon = (status) => {
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
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'sent':
                return 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200';
            case 'accepted':
                return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200';
            case 'paid_pending_confirmation':
                return 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 border-orange-200';
            case 'completed':
                return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200';
            case 'cancelled':
                return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border-gray-200';
            case 'disputed':
                return 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-800 border-orange-200';
            default:
                return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border-gray-200';
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
    };

    const getContextualStatus = (request, currentUserId) => {
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
    }

    // Client-side filtering is only for display counts on tabs
    // Use allRequests for accurate tab counts
    const currentUserId = parseInt(session.user.id);
    const incomingRequests = allRequests.filter(req => req.payer_id === currentUserId);
    const outgoingRequests = allRequests.filter(req => req.payee_id === currentUserId);

    const getDisplayRequests = () => {
        // Return the API-filtered results based on current tab
        return paymentRequests;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Payments</h1>
                            <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Track your payment requests and settlements</p>
                        </div>
                        <Link
                            href="/payments/create"
                            className="bg-white text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="sm:hidden">New</span>
                            <span className="hidden sm:inline">New Request</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex space-x-2 sm:space-x-8 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All', count: allRequests.length },
                            { key: 'incoming', label: 'Incoming', count: incomingRequests.length },
                            { key: 'outgoing', label: 'Outgoing', count: outgoingRequests.length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 sm:px-2 py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap ${activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="hidden xs:inline">{tab.label}</span>
                                    <span className="xs:hidden">{tab.label.charAt(0)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.key
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filter by status:</span>
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        >
                            <option value="">All Statuses</option>
                            <option value="sent">📤 Sent</option>
                            <option value="accepted">✅ Accepted</option>
                            <option value="paid_pending_confirmation">⏳ Paid (Pending Confirmation)</option>
                            <option value="completed">🎉 Completed</option>
                            <option value="rejected">❌ Rejected</option>
                            <option value="cancelled">🚫 Cancelled</option>
                            <option value="disputed">⚠️ Disputed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 pb-6">
                {getDisplayRequests().length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 max-w-md mx-auto">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                                {activeTab === 'incoming'
                                    ? 'No incoming payment requests'
                                    : activeTab === 'outgoing'
                                        ? 'No outgoing payment requests'
                                        : 'No payment requests yet'
                                }
                            </h3>
                            <p className="text-gray-600 mb-8 leading-relaxed text-sm sm:text-base">
                                {activeTab === 'incoming'
                                    ? 'Payment requests from friends will appear here'
                                    : 'Get started by creating your first payment request'
                                }
                            </p>
                            <Link
                                href="/payments/create"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 sm:px-6 sm:py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                Create Payment Request
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {getDisplayRequests().map((request) => {
                            // Convert IDs to numbers for comparison
                            const currentUserId = parseInt(session.user.id);
                            const isPayer = request.payer_id === currentUserId;
                            const isPayee = request.payee_id === currentUserId;
                            const canAccept = isPayer && ['sent', 'pending'].includes(request.status);
                            const canReject = isPayer && ['sent', 'pending'].includes(request.status);
                            const canMarkPaid = isPayer && request.status === 'accepted';
                            const canConfirmPayment = isPayee && request.status === 'paid_pending_confirmation';
                            const needsAction = canAccept || canReject || canMarkPaid || canConfirmPayment;

                            return (
                                <div key={request.id} className={`bg-white rounded-2xl border-2 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 ${needsAction
                                    ? 'border-blue-200 ring-4 ring-blue-50 shadow-md'
                                    : 'border-gray-100 hover:border-gray-200'
                                    }`}>

                                    {needsAction && (
                                        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                            <div className="flex items-start sm:items-center gap-3">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                                                    <span className="text-white text-xs sm:text-sm">🔔</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-blue-800 font-medium leading-relaxed">
                                                    <span className="font-semibold">Action Required:</span> {
                                                        canConfirmPayment
                                                            ? `${request.payer_name} marked payment as sent`
                                                            : `${request.payee_name} requested a payment`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile-first layout */}
                                    <div className="flex flex-col">
                                        {/* Header section with direction indicator, title and amount */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                {/* Direction indicator */}
                                                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${request.payer_id === currentUserId
                                                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                                    : 'bg-gradient-to-br from-red-100 to-pink-100'
                                                    }`}>
                                                    {request.payer_id === currentUserId ? (
                                                        <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                    ) : (
                                                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                                                        {request.payee_id === currentUserId
                                                            ? `Request to ${request.payer_name}`
                                                            : `Request from ${request.payee_name}`
                                                        }
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="text-right ml-3">
                                                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                                                    {formatCurrency(request.amount, request.currency)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status badge - full width on mobile */}
                                        <div className="mb-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                                                {getStatusIcon(request.status)}
                                                {getContextualStatus(request, currentUserId)}
                                            </span>
                                        </div>

                                        {/* Content section */}
                                        <div className="space-y-3 mb-4">
                                            {request.bill_title && (
                                                <p className="text-sm text-gray-600 font-medium">
                                                    📋 From: {request.bill_title}
                                                </p>
                                            )}

                                            {request.description && (
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {request.description}
                                                </p>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    📅 Created: {formatDate(request.created_at)}
                                                </span>
                                                {request.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        ⏰ Due: {formatDate(request.due_date)}
                                                    </span>
                                                )}
                                                {request.completed_at && (
                                                    <span className="flex items-center gap-1">
                                                        ✅ Completed: {formatDate(request.completed_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons - mobile optimized */}
                                        <div className="space-y-3">
                                            {/* Accept/Decline buttons - stacked on mobile */}
                                            {canAccept && (
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => handleQuickAction(request.id, 'accepted')}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
                                                    >
                                                        ✅ Accept Payment Request
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickAction(request.id, 'rejected')}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
                                                    >
                                                        ❌ Decline Request
                                                    </button>
                                                </div>
                                            )}

                                            {/* Mark paid button */}
                                            {canMarkPaid && (
                                                <button
                                                    onClick={() => handleQuickAction(request.id, 'paid_pending_confirmation')}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
                                                >
                                                    💳 Mark as Paid
                                                </button>
                                            )}

                                            {/* Confirm/Dispute buttons - stacked on mobile */}
                                            {canConfirmPayment && (
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => handleQuickAction(request.id, 'completed')}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
                                                    >
                                                        ✅ Confirm Payment Received
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickAction(request.id, 'disputed')}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
                                                    >
                                                        ⚠️ Dispute Payment
                                                    </button>
                                                </div>
                                            )}

                                            {/* View details link */}
                                            <Link
                                                href={`/payments/${request.id}`}
                                                className="block w-full text-center px-4 py-3 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline border border-blue-200 rounded-lg hover:bg-blue-50 min-h-[44px] flex items-center justify-center"
                                            >
                                                📝 View Details & History →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav active="payments" />
        </div>
    );
};

export default PaymentsPage;
