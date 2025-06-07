import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

// Higher-order component to protect pages with authentication
export function withAuth(WrappedComponent) {
    return function AuthenticatedComponent(props) {
        const { data: session, status } = useSession();
        const router = useRouter();

        // Redirect to sign-in if not authenticated
        useEffect(() => {
            if (status === "loading") return; // Still loading
            if (!session) router.push("/auth/signin");
        }, [session, status, router]);

        if (status === "loading") {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            );
        }

        if (!session) {
            return null; // Will redirect to signin
        }

        // Pass session data as prop to the wrapped component
        return <WrappedComponent {...props} session={session} />;
    };
}

// Hook for authentication logic (alternative approach)
export function useAuthRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push("/auth/signin");
    }, [session, status, router]);

    return { session, status };
}

// Loading component for consistency
export function AuthLoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{message}</p>
            </div>
        </div>
    );
}
