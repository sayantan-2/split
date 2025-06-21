import React, { useState, useEffect } from 'react';
import { Receipt, ChevronDown, ChevronRight, Users, Send } from 'lucide-react';
import { useAuthRedirect, AuthLoadingSpinner } from '@/lib/auth';
import { useRouter } from 'next/router';

// TODO: check if this discount is applied correctly
const BillSplitter = () => {
    const router = useRouter();
    const { session, status } = useAuthRedirect();
    const [billData, setBillData] = useState(null);
    const [expandedUsers, setExpandedUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [sendingRequests, setSendingRequests] = useState(false);

    useEffect(() => {
        // Load bill data from localStorage
        const storedData = localStorage.getItem('billData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setBillData(parsedData);
            } catch (error) {
                console.error('Error parsing bill data:', error);
            }
        }
        setLoading(false);
    }, []);

    if (status === "loading" || loading) {
        const message = status === "loading" ? "Authenticating..." : "Loading bill data...";
        return <AuthLoadingSpinner message={message} />;
    }

    if (!session) {
        return null; // Will redirect to signin
    }

    if (!billData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No bill data found. Please go back and process a bill first.</p>
                </div>
            </div>
        );
    }

    // Generate consistent colors for users
    const generateUserColor = (userId) => {
        const colors = [
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-rose-50 text-rose-700 border-rose-200',
            'bg-emerald-50 text-emerald-700 border-emerald-200',
            'bg-purple-50 text-purple-700 border-purple-200',
            'bg-amber-50 text-amber-700 border-amber-200',
            'bg-cyan-50 text-cyan-700 border-cyan-200',
            'bg-pink-50 text-pink-700 border-pink-200',
            'bg-indigo-50 text-indigo-700 border-indigo-200'
        ];

        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const getCurrencySymbol = (currency) => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
        return symbols[currency] || currency;
    };

    const symbol = getCurrencySymbol(billData.payment.currency);

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        billData.payment.paymentItems.forEach(item => {
            subtotal += item.totalPrice;
            totalTax += (item.totalPrice * item.taxPercentage) / 100;
        }); return { subtotal, totalTax, total: subtotal + totalTax };
    };    // Send payment requests to all users
    const sendPaymentRequests = async () => {
        if (!session?.user) return;

        setSendingRequests(true);
        try {
            const userDetails = calculateUserDetails();
            const totals = calculateTotals();

            // Prepare participants data
            const participants = Object.entries(userDetails).map(([userId, details]) => ({
                userId: userId,
                total: details.total
            }));

            // Only proceed if there are other participants
            const otherParticipants = participants.filter(p => p.userId !== session.user.id && p.total > 0);
            if (otherParticipants.length === 0) {
                alert('No payment requests to send - you are the only one with charges.');
                return;
            }

            // Save bill and create payment requests
            const response = await fetch('/api/bills/save-and-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billData: {
                        payment: billData.payment,
                        totals: totals
                    },
                    participants: participants
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Successfully created bill and sent ${data.paymentRequests.length} payment requests!`);
                router.push('/payments');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create payment requests');
            }
        } catch (error) {
            console.error('Error sending payment requests:', error);
            alert(`Failed to send payment requests: ${error.message}`);
        } finally {
            setSendingRequests(false);
        }
    };// Calculate user details
    const calculateUserDetails = () => {
        const userDetails = {};

        billData.payment.paymentItems.forEach(item => {
            const totalShares = item.splitByShares.reduce((sum, share) => sum + share.amount, 0);

            // Calculate the full amount per share (including tax)
            const fullAmountWithTax = item.totalPrice * (1 + (item.taxPercentage || 0) / 100);
            const amountPerShare = fullAmountWithTax / totalShares;

            item.splitByShares.forEach(share => {
                if (share.amount === 0) return;

                if (!userDetails[share.userID]) {
                    userDetails[share.userID] = {
                        subtotal: 0,
                        tax: 0,
                        total: 0,
                        items: []
                    };
                }

                // Calculate user's share amounts
                const userTotalAmount = amountPerShare * share.amount;
                const userSubtotal = (item.totalPrice / totalShares) * share.amount;
                const userTax = userTotalAmount - userSubtotal;

                userDetails[share.userID].subtotal += userSubtotal;
                userDetails[share.userID].tax += userTax;
                userDetails[share.userID].total += userTotalAmount;

                userDetails[share.userID].items.push({
                    name: item.name,
                    shares: share.amount,
                    totalQuantity: item.quantity,
                    unitPrice: item.unitPrice,
                    userAmount: userTotalAmount,
                    isShared: item.splitByShares.filter(s => s.amount > 0).length > 1
                });
            });
        });

        return userDetails;
    };

    const totals = calculateTotals();
    const userDetails = calculateUserDetails();

    const toggleUser = (userId) => {
        setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    return (
        <div className="min-h-screen bg-gray-100 py-4 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Bill Receipt */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border">
                    {/* Header */}
                    <div className="bg-gray-900 text-white p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Receipt className="w-6 h-6 mr-2" />
                            <h1 className="text-xl font-bold">{billData.payment.name}</h1>
                        </div>
                        <p className="text-gray-300 text-sm">Bill #{billData.payment.id}</p>
                    </div>

                    {/* Items Section */}
                    <div className="p-6">
                        <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">ORDER DETAILS</h2>

                            {billData.payment.paymentItems.map((item, index) => (
                                <div key={index} className="mb-4 last:mb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {item.quantity || 0} × {symbol}{(item.unitPrice || 0).toFixed(2)}
                                                {(item.taxPercentage || 0) > 0 && ` (+${item.taxPercentage}% tax)`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                {symbol}{((item.totalPrice || 0) + ((item.totalPrice || 0) * (item.taxPercentage || 0)) / 100).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shared by tags */}
                                    <div className="flex flex-wrap gap-1 ml-0">
                                        {item.splitByShares.filter(share => share.amount > 0).map((share, i) => (
                                            <span key={i} className={`text-xs px-2 py-1 rounded-full border ${generateUserColor(share.userID)}`}>
                                                {share.userID} {share.amount > 1 && `(${share.amount}×)`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bill Total */}
                        <div className="border-b border-dashed border-gray-300 pb-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{symbol}{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>{symbol}{totals.totalTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                                    <span>TOTAL</span>
                                    <span>{symbol}{totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Split Details */}
                        <div className="mb-4">
                            <div className="flex items-center mb-4">
                                <Users className="w-5 h-5 text-gray-600 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">SPLIT BETWEEN {Object.keys(userDetails).length} PEOPLE</h2>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(userDetails).map(([userId, details]) => (
                                    <div key={userId} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleUser(userId)}
                                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${generateUserColor(userId)}`}>
                                                        {userId.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 capitalize">{userId}</div>
                                                        <div className="text-sm text-gray-500">{details.items.length} items</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-gray-900">{symbol}{details.total.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {symbol}{details.subtotal.toFixed(2)} + {symbol}{details.tax.toFixed(2)} tax
                                                        </div>
                                                    </div>
                                                    {expandedUsers[userId] ?
                                                        <ChevronDown className="w-5 h-5 text-gray-400" /> :
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    }
                                                </div>
                                            </div>
                                        </button>

                                        {expandedUsers[userId] && (
                                            <div className="border-t bg-gray-50 p-4">
                                                <div className="space-y-2">
                                                    {details.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center py-1">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {item.isShared ?
                                                                        `Your share: ${item.shares}/${item.totalQuantity}` :
                                                                        `Full portion: ${item.shares}×`
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {symbol}{item.userAmount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>                        {/* Payment Request Section */}
                        {session && Object.keys(userDetails).length > 1 && (
                            <div className="pt-4 border-t border-dashed border-gray-300">
                                <div className="text-center">
                                    <button
                                        onClick={sendPaymentRequests}
                                        disabled={sendingRequests}
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <Send className="w-5 h-5" />
                                        {sendingRequests ? 'Sending Payment Requests...' : 'Send Payment Requests'}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This will send payment requests to all participants
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center pt-4 border-t border-dashed border-gray-300">
                            <p className="text-xs text-gray-400">
                                Split verification: Individual totals sum to {symbol}{Object.values(userDetails).reduce((sum, user) => sum + user.total, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillSplitter;