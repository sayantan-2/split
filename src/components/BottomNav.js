import Link from "next/link";
import { Home, Users, User, Plus } from "lucide-react";

export default function BottomNav({ active = "home" }) {
    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 shadow-lg md:hidden">
                <div className="flex justify-between items-center px-4 py-2">
                    <Link href="/" className="flex flex-col items-center min-w-0 flex-1 py-1">
                        <Home className={`w-5 h-5 transition-colors ${active === "home" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-xs mt-1 transition-colors truncate ${active === "home" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                            Home
                        </span>
                    </Link>
                    <Link href="/friends" className="flex flex-col items-center min-w-0 flex-1 py-1">
                        <Users className={`w-5 h-5 transition-colors ${active === "friends" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-xs mt-1 transition-colors truncate ${active === "friends" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                            Friends
                        </span>
                    </Link>
                    <Link href="/account" className="flex flex-col items-center min-w-0 flex-1 py-1">
                        <User className={`w-5 h-5 transition-colors ${active === "account" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-xs mt-1 transition-colors truncate ${active === "account" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                            Account
                        </span>
                    </Link>
                </div>
            </nav>

            {/* Desktop/Tablet Side Navigation */}
            <nav className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-64 md:bg-white md:border-r md:border-gray-100 md:shadow-lg md:z-10 md:flex md:flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-800">Split App</h1>
                </div>
                <div className="flex-1 py-6">
                    <Link href="/" className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${active === "home" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                        <Home className="w-5 h-5 mr-3" />
                        Home
                    </Link>
                    <Link href="/friends" className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${active === "friends" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                        <Users className="w-5 h-5 mr-3" />
                        Friends
                    </Link>
                    <Link href="/account" className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${active === "account" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                        <User className="w-5 h-5 mr-3" />
                        Account
                    </Link>
                    <Link href="/output" className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${active === "payment" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                        <Plus className="w-5 h-5 mr-3" />
                        New Payment
                    </Link>
                </div>
            </nav>
        </>
    );
}