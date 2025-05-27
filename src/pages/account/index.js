import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Bell,
    Globe,
    DollarSign,
    Moon,
    HelpCircle,
    Mail,
    FileText,
    Shield,
    Pencil,
} from "lucide-react";
import BottomNav from "../../components/BottomNav";
import { useRouter } from "next/router";

// ToggleSwitch component for slider-style toggles
function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`relative w-11 h-6 flex items-center rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-gray-200"
                }`}
            aria-pressed={checked}
        >
            <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

// ChevronRight icon
function ChevronRight() {
    return (
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

export default function AccountPage() {
    const [notifications, setNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const router = useRouter();

    return (
        <div className="bg-gray-50 min-h-screen max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-8 pb-4 bg-white">
                <button
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center -ml-8">Account</h1>
                <div className="w-8" />
            </div>
            {/* Profile */}
            <div className="flex flex-col items-center mt-4 mb-6 relative">
                <Image
                    src="https://randomuser.me/api/portraits/women/45.jpg"
                    alt="Sophia Chen"
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
                />
                <button className="absolute right-1/3 top-28 bg-blue-600 rounded-full p-2 border-4 border-white shadow-lg">
                    <Pencil className="w-5 h-5 text-white" />
                </button>
                <div className="text-2xl font-bold text-gray-900 mt-4">Sophia Chen</div>
                <div className="text-gray-400 text-lg">@sophia_chen</div>
            </div>

            {/* Settings */}
            <div className="px-6">
                <div className="text-gray-500 font-semibold text-sm mb-2 mt-4">SETTINGS</div>
                <div className="space-y-2">
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <Bell className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Notifications</span>
                        <ToggleSwitch checked={notifications} onChange={() => setNotifications(!notifications)} />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <Globe className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Language</span>
                        <span className="text-gray-400 mr-2">English</span>
                        <ChevronRight />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Currency</span>
                        <span className="text-gray-400 mr-2">USD</span>
                        <ChevronRight />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <Moon className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Dark Mode</span>
                        <ToggleSwitch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                    </div>
                </div>

                {/* Support */}
                <div className="text-gray-500 font-semibold text-sm mb-2 mt-6">SUPPORT</div>
                <div className="space-y-2">
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <HelpCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Help Center</span>
                        <ChevronRight />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Contact Us</span>
                        <ChevronRight />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Terms of Service</span>
                        <ChevronRight />
                    </div>
                    <div className="flex items-center bg-white rounded-xl px-4 py-3">
                        <div className="bg-gray-100 rounded-xl p-2 mr-4">
                            <Shield className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="flex-1 text-gray-700 font-medium">Privacy Policy</span>
                        <ChevronRight />
                    </div>
                </div>
            </div>

            {/* Log Out Button */}
            <div className="px-4 mt-8">
                <button className="w-full bg-white text-red-500 font-semibold text-lg py-4 rounded-2xl shadow hover:bg-red-50 transition">
                    Log Out
                </button>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="account" />
        </div>
    );
}