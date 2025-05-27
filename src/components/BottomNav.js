import Link from "next/link";
import { Home, Users, Bell } from "lucide-react";

export default function BottomNav({ active = "home" }) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-md mx-auto flex justify-between px-8 py-2 z-10">
            <Link href="/" className="flex flex-col items-center">
                <Home className={`w-6 h-6 ${active === "home" ? "text-blue-600" : "text-gray-400"}`} />
                <span className={`text-xs mt-1 ${active === "home" ? "text-blue-600 font-medium" : "text-gray-400"}`}>Home</span>
            </Link>
            <Link href="/friends" className="flex flex-col items-center">
                <Users className={`w-6 h-6 ${active === "friends" ? "text-blue-600" : "text-gray-400"}`} />
                <span className={`text-xs mt-1 ${active === "friends" ? "text-blue-600 font-medium" : "text-gray-400"}`}>Friends</span>
            </Link>
            <Link href="/activity" className="flex flex-col items-center">
                <Bell className={`w-6 h-6 ${active === "activity" ? "text-blue-600" : "text-gray-400"}`} />
                <span className={`text-xs mt-1 ${active === "activity" ? "text-blue-600 font-medium" : "text-gray-400"}`}>Activity</span>
            </Link>
        </nav>
    );
}