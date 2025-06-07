/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Receipt, CreditCard, Home, User, FileText } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuthRedirect, AuthLoadingSpinner } from "../../lib/auth";

// Currency formatting utility
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export default function FriendDetail() {
    const { session, status } = useAuthRedirect();
    const router = useRouter();
    const { id } = router.query; // This will be either username or id
    const [friend, setFriend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session && id) {
            fetchFriendData();
        }
    }, [session, id]);

    const fetchFriendData = async () => {
        try {
            setLoading(true);
            // Try to fetch by username first
            const response = await fetch(`/api/friends/${id}`);

            if (response.ok) {
                const data = await response.json();
                setFriend(data.friend);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch friend data');
            }
        } catch (error) {
            console.error('Error fetching friend data:', error);
            setError('Failed to fetch friend data');
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return <AuthLoadingSpinner />;
    }

    if (!session) {
        return null; // Will redirect to signin
    }

    if (error) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="md:ml-64">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
                        <div className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
                            <Link href="/friends" className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200">
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                            </Link>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Friend Details</h1>
                            <div className="w-10 sm:w-12" />
                        </div>
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg mb-2">Error</div>
                            <div className="text-gray-500 text-sm">{error}</div>
                        </div>
                    </div>
                </div>
                <BottomNav active="friends" />
            </div>
        );
    }

    if (!friend) {
        return <AuthLoadingSpinner />;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="md:ml-64">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
                        <Link href="/friends" className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200">
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Friend Details</h1>
                        <div className="w-10 sm:w-12" /> {/* Spacer for symmetry */}
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center mt-4 sm:mt-6 mb-6 sm:mb-8">
                        <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mb-4 border-4 border-white shadow-lg"
                        />
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">{friend.name}</div>
                        <div className="text-gray-400 text-base sm:text-lg">@{friend.username}</div>
                    </div>

                    {/* Summary */}
                    <div className="mb-6 sm:mb-8">
                        <div className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Summary</div>
                        <div className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-6 py-4 sm:py-6">
                            <div className="bg-gray-100 rounded-xl p-3 mr-4">
                                <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                                    {formatCurrency(friend.summary.amount, friend.summary.currency)}
                                </div>
                                <div className={`text-sm sm:text-base ${friend.summary.status === "owe" ? "text-red-500" : "text-green-500"}`}>
                                    {friend.summary.status === "owe"
                                        ? `You owe ${friend.name}`
                                        : `${friend.name} owes you`}
                                </div>
                            </div>
                        </div>
                    </div>                    {/* History */}
                    <div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">History</div>
                        {friend.history && friend.history.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                                {friend.history.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-6 py-4 sm:py-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="bg-gray-100 rounded-xl p-3 mr-4">
                                            <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-base sm:text-lg font-semibold text-gray-900">{item.label}</div>
                                            <div className="text-gray-400 text-sm sm:text-base">{item.date}</div>
                                        </div>
                                        <div
                                            className={`text-base sm:text-lg font-semibold ${item.amount < 0 ? "text-red-500" : "text-green-500"
                                                }`}
                                        >
                                            {item.amount < 0 ? "-" : "+"}
                                            {formatCurrency(Math.abs(item.amount), item.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-base">No shared expenses yet</div>
                                <div className="text-gray-500 text-sm mt-1">Start by creating a bill together!</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}