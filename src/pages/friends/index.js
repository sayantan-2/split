import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronRight, UserPlus, X, Plus, Check, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuthRedirect, AuthLoadingSpinner } from "@/lib/auth";

export default function FriendsPage() {
    const { session, status } = useAuthRedirect();
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]); const [searchLoading, setSearchLoading] = useState(false);

    // Fetch friends data
    useEffect(() => {
        if (session) {
            fetchFriends();
            fetchFriendRequests();
        }
    }, [session]);

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/friends');
            if (response.ok) {
                const data = await response.json();
                setFriends(data.friends);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const response = await fetch('/api/friends/requests');
            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const addFriend = async (userId) => {
        try {
            const response = await fetch('/api/friends/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ friendId: userId }),
            });

            if (response.ok) {
                alert('Friend request sent!');
                // Remove from search results or update status
                setSearchResults(prev =>
                    prev.map(user =>
                        user.id === userId
                            ? { ...user, friendshipStatus: 'pending' }
                            : user
                    )
                );
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Failed to send friend request');
        }
    };

    const handleFriendRequest = async (friendshipId, action) => {
        try {
            const response = await fetch('/api/friends/requests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ friendshipId, action }),
            });

            if (response.ok) {
                if (action === 'accept') {
                    fetchFriends(); // Refresh friends list
                }
                fetchFriendRequests(); // Refresh requests
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to handle friend request');
            }
        } catch (error) {
            console.error('Error handling friend request:', error);
            alert('Failed to handle friend request');
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        searchUsers(query);
    };

    if (status === "loading" || loading) {
        return <AuthLoadingSpinner />;
    }

    if (!session) {
        return null; // Will redirect to signin
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="md:ml-64">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 bg-white md:bg-gray-50">
                        <div className="md:block hidden" />
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                            Friends
                        </h1>                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition-colors shadow-sm bg-white border border-gray-200 md:bg-gray-100 md:border-gray-300"
                        >
                            {showSearch ? (
                                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                            ) : (
                                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                            )}
                        </button>                    </div>

                    {/* Search Interface */}
                    {showSearch && (
                        <div className="bg-white md:bg-gray-50 px-4 sm:px-6 lg:px-8 pb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users by name or username..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                                {searchLoading && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm max-h-64 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
                                            <div className="flex items-center">
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addFriend(user.id)}
                                                disabled={user.friendshipStatus === 'pending'}
                                                className="flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {user.friendshipStatus === 'pending' ? (
                                                    <>
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        Sent
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Friend Requests */}
                    {friendRequests.length > 0 && (
                        <div className="bg-white md:bg-gray-50 px-4 sm:px-6 lg:px-8 pb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Friend Requests</h2>
                            <div className="space-y-3">
                                {friendRequests.map((request) => (
                                    <div key={request.friendshipId} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center">
                                            <Image
                                                src={request.avatar}
                                                alt={request.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-full object-cover mr-3"
                                            />                                            <div>
                                                <div className="font-semibold text-gray-900">{request.name}</div>
                                                <div className="text-sm text-gray-500">@{request.username}</div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleFriendRequest(request.friendshipId, 'accept')}
                                                className="flex items-center px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleFriendRequest(request.friendshipId, 'reject')}
                                                className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}                    {/* Friends List */}
                    <div className="bg-white md:bg-gray-50 px-4 sm:px-6 lg:px-8">
                        {friends.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-lg mb-2">No friends yet</div>
                                <div className="text-gray-500 text-sm">Start by searching for people to add as friends!</div>
                            </div>
                        ) : (
                            <>
                                {/* Mobile List Layout */}
                                <div className="md:hidden">
                                    {friends.map((friend) => (
                                        <Link
                                            key={friend.id}
                                            href={`/friends/${friend.id}`}
                                            className="flex items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            <Image
                                                src={friend.avatar}
                                                alt={friend.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover mr-3 sm:mr-4"
                                            />                                            <div className="flex-1">
                                                <div className="text-base sm:text-lg font-semibold text-gray-900">
                                                    {friend.name}
                                                </div>
                                                <div className="text-gray-400 text-sm sm:text-base">
                                                    @{friend.username}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                        </Link>
                                    ))}
                                </div>

                                {/* Desktop Grid Layout */}
                                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 py-4">
                                    {friends.map((friend) => (
                                        <Link
                                            key={friend.id}
                                            href={`/friends/${friend.id}`}
                                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <Image
                                                    src={friend.avatar}
                                                    alt={friend.name}
                                                    width={64}
                                                    height={64}
                                                    className="w-16 h-16 rounded-full object-cover mb-4 group-hover:scale-105 transition-transform"
                                                />                                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                                    {friend.name}
                                                </div>
                                                <div className="text-gray-500 text-sm mb-2">
                                                    @{friend.username}
                                                </div>
                                                <div className="text-gray-400 text-xs">
                                                    {friend.bills} bill
                                                    {friend.bills > 1 ? "s" : ""}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>{/* Add Friend Button */}
                    <div className="px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 pt-4 bg-white md:bg-gray-50">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="w-full md:max-w-md md:mx-auto flex items-center justify-center bg-gray-900 text-white font-semibold text-base sm:text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:bg-gray-800 transition-colors"
                        >
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            {showSearch ? 'Close Search' : 'Add Friend'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}