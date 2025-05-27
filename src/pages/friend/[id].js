import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, TrendingUp, TrendingDown, History, ChevronRight } from 'lucide-react';

const SettleUpApp = () => {
    const [note, setNote] = useState('');

    // Dummy JSON data structure
    const settlementData = {
        user: {
            id: "user_001",
            name: "John Smith",
            initials: "JS",
            status: "active",
            avatar: null
        },
        balances: {
            youAreOwed: {
                amount: 125.50,
                currency: "USD",
                reason: "Dinner expenses & taxi fare"
            },
            youOwe: {
                amount: 85.25,
                currency: "USD",
                reason: "Movie tickets & snacks"
            }
        },
        transactions: [
            {
                id: "txn_001",
                type: "expense",
                amount: 45.00,
                currency: "USD",
                description: "Dinner at Italian restaurant",
                date: "2024-01-20",
                paidBy: "them"
            },
            {
                id: "txn_002",
                type: "expense",
                amount: 25.50,
                currency: "USD",
                description: "Taxi ride home",
                date: "2024-01-20",
                paidBy: "them"
            },
            {
                id: "txn_003",
                type: "expense",
                amount: 55.00,
                currency: "USD",
                description: "Concert tickets",
                date: "2024-01-18",
                paidBy: "them"
            },
            {
                id: "txn_004",
                type: "expense",
                amount: 32.00,
                currency: "USD",
                description: "Movie tickets",
                date: "2024-01-15",
                paidBy: "you"
            },
            {
                id: "txn_005",
                type: "expense",
                amount: 18.50,
                currency: "USD",
                description: "Popcorn and drinks",
                date: "2024-01-15",
                paidBy: "you"
            },
            {
                id: "txn_006",
                type: "expense",
                amount: 34.75,
                currency: "USD",
                description: "Lunch at cafe",
                date: "2024-01-12",
                paidBy: "you"
            }
        ],
        metadata: {
            lastUpdated: "2024-01-21T10:30:00Z",
            totalTransactions: 6,
            relationshipSince: "2023-08-15"
        }
    };

    // Calculate net balance
    const netBalance = settlementData.balances.youAreOwed.amount - settlementData.balances.youOwe.amount;
    const netBalanceAbs = Math.abs(netBalance);
    const isOwedToYou = netBalance > 0;

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen max-w-md mx-auto">
            {/* Header with glassmorphism effect */}
            <div className="bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-white/20 top-0 z-10">
                <button className="p-2 hover:bg-gray-100/60 rounded-xl transition-all duration-300 active:scale-95">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settle Up</h1>
                <button className="p-2 hover:bg-gray-100/60 rounded-xl transition-all duration-300 active:scale-95">
                    <MoreVertical className="w-5 h-5 text-gray-700" />
                </button>
            </div>

            {/* Profile Section with enhanced styling */}
            <div className="bg-gradient-to-b from-white to-gray-50/50 px-6 py-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/20 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-5 flex items-center justify-center shadow-2xl relative">
                        <div className="absolute inset-1 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-white tracking-wide">{settlementData.user.initials}</span>
                        </div>
                        {settlementData.user.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{settlementData.user.name}</h2>
                    <p className="text-gray-500 text-sm">
                        {settlementData.user.status === 'active' ? 'Active now' : 'Last seen recently'}
                    </p>
                </div>
            </div>

            {/* Net Balance Summary */}
            <div className="px-6 py-4">
                <div className={`rounded-2xl p-6 text-center ${isOwedToYou
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50'
                    }`}>
                    <p className="text-sm font-medium text-gray-600 mb-2">Net Balance</p>
                    <div className="flex items-center justify-center">
                        <span className={`text-3xl font-bold ${isOwedToYou ? 'text-green-700' : 'text-red-700'}`}>
                            {isOwedToYou ? '+' : '-'}${netBalanceAbs.toFixed(2)}
                        </span>
                        <span className={`text-sm ml-2 font-medium ${isOwedToYou ? 'text-green-600' : 'text-red-600'}`}>
                            {settlementData.balances.youAreOwed.currency}
                        </span>
                    </div>
                    <p className={`text-sm mt-2 ${isOwedToYou ? 'text-green-600' : 'text-red-600'}`}>
                        {isOwedToYou ? `${settlementData.user.name} owes you` : `You owe ${settlementData.user.name}`}
                    </p>
                </div>
            </div>

            {/* Settlement Cards with premium design */}
            <div className="px-6 py-4 space-y-5">
                {/* You are owed card */}
                <div className="group bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-300/10 rounded-full -translate-y-10 translate-x-10"></div>

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-green-600/80 mb-3 uppercase tracking-wide">You are owed</p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-green-700">
                                        ${settlementData.balances.youAreOwed.amount.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-green-600 ml-2 font-medium">
                                        {settlementData.balances.youAreOwed.currency}
                                    </span>
                                    <p className="text-xs text-green-600/70 mt-1">
                                        {settlementData.balances.youAreOwed.reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-green-500 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                </div>

                {/* You owe card */}
                <div className="group bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-300/10 rounded-full -translate-y-10 translate-x-10"></div>

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-medium text-red-600/80 mb-3 uppercase tracking-wide">You owe</p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <TrendingDown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-red-700">
                                        ${settlementData.balances.youOwe.amount.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-red-600 ml-2 font-medium">
                                        {settlementData.balances.youOwe.currency}
                                    </span>
                                    <p className="text-xs text-red-600/70 mt-1">
                                        {settlementData.balances.youOwe.reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-red-500 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                </div>
            </div>

            {/* View Transaction History with enhanced styling */}
            <div className="px-6 py-4">
                <button className="group flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-all duration-300 bg-blue-50/50 hover:bg-blue-100/70 rounded-xl p-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md group-hover:scale-105 transition-transform duration-300">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block">View Transaction History</span>
                        <span className="text-xs text-blue-500 block mt-1">
                            {settlementData.metadata.totalTransactions} transactions
                        </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
            </div>

            {/* Add Note Section with premium styling */}
            <div className="px-6 py-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add a note (optional)</h3>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="E.g., For dinner last night"
                        className="w-full p-6 text-base text-gray-700 placeholder-gray-400 resize-none bg-transparent border-none focus:outline-none focus:ring-0"
                        rows={4}
                    />
                    <div className="px-6 pb-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                        <p className="text-xs text-gray-400 mt-2">Max 100 characters</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettleUpApp;