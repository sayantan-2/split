import React, { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, Clock, CheckCircle, ArrowUpRight, ArrowDownLeft, Receipt, Users } from "lucide-react";
import BottomNav from "../components/BottomNav";
import Link from "next/link";
import { useAuthRedirect, AuthLoadingSpinner } from "@/lib/auth";

export default function HomePage() {
  const { session, status } = useAuthRedirect();
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOwed: 0,
    totalOwe: 0,
    pendingRequests: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch recent payment requests
      const paymentsResponse = await fetch('/api/payments/requests?limit=5');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.requests || []);

        // Calculate stats
        const requests = paymentsData.requests || [];
        const totalOwed = requests
          .filter(r => r.payee_id === session.user.id && ['pending', 'sent'].includes(r.status))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const totalOwe = requests
          .filter(r => r.payer_id === session.user.id && ['pending', 'sent'].includes(r.status))
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const pendingRequests = requests
          .filter(r => ['pending', 'sent'].includes(r.status)).length;

        setStats({ totalOwed, totalOwe, pendingRequests });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  if (status === "loading" || loading) {
    const message = status === "loading" ? "Authenticating..." : "Loading dashboard...";
    return <AuthLoadingSpinner message={message} />;
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return `${symbols[currency] || currency}${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {session.user.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">Track your bills and payments</p>
            </div>
            <Link
              href="/payment/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Bill
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">You&apos;re Owed</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalOwed)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">You Owe</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalOwe)}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <ArrowUpRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingRequests}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/payment/new"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors mb-2">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Scan Receipt</span>
            </Link>

            <Link
              href="/payment/manual"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors mb-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Manual Entry</span>
            </Link>

            <Link
              href="/payments/create"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors mb-2">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Request Payment</span>
            </Link>

            <Link
              href="/friends"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-3 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-colors mb-2">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Add Friends</span>
            </Link>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              href="/payments"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600 mb-4">Start by creating a bill or payment request</p>
              <Link
                href="/payment/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Bill
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((payment) => (
                <Link
                  key={payment.id}
                  href={`/payments/${payment.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${payment.payer_id === session.user.id ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                      {payment.payer_id === session.user.id ? (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {payment.payer_id === session.user.id
                          ? `Payment to ${payment.payee_name}`
                          : `Payment from ${payment.payer_name}`
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}