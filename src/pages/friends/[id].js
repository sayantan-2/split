/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
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

const friend = {
    name: "Liam",
    username: "liam_123",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    currency: "USD", // Default currency
    summary: {
        amount: 12.5,
        status: "owed", // or "owed"
        currency: "USD",
    },
    history: [
        {
            label: "Dinner",
            date: "12/12/23",
            amount: -8.0,
            currency: "USD",
        },
        {
            label: "Movie Tickets",
            date: "12/10/23",
            amount: -4.5,
            currency: "USD",
        },
        {
            label: "Coffee",
            date: "12/05/23",
            amount: 2.5,
            currency: "EUR",
        },
        {
            label: "Coffee",
            date: "12/05/23",
            amount: 2.5,
            currency: "INR",
        },
    ],
};

export default function FriendDetail() {
    const { session, status } = useAuthRedirect();

    if (status === "loading") {
        return <AuthLoadingSpinner />;
    }

    if (!session) {
        return null; // Will redirect to signin
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
                    </div>

                    {/* History */}
                    <div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">History</div>
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
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}