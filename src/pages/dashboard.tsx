import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold">Splitwise Clone</h1>
                        </div>            <div className="flex items-center space-x-4">
                            <Link href="/groups" className="text-gray-700 hover:text-gray-900">
                                Groups
                            </Link>
                            <span className="text-gray-700">Welcome, {session.user?.name}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="text-sm text-gray-900">{session.user?.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="text-sm text-gray-900">{session.user?.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                    <dd className="text-sm text-gray-900 font-mono">{session.user?.id}</dd>
                                </div>
                            </dl>
                        </div>
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-900">🎉 Group Management Ready!</h4>
                            <p className="text-sm text-green-700 mt-1">
                                Group management system is now implemented. You can create groups, add members, and manage group settings.
                            </p>
                            <div className="mt-3">
                                <Link
                                    href="/groups"
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                >
                                    Go to Groups
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900">✅ Phase 1 Complete</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Authentication system is set up and working correctly. Group management is now ready!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
