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
        <div className="bg-gray-50 min-h-screen max-w-md mx-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-8 pb-4 bg-white">
                <div />
                <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
                <button className="p-2 rounded-full hover:bg-gray-100 transition">
                    <Search className="w-6 h-6 text-gray-900" />
                </button>
            </div>

            {/* Friends List */}
            <div className="flex-1 bg-white">
                {friends.map((friend) => (
                    <Link
                        key={friend.id}
                        href={`/friends/${friend.id}`}
                        className="flex items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <Image
                            src={friend.avatar}
                            alt={friend.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div className="flex-1">
                            <div className="text-lg font-semibold text-gray-900">
                                {friend.name}
                            </div>
                            <div className="text-gray-400 text-base">
                                {friend.bills} bill{friend.bills > 1 ? "s" : ""}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                ))}
            </div>

            {/* Add Friend Button */}
            <div className="px-4 pb-24 pt-2 bg-gray-50">
                <button className="w-full flex items-center justify-center bg-gray-900 text-white font-semibold text-lg py-4 rounded-full shadow-lg hover:bg-gray-800 transition">
                    <UserPlus className="w-6 h-6 mr-2" />
                    Add Friend
                </button>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="friends" />
        </div>
    );
}