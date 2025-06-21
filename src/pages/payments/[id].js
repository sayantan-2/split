import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthRedirect, AuthLoadingSpinner } from '@/lib/auth';
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    CreditCard,
    DollarSign,
    Calendar,
    User,
    Receipt,
    MessageSquare,
    Edit
} from 'lucide-react';
import Link from 'next/link';

const PaymentRequestDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const { session, status } = useAuthRedirect(); const [paymentRequest, setPaymentRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [settlements, setSettlements] = useState([]);

    const fetchPaymentRequest = useCallback(async () => {
        try {
            const response = await fetch(`/api/payments/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPaymentRequest(data.request);
                setSettlements(data.settlements || []);
            } else {
                router.push('/payments');
            }
        } catch (error) {
            console.error('Error fetching payment request:', error);
            router.push('/payments');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (session && id) {
            fetchPaymentRequest();
        }
    }, [session, id, fetchPaymentRequest]); const updatePaymentStatus = async (newStatus) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/payments/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                await fetchPaymentRequest(); // Refresh data
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert(`Failed to update payment status: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    }; const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
            case 'sent':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'accepted':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-gray-500" />;
            case 'disputed':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'sent':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'accepted':
                return 'bg-blue-50 text-blue-700 border-blue-200';
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }; const getStatusDescription = (status, isPayee) => {
        switch (status) {
            case 'sent':
                return isPayee ? 'You sent a request. Waiting for their response.' : 'You have a new payment request.';
            case 'accepted':
                return isPayee ? 'They agreed to pay. Waiting for them to mark as paid.' : 'You accepted. You can now mark this as paid.';
            case 'completed':
                return isPayee ? 'They marked this as paid.' : 'You marked this as paid.';
            case 'rejected':
                return isPayee ? 'They declined the request.' : 'You declined the request.';
            case 'cancelled':
                return isPayee ? 'You cancelled this request.' : 'They cancelled this request.';
            default:
                return `Status: ${status}`;
        }
    }; const getContextualStatus = (status, isPayee) => {
        switch (status) {
            case 'sent':
                return isPayee ? 'Sent' : 'Waiting for your response';
            case 'pending':
                return isPayee ? 'Pending' : 'Waiting for your response';
            case 'accepted':
                return isPayee ? 'They accepted' : 'You accepted';
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
        const message = status === "loading" ? "Authenticating..." : "Loading payment request...";
        return <AuthLoadingSpinner message={message} />;
    }

    if (!session || !paymentRequest) {
        return null;
    }
    // Workflow permissions
    const isPayer = paymentRequest.payer_id === session.user.id;
    const isPayee = paymentRequest.payee_id === session.user.id;

    // Workflow permissions
    const canAccept = isPayer && ['pending', 'sent'].includes(paymentRequest.status);
    const canReject = isPayer && ['pending', 'sent'].includes(paymentRequest.status);
    const canCancel = isPayee && ['pending', 'sent'].includes(paymentRequest.status);
    const canMarkPaid = isPayer && ['accepted'].includes(paymentRequest.status);
    const canDispute = ['completed'].includes(paymentRequest.status); // Anyone can dispute? adjust if needed

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Payment Request</h1>
                            <p className="text-sm text-gray-600">#{paymentRequest.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(paymentRequest.status)}
                            <div>                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(paymentRequest.status)}`}>
                                {getContextualStatus(paymentRequest.status, isPayee)}
                            </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">
                                {formatCurrency(paymentRequest.amount, paymentRequest.currency)}
                            </div>                            <div className="text-sm text-gray-600">
                                {getStatusDescription(paymentRequest.status, isPayee)}
                            </div>
                        </div>
                    </div>                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {canAccept && (
                            <button
                                onClick={() => updatePaymentStatus('accepted')}
                                disabled={actionLoading}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Accept Request
                            </button>
                        )}
                        {canMarkPaid && (
                            <button
                                onClick={() => updatePaymentStatus('completed')}
                                disabled={actionLoading}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                Mark as Paid
                            </button>
                        )}
                        {canReject && (
                            <button
                                onClick={() => updatePaymentStatus('rejected')}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Decline
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => updatePaymentStatus('cancelled')}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel Request
                            </button>
                        )}
                        {canDispute && (
                            <button
                                onClick={() => updatePaymentStatus('disputed')}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Dispute Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">From</div>
                                    <div className="text-gray-600">{paymentRequest.payer_name}</div>
                                    <div className="text-sm text-gray-500">{paymentRequest.payer_email}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">To</div>
                                    <div className="text-gray-600">{paymentRequest.payee_name}</div>
                                    <div className="text-sm text-gray-500">{paymentRequest.payee_email}</div>
                                </div>
                            </div>

                            {paymentRequest.bill_title && (
                                <div className="flex items-start gap-3">
                                    <Receipt className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Related Bill</div>
                                        <div className="text-gray-600">{paymentRequest.bill_title}</div>
                                        {paymentRequest.bill_total && (
                                            <div className="text-sm text-gray-500">
                                                Total: {formatCurrency(paymentRequest.bill_total, paymentRequest.currency)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Amount</div>
                                    <div className="text-gray-600">
                                        {formatCurrency(paymentRequest.amount, paymentRequest.currency)}
                                    </div>
                                    {paymentRequest.payment_method && (
                                        <div className="text-sm text-gray-500">
                                            Method: {paymentRequest.payment_method}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Created</div>
                                    <div className="text-gray-600">{formatDate(paymentRequest.created_at)}</div>
                                </div>
                            </div>

                            {paymentRequest.due_date && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Due Date</div>
                                        <div className="text-gray-600">{formatDate(paymentRequest.due_date)}</div>
                                    </div>
                                </div>
                            )}

                            {paymentRequest.completed_at && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Completed</div>
                                        <div className="text-gray-600">{formatDate(paymentRequest.completed_at)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {paymentRequest.description && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900 mb-2">Description</div>
                                    <div className="text-gray-600">{paymentRequest.description}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentRequest.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-start gap-3">
                                <Edit className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900 mb-2">Notes</div>
                                    <div className="text-gray-600">{paymentRequest.notes}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settlements (if any) */}
                {settlements.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settlement History</h2>
                        <div className="space-y-4">
                            {settlements.map((settlement) => (
                                <div key={settlement.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {formatCurrency(settlement.amount, settlement.currency)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                via {settlement.settlement_method}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(settlement.created_at)}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(settlement.status)}`}>
                                            {settlement.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back to Payments */}
                <div className="text-center">
                    <Link
                        href="/payments"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Payments
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentRequestDetail;
