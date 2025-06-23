"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

interface PendingInvitation {
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
    inviterName: string;
}

interface ExpenseSplit {
    id: string;
    userId: string;
    amount: string;
    paid: boolean;
    userName: string;
    userEmail: string;
}

interface Expense {
    id: string;
    title: string;
    description: string | null;
    amount: string;
    currency: string;
    category: string | null;
    splitType: string;
    date: string;
    createdAt: string;
    paidByName: string;
    paidByEmail: string;
    paidById: string;
    splits: ExpenseSplit[];
}

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
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [addMemberLoading, setAddMemberLoading] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [editGroupName, setEditGroupName] = useState("");
    const [editGroupDescription, setEditGroupDescription] = useState("");
    const [settingsLoading, setSettingsLoading] = useState(false);    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);    const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseTitle, setExpenseTitle] = useState("");
    const [expenseDescription, setExpenseDescription] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);

    const fetchGroup = useCallback(async () => {
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
        }    }, [groupId, session?.user?.id, router]);    const fetchPendingInvitations = useCallback(async () => {
        if (!groupId) return;
        
        try {
            const response = await fetch(`/api/groups/${groupId}/invitations`);
            if (response.ok) {
                const data = await response.json();
                setPendingInvitations(data);
            }
        } catch (error) {
            console.error("Error fetching invitations:", error);
        }
    }, [groupId]);

    const fetchExpenses = useCallback(async () => {
        if (!groupId) return;
        
        try {
            const response = await fetch(`/api/groups/${groupId}/expenses`);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    }, [groupId]);

    useEffect(() => {        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated" && groupId) {
            fetchGroup();
            fetchPendingInvitations();
            fetchExpenses();
        }
    }, [status, groupId, router, fetchGroup, fetchPendingInvitations, fetchExpenses]);

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
    };    const handleSendInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);

        try {
            const response = await fetch(`/api/groups/${groupId}/invitations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: inviteEmail }),
            });

            const data = await response.json();            if (response.ok) {
                setInviteLink(data.inviteLink);
                setInviteEmail("");
                setShowInviteModal(false);
                setShowInviteSuccessModal(true);
                fetchPendingInvitations();
            } else {
                alert(data.error || "Failed to send invitation");
            }
        } catch (error) {
            console.error("Error sending invitation:", error);
            alert("Failed to send invitation");
        } finally {
            setInviteLoading(false);        }
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsLoading(true);

        try {
            const response = await fetch(`/api/groups/${groupId}/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editGroupName,
                    description: editGroupDescription,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setGroup(prev => prev ? { ...prev, name: data.name, description: data.description } : null);
                setShowSettingsModal(false);
                alert("Group updated successfully!");
            } else {
                alert(data.error || "Failed to update group");
            }
        } catch (error) {
            console.error("Error updating group:", error);
            alert("Failed to update group");
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/groups/${groupId}/settings`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.push("/groups");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to delete group");
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Failed to delete group");        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!group) return;
        
        setExpenseLoading(true);

        try {
            // Calculate equal splits for all group members
            const splitAmount = parseFloat(expenseAmount) / group.members.length;
            const splits = group.members.map(member => ({
                userId: member.id,
                amount: splitAmount.toFixed(2),
            }));

            const response = await fetch(`/api/groups/${groupId}/expenses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: expenseTitle,
                    description: expenseDescription,
                    amount: expenseAmount,
                    category: expenseCategory,
                    date: expenseDate,
                    splits,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowAddExpenseModal(false);
                setExpenseTitle("");
                setExpenseDescription("");
                setExpenseAmount("");
                setExpenseCategory("");
                setExpenseDate(new Date().toISOString().split('T')[0]);
                fetchExpenses();
            } else {
                alert(data.error || "Failed to create expense");
            }
        } catch (error) {
            console.error("Error creating expense:", error);
            alert("Failed to create expense");
        } finally {
            setExpenseLoading(false);
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
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Add Member
                                        </button>
                                        <button
                                            onClick={() => setShowInviteModal(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Invite Member
                                        </button>                                        <button
                                            onClick={() => {
                                                setEditGroupName(group.name);
                                                setEditGroupDescription(group.description || "");
                                                setShowSettingsModal(true);
                                            }}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Settings
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Members section */}
                    <div className="bg-white shadow rounded-lg mb-6">
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
                        </div>                    </div>

                    {/* Pending Invitations section */}
                    {userRole === "admin" && pendingInvitations.length > 0 && (
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Pending Invitations ({pendingInvitations.length})
                                </h2>
                                <div className="space-y-4">
                                    {pendingInvitations.map((invitation) => (
                                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-yellow-300 rounded-full flex items-center justify-center">
                                                    <span className="text-yellow-800 font-medium">
                                                        {invitation.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Invited by {invitation.inviterName} • 
                                                        Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}                    {/* Expenses section */}
                    <div className="mt-6 bg-white shadow rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Expenses ({expenses.length})
                                </h2>
                                <button
                                    onClick={() => setShowAddExpenseModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Add Expense
                                </button>
                            </div>
                            
                            {expenses.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No expenses yet. Add an expense to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {expenses.map((expense) => (
                                        <div key={expense.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-lg font-medium text-gray-900">{expense.title}</h3>
                                                        <span className="text-lg font-semibold text-green-600">
                                                            {expense.currency} {parseFloat(expense.amount).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {expense.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-sm text-gray-500">
                                                            Paid by {expense.paidByName} • {new Date(expense.date).toLocaleDateString()}
                                                            {expense.category && ` • ${expense.category}`}
                                                        </p>
                                                        <span className="text-xs text-gray-400">
                                                            {expense.splitType} split
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Show splits */}
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-xs font-medium text-gray-700">Split details:</p>
                                                        {expense.splits.map((split) => (
                                                            <div key={split.id} className="flex items-center justify-between text-xs text-gray-600">
                                                                <span>{split.userName}</span>
                                                                <span className={`${split.paid ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {expense.currency} {parseFloat(split.amount).toFixed(2)}
                                                                    {split.paid ? ' ✓' : ' ✗'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Member</h3>
                            <form onSubmit={handleSendInvitation}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter member's email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        The person will receive an email invitation to join the group.
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {inviteLoading ? "Inviting..." : "Send Invitation"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Group Settings</h3>
                            <form onSubmit={handleUpdateGroup}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter group name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editGroupName}
                                        onChange={(e) => setEditGroupName(e.target.value)}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>                                    <textarea
                                        placeholder="Enter group description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editGroupDescription}
                                        onChange={(e) => setEditGroupDescription(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={settingsLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        {settingsLoading ? "Saving..." : "Save Settings"}
                                    </button>
                                </div>
                            </form>
                            
                            {userRole === "admin" && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Delete this group permanently. This action cannot be undone.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleDeleteGroup}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                    >
                                        Delete Group
                                    </button>
                                </div>
                            )}
                        </div>                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {showAddExpenseModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Expense</h3>
                            <form onSubmit={handleCreateExpense}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter expense title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={expenseTitle}
                                        onChange={(e) => setExpenseTitle(e.target.value)}
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={expenseAmount}
                                        onChange={(e) => setExpenseAmount(e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Enter expense description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={expenseDescription}
                                        onChange={(e) => setExpenseDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>                                    <select
                                        title="Expense category"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={expenseCategory}
                                        onChange={(e) => setExpenseCategory(e.target.value)}
                                    >
                                        <option value="">Select category</option>
                                        <option value="Food">Food</option>
                                        <option value="Transportation">Transportation</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Entertainment">Entertainment</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date
                                    </label>                                    <input
                                        type="date"
                                        title="Expense date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={expenseDate}
                                        onChange={(e) => setExpenseDate(e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        <strong>Split Type:</strong> Equal split among all members ({group?.members.length} people)
                                    </p>
                                    {expenseAmount && group && (
                                        <p className="text-sm text-green-600 mt-1">
                                            Each person owes: ${(parseFloat(expenseAmount) / group.members.length).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddExpenseModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={expenseLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {expenseLoading ? "Creating..." : "Create Expense"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Success Modal */}
            {showInviteSuccessModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center mt-4">Invitation Sent!</h3>
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                The invitation has been sent. Share this link with the person you want to invite:
                            </p>
                            <div className="mb-4">
                                <div className="flex">                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteLink}
                                        title="Invitation link"
                                        aria-label="Invitation link"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(inviteLink);
                                            alert("Link copied to clipboard!");
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setShowInviteSuccessModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
