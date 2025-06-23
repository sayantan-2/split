"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

interface Member {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: "admin" | "member";
    joinedAt: string;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    createdBy: string;
    createdAt: string;
    members: Member[];
}

export default function GroupPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { groupId } = router.query;
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [addMemberLoading, setAddMemberLoading] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [userRole, setUserRole] = useState<"admin" | "member" | null>(null); const fetchGroup = useCallback(async () => {
        if (!groupId) return;

        try {
            const response = await fetch(`/api/groups/${groupId}`);
            if (response.ok) {
                const data = await response.json();
                setGroup(data.group);

                // Find current user's role
                const currentUser = data.group.members.find((member: Member) => member.id === session?.user?.id);
                setUserRole(currentUser?.role || null);
            } else if (response.status === 404) {
                router.push("/groups");
            }
        } catch (error) {
            console.error("Error fetching group:", error);
        } finally {
            setLoading(false);
        }
    }, [groupId, session?.user?.id, router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated" && groupId) {
            fetchGroup();
        }
    }, [status, groupId, router, fetchGroup]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddMemberLoading(true);

        try {
            const response = await fetch(`/api/groups/${groupId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: memberEmail, role: "member" }),
            });

            if (response.ok) {
                setShowAddMemberModal(false);
                setMemberEmail("");
                fetchGroup(); // Refresh the group data
            } else {
                const error = await response.json();
                alert(error.error || "Failed to add member");
            }
        } catch (error) {
            console.error("Error adding member:", error);
            alert("Failed to add member");
        } finally {
            setAddMemberLoading(false);
        }
    };    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) {
            return;
        }

        try {
            const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchGroup(); // Refresh the group data
            } else {
                const error = await response.json();
                alert(error.error || "Failed to remove member");
            }
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Failed to remove member");
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group? You will lose access to all group data.")) {
            return;
        }

        try {
            const response = await fetch(`/api/groups/${groupId}/leave`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Redirect to groups page after leaving
                router.push("/groups");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to leave group");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave group");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session || !group) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/dashboard" className="text-xl font-semibold text-indigo-600">
                                Splitwise Clone
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/groups" className="text-gray-700 hover:text-gray-900">
                                Groups
                            </Link>
                            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                                Dashboard
                            </Link>
                            <span className="text-gray-700">Welcome, {session.user?.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Group header */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-medium text-xl">
                                            {group.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                                        {group.description && (
                                            <p className="text-gray-600">{group.description}</p>
                                        )}
                                    </div>
                                </div>
                                {userRole === "admin" && (
                                    <button
                                        onClick={() => setShowAddMemberModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Add Member
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Members section */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Members ({group.members.length})
                            </h2>
                            <div className="space-y-4">
                                {group.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-gray-700 font-medium">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.role === "admin"
                                                    ? "bg-indigo-100 text-indigo-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {member.role}
                                            </span>
                                            {userRole === "admin" && member.id !== session.user?.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}                                            {member.id === session.user?.id && userRole !== "admin" && (
                                                <button
                                                    onClick={handleLeaveGroup}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Leave Group
                                                </button>
                                            )}
                                            {member.id === session.user?.id && userRole === "admin" && (
                                                <button
                                                    onClick={handleLeaveGroup}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Leave Group
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for expenses */}
                    <div className="mt-6 bg-white shadow rounded-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Expenses</h2>
                            <div className="text-center py-8">
                                <p className="text-gray-500">No expenses yet. This feature will be implemented in the next step.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Member</h3>
                            <form onSubmit={handleAddMember}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter member's email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={memberEmail}
                                        onChange={(e) => setMemberEmail(e.target.value)}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        The person must already have an account to be added.
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddMemberModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addMemberLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {addMemberLoading ? "Adding..." : "Add Member"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
