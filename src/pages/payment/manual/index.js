import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, X, Users, DollarSign } from 'lucide-react';
import { useAuthRedirect, AuthLoadingSpinner } from '@/lib/auth';

export default function ManualPaymentPage() {
    const router = useRouter();
    const { session, status } = useAuthRedirect();

    // Form state
    const [billName, setBillName] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [splitMethod, setSplitMethod] = useState('equal'); // equal, exact, percentage
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Split details for different methods
    const [exactAmounts, setExactAmounts] = useState({});
    const [percentages, setPercentages] = useState({});

    useEffect(() => {
        fetchFriends();
    }, []);

    if (status === "loading") {
        return <AuthLoadingSpinner />;
    }

    if (!session) {
        return null;
    }

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

    const toggleFriend = (friend) => {
        const isSelected = selectedFriends.some(f => f.id === friend.id);
        if (isSelected) {
            setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
            // Remove from split amounts/percentages
            const newExactAmounts = { ...exactAmounts };
            delete newExactAmounts[friend.id];
            setExactAmounts(newExactAmounts);

            const newPercentages = { ...percentages };
            delete newPercentages[friend.id];
            setPercentages(newPercentages);
        } else {
            setSelectedFriends([...selectedFriends, friend]);
        }
    };

    const updateExactAmount = (friendId, amount) => {
        setExactAmounts({
            ...exactAmounts,
            [friendId]: parseFloat(amount) || 0
        });
    };

    const updatePercentage = (friendId, percent) => {
        setPercentages({
            ...percentages,
            [friendId]: parseFloat(percent) || 0
        });
    };

    const calculateSplit = () => {
        const amount = parseFloat(billAmount) || 0;
        const totalPeople = selectedFriends.length + 1; // +1 for current user

        if (splitMethod === 'equal') {
            const perPerson = amount / totalPeople;
            return {
                currentUser: perPerson,
                friends: selectedFriends.reduce((acc, friend) => {
                    acc[friend.id] = perPerson;
                    return acc;
                }, {})
            };
        } else if (splitMethod === 'exact') {
            const friendsTotal = Object.values(exactAmounts).reduce((sum, amt) => sum + amt, 0);
            const currentUserAmount = amount - friendsTotal;
            return {
                currentUser: currentUserAmount,
                friends: exactAmounts
            };
        } else if (splitMethod === 'percentage') {
            const friendsPercentTotal = Object.values(percentages).reduce((sum, percent) => sum + percent, 0);
            const currentUserPercent = 100 - friendsPercentTotal;
            const currentUserAmount = (amount * currentUserPercent) / 100;

            const friendAmounts = {};
            Object.entries(percentages).forEach(([friendId, percent]) => {
                friendAmounts[friendId] = (amount * percent) / 100;
            });

            return {
                currentUser: currentUserAmount,
                friends: friendAmounts
            };
        }
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        if (!billName.trim() || !billAmount || selectedFriends.length === 0) {
            alert('Please fill in all required fields and select at least one friend.');
            return;
        }

        const splitData = calculateSplit();

        // Create bill data in same format as AI processing
        // Important: splitByShares.amount represents SHARES/PORTIONS, not dollar amounts
        let splitByShares;

        if (splitMethod === 'equal') {
            // Everyone gets 1 share each
            splitByShares = [
                {
                    userID: session.user.email || session.user.name || 'You',
                    amount: 1
                },
                ...selectedFriends.map(friend => ({
                    userID: friend.email || friend.name,
                    amount: 1
                }))
            ];
        } else if (splitMethod === 'exact') {
            // Convert dollar amounts to proportional shares
            const totalAmount = parseFloat(billAmount);
            const currentUserAmount = splitData.currentUser;

            splitByShares = [
                {
                    userID: session.user.email || session.user.name || 'You',
                    amount: currentUserAmount / totalAmount // Proportional share
                },
                ...selectedFriends.map(friend => ({
                    userID: friend.email || friend.name,
                    amount: (splitData.friends[friend.id] || 0) / totalAmount // Proportional share
                }))
            ];
        } else if (splitMethod === 'percentage') {
            // Convert percentages to proportional shares (0-1)
            const currentUserPercent = 100 - Object.values(percentages).reduce((sum, p) => sum + p, 0);

            splitByShares = [
                {
                    userID: session.user.email || session.user.name || 'You',
                    amount: currentUserPercent / 100
                },
                ...selectedFriends.map(friend => ({
                    userID: friend.email || friend.name,
                    amount: (percentages[friend.id] || 0) / 100
                }))
            ];
        }

        const billData = {
            payment: {
                id: Date.now().toString(),
                name: billName,
                currency: currency,
                description: `Manual bill entry`,
                paymentItems: [{
                    name: billName,
                    unitPrice: parseFloat(billAmount),
                    quantity: 1,
                    totalPrice: parseFloat(billAmount),
                    discountPercentage: 0,
                    taxPercentage: 0,
                    splitByShares: splitByShares
                }]
            }
        };

        setIsProcessing(true);
        try {
            // Store the result and redirect to output page
            localStorage.setItem('billData', JSON.stringify(billData));
            router.push('/output');
        } catch (error) {
            console.error('Processing error:', error);
            alert('Processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return <AuthLoadingSpinner message="Loading friends..." />;
    }

    const splitData = calculateSplit();

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Add Bill</h1>
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bill Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bill Description *
                                </label>
                                <input
                                    type="text"
                                    value={billName}
                                    onChange={(e) => setBillName(e.target.value)}
                                    placeholder="e.g., Dinner at Italian Restaurant"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Total Amount *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={billAmount}
                                            onChange={(e) => setBillAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="INR">INR</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Select Friends */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Split with Friends *
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">                                {friends.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No friends found. <Link href="/friends" className="text-blue-600 hover:underline">Add some friends</Link> to split bills.
                                </p>
                            ) : (
                                friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        onClick={() => toggleFriend(friend)}
                                        className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${selectedFriends.some(f => f.id === friend.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >                                            <Image
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=6366f1&color=fff`}
                                            alt={friend.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full mr-3"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{friend.name}</p>
                                            <p className="text-sm text-gray-500">@{friend.username}</p>
                                        </div>
                                        {selectedFriends.some(f => f.id === friend.id) && (
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            </div>
                        </div>

                        {/* Split Method */}
                        {selectedFriends.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    How do you want to split?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="equal"
                                            checked={splitMethod === 'equal'}
                                            onChange={(e) => setSplitMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <span>Split equally</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="exact"
                                            checked={splitMethod === 'exact'}
                                            onChange={(e) => setSplitMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <span>Enter exact amounts</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="percentage"
                                            checked={splitMethod === 'percentage'}
                                            onChange={(e) => setSplitMethod(e.target.value)}
                                            className="mr-3"
                                        />
                                        <span>Enter percentages</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Split Details */}
                        {selectedFriends.length > 0 && splitMethod !== 'equal' && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    {splitMethod === 'exact' ? 'Enter amounts:' : 'Enter percentages:'}
                                </h4>
                                <div className="space-y-3">
                                    {selectedFriends.map((friend) => (
                                        <div key={friend.id} className="flex items-center space-x-3">                                            <Image
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=6366f1&color=fff`}
                                            alt={friend.name}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                            <span className="flex-1 text-sm font-medium">{friend.name}</span>
                                            <div className="relative">
                                                {splitMethod === 'exact' && (
                                                    <>
                                                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={exactAmounts[friend.id] || ''}
                                                            onChange={(e) => updateExactAmount(friend.id, e.target.value)}
                                                            className="w-24 pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="0.00"
                                                        />
                                                    </>
                                                )}
                                                {splitMethod === 'percentage' && (
                                                    <div className="flex items-center">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            max="100"
                                                            value={percentages[friend.id] || ''}
                                                            onChange={(e) => updatePercentage(friend.id, e.target.value)}
                                                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="0"
                                                        />
                                                        <span className="ml-1 text-sm text-gray-500">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Current user's amount */}
                                    <div className="flex items-center space-x-3 border-t pt-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                                            </span>
                                        </div>
                                        <span className="flex-1 text-sm font-medium">You</span>
                                        <div className="text-sm font-medium text-gray-700">
                                            {splitMethod === 'exact' && (
                                                <span>${splitData?.currentUser?.toFixed(2) || '0.00'}</span>
                                            )}
                                            {splitMethod === 'percentage' && (
                                                <span>{(100 - Object.values(percentages).reduce((sum, p) => sum + p, 0)).toFixed(1)}%</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Split Preview */}
                        {selectedFriends.length > 0 && splitData && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Split Preview:</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>You:</span>
                                        <span className="font-medium">${splitData.currentUser?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedFriends.map((friend) => (
                                        <div key={friend.id} className="flex justify-between">
                                            <span>{friend.name}:</span>
                                            <span className="font-medium">${(splitData.friends[friend.id] || 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                                        <span>Total:</span>
                                        <span>${billAmount || '0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isProcessing || !billName.trim() || !billAmount || selectedFriends.length === 0}
                            className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            {isProcessing ? 'Processing...' : 'Create Bill Split'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
