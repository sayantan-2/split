import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronRight, UserPlus } from "lucide-react";
import BottomNav from "../../components/BottomNav";

const friends = [
    {
        id: 1,
        name: "Liam Carter",
        bills: 2,
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        id: 2,
        name: "Sophia Bennett",
        bills: 1,
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        id: 3,
        name: "Ethan Harper",
        bills: 3,
        avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
        id: 4,
        name: "Olivia Foster",
        bills: 1,
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
        id: 5,
        name: "Noah Parker",
        bills: 2,
        avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    },
    {
        id: 6,
        name: "Ava Mitchell",
        bills: 1,
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
];

export default function FriendsPage() {
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="md:ml-64">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 bg-white md:bg-gray-50">
                        <div className="md:block hidden" />
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Friends</h1>
                        <button className="p-2 sm:p-3 rounded-full hover:bg-gray-100 transition-colors shadow-sm bg-white border border-gray-200 md:bg-gray-100 md:border-gray-300">
                            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                        </button>
                    </div>

                    {/* Friends List */}
                    <div className="bg-white md:bg-gray-50 px-4 sm:px-6 lg:px-8">
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
                                    />
                                    <div className="flex-1">
                                        <div className="text-base sm:text-lg font-semibold text-gray-900">
                                            {friend.name}
                                        </div>
                                        <div className="text-gray-400 text-sm sm:text-base">
                                            {friend.bills} bill{friend.bills > 1 ? "s" : ""}
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
                                        />
                                        <div className="text-lg font-semibold text-gray-900 mb-1">
                                            {friend.name}
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            {friend.bills} bill{friend.bills > 1 ? "s" : ""}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Add Friend Button */}
                    <div className="px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 pt-4 bg-white md:bg-gray-50">
                        <button className="w-full md:max-w-md md:mx-auto flex items-center justify-center bg-gray-900 text-white font-semibold text-base sm:text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:bg-gray-800 transition-colors">
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            Add Friend
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}