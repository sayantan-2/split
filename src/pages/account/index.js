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
        <div className="bg-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="md:ml-64">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
                        <button
                            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                        </button>
                        <div className="md:block hidden" />
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Account</h1>
                        <div className="w-10 sm:w-12 md:hidden" />
                    </div>

                    {/* Profile */}
                    <div className="flex flex-col items-center mt-4 sm:mt-6 mb-6 sm:mb-8 relative">
                        <Image
                            src="https://randomuser.me/api/portraits/women/45.jpg"
                            alt="Sophia Chen"
                            width={128}
                            height={128}
                            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button className="absolute right-1/3 sm:right-1/4 md:right-1/3 top-20 sm:top-28 md:top-32 bg-blue-600 rounded-full p-2 sm:p-3 border-4 border-white shadow-lg hover:bg-blue-700 transition-colors">
                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-4">Sophia Chen</div>
                        <div className="text-gray-400 text-base sm:text-lg">@sophia_chen</div>
                    </div>

                    {/* Settings */}
                    <div>
                        <div className="text-gray-500 font-semibold text-xs sm:text-sm mb-3 sm:mb-4 mt-4 uppercase tracking-wide">Settings</div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Notifications</span>
                                <ToggleSwitch checked={notifications} onChange={() => setNotifications(!notifications)} />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Language</span>
                                <span className="text-gray-400 mr-2 text-sm sm:text-base">English</span>
                                <ChevronRight />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Currency</span>
                                <span className="text-gray-400 mr-2 text-sm sm:text-base">USD</span>
                                <ChevronRight />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Dark Mode</span>
                                <ToggleSwitch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                            </div>
                        </div>

                        {/* Support */}
                        <div className="text-gray-500 font-semibold text-xs sm:text-sm mb-3 sm:mb-4 mt-6 sm:mt-8 uppercase tracking-wide">Support</div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Help Center</span>
                                <ChevronRight />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Contact Us</span>
                                <ChevronRight />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Terms of Service</span>
                                <ChevronRight />
                            </div>
                            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                </div>
                                <span className="flex-1 text-gray-700 font-medium text-base sm:text-lg">Privacy Policy</span>
                                <ChevronRight />
                            </div>
                        </div>
                    </div>

                    {/* Log Out Button */}
                    <div className="mt-6 sm:mt-8">
                        <button className="w-full md:max-w-sm md:mx-auto flex items-center justify-center bg-white text-red-500 font-semibold text-base sm:text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:bg-red-50 hover:shadow-md transition-all">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="account" />
        </div>
    );
}