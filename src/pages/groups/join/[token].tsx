import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface InvitationDetails {
  groupName: string;
  groupDescription: string;
  inviterName: string;
  expiresAt: string;
}

export default function JoinGroup() {
  const { status } = useSession();
  const router = useRouter();
  const { token } = router.query;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true); const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchInvitationDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/invitation-details?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data);
      } else {
        setError(data.error || "Invalid invitation");
      }
    } catch {
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (status === "authenticated" && token) {
      fetchInvitationDetails();
    }
  }, [status, token, router, fetchInvitationDetails]);

  const handleJoinGroup = async () => {
    setJoining(true);
    setError("");

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/groups/${data.group.id}`);
        }, 2000);
      } else {
        setError(data.error || "Failed to join group");
      }
    } catch {
      setError("An error occurred while joining the group");
    } finally {
      setJoining(false);
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

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Invalid Invitation</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Successfully Joined!</h2>
            <p className="mt-2 text-sm text-gray-600">
              You have successfully joined the group. Redirecting to the group page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Group</h2>

          {invitation && (
            <div className="text-left mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {invitation.groupName}
              </h3>
              {invitation.groupDescription && (
                <p className="text-gray-600 mb-4">{invitation.groupDescription}</p>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  You&apos;ve been invited by <span className="font-medium">{invitation.inviterName}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Invitation expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join Group"}
            </button>

            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>        </div>
      </div>
    </div>
  );
}

// This prevents static generation and forces server-side rendering
export async function getServerSideProps() {
    return {
        props: {}, // will be passed to the page component as props
    };
}
