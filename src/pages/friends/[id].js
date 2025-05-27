/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { ArrowLeft, Receipt, CreditCard, Home, User, FileText } from "lucide-react";
import BottomNav from "../../components/BottomNav";

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
    return (
        <div className="bg-gray-50 min-h-screen max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-8 pb-4 bg-white">
                <Link href="/friends" className="p-2 rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </Link>
                {/* <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center -ml-8">{friend.name}</h1> */}
                <div className="w-8" /> {/* Spacer for symmetry */}
            </div>

            {/* Avatar & Name */}
            <div className="flex flex-col items-center mt-4 mb-6">
                <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-32 h-32 rounded-full object-cover mb-4"
                />
                <div className="text-2xl font-bold text-gray-900">{friend.name}</div>
                <div className="text-gray-400 text-lg">@{friend.username}</div>
            </div>

            {/* Summary */}
            <div className="px-4 mb-8">
                <div className="text-xl font-bold text-gray-900 mb-2">Summary</div>
                <div className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-4 mb-2">
                    <div className="bg-gray-100 rounded-xl p-3 mr-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(friend.summary.amount, friend.summary.currency)}
                        </div>
                        <div className={`text-base ${friend.summary.status === "owe" ? "text-red-500" : "text-green-500"}`}>
                            {friend.summary.status === "owe"
                                ? `You owe ${friend.name}`
                                : `${friend.name} owes you`}
                        </div>
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="px-4">
                <div className="text-xl font-bold text-gray-900 mb-2">History</div>
                <div className="space-y-4">
                    {friend.history.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center bg-white rounded-2xl px-4 py-4"
                        >
                            <div className="bg-gray-100 rounded-xl p-3 mr-4">
                                <FileText className="w-7 h-7 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-900">{item.label}</div>
                                <div className="text-gray-400 text-base">{item.date}</div>
                            </div>
                            <div
                                className={`text-lg font-semibold ${item.amount < 0 ? "text-red-500" : "text-green-500"
                                    }`}
                            >
                                {item.amount < 0 ? "-" : "+"}
                                {formatCurrency(Math.abs(item.amount), item.currency)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}