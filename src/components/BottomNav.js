import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Home, Users, User, Plus, Camera, FileText, X, CreditCard } from "lucide-react";

export default function BottomNav({ active = "home" }) {
    const router = useRouter();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleNewPaymentClick = () => {
        setShowPaymentModal(true);
    };

    const handleScanReceiptClick = () => {
        setShowPaymentModal(false);
        router.push('/payment/new?receipt=true');
    }; const handleContinueWithoutReceiptClick = () => {
        setShowPaymentModal(false);
        router.push('/payment/manual');
    };
    return (
        <>            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 shadow-lg md:hidden">
                <div className="flex justify-between items-center px-2 py-2">
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

                    {/* Center Plus Button */}
                    <button
                        onClick={handleNewPaymentClick}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors mx-2"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    <Link href="/payments" className="flex flex-col items-center min-w-0 flex-1 py-1">
                        <CreditCard className={`w-5 h-5 transition-colors ${active === "payments" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-xs mt-1 transition-colors truncate ${active === "payments" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                            Payments
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

            {/* Payment Options Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">New Payment</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-3">
                            {/* Scan Receipt Option */}
                            <button
                                onClick={handleScanReceiptClick}
                                className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Camera className="w-5 h-5 mr-3" />
                                Scan Receipt
                            </button>

                            {/* Continue Without Receipt Option */}
                            <button
                                onClick={handleContinueWithoutReceiptClick}
                                className="w-full flex items-center justify-center bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <FileText className="w-5 h-5 mr-3" />
                                Continue without Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    </Link>                    <Link href="/account" className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${active === "account" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                        <User className="w-5 h-5 mr-3" />
                        Account
                    </Link>
                    <button
                        onClick={handleNewPaymentClick}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 w-full text-left ${active === "payment" ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        New Payment
                    </button>
                </div>
            </nav>
        </>
    );
}