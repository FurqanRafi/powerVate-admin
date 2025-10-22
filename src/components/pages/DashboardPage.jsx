import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";

export default function DashboardPage({setActivePage}) {
  const { dashboardDetails, users, fetchUsersPage } = useContext(AppContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribedUsers: 0,
    activeUsers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const data = await dashboardDetails();
        if (!mounted) return;
        setStats({
          totalUsers: data?.totalUsers ?? 0,
          subscribedUsers: data?.subscribedUsers ?? 0,
          activeUsers: data?.activeUsers ?? 0,
        });
      } catch (err) {
        console.error("Failed loading dashboard details:", err);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [dashboardDetails]);

  useEffect(() => {
    // load first page of users (assumes fetchUsersPage will populate `users` in context)
    let mounted = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        await fetchUsersPage?.(1);
        // recentUsers will be populated by the following effect when `users` updates
      } catch (err) {
        console.error("Failed loading users:", err);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [fetchUsersPage]);

  useEffect(() => {
    // whenever `users` in context changes, take top 5 as recent users
    if (!users || users.length === 0) {
      setRecentUsers([]);
      return;
    }
    // If users are already ordered by created date, slice first 5.
    // Otherwise sort by profile.created_at.seconds descending if available.
    const usersCopy = [...users];

    usersCopy.sort((a, b) => {
      const aTs = a?.profile?.created_at?.seconds ?? a?.created_at?.seconds ?? 0;
      const bTs = b?.profile?.created_at?.seconds ?? b?.created_at?.seconds ?? 0;
      return bTs - aTs;
    });

    setRecentUsers(usersCopy.slice(0, 5));
  }, [users]);

  const formatDate = (timestampOrValue) => {
    if (!timestampOrValue) return "N/A";

    // Firestore timestamp object?
    if (typeof timestampOrValue === "object") {
      if (typeof timestampOrValue.toDate === "function") {
        try {
          return timestampOrValue.toDate().toLocaleString();
        } catch {}
      }
      if (timestampOrValue.seconds) {
        return new Date(timestampOrValue.seconds * 1000).toLocaleString();
      }
    }

    // fallback for string / number
    try {
      return new Date(timestampOrValue).toLocaleString();
    } catch {
      return String(timestampOrValue);
    }
  };

  const handleViewAll = () => {
    // Navigate to dashboard (same route) but instruct parent to open Users tab
    setActivePage("users");
  };
  if(loadingStats){
    //circular loading 
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
      </div>
    )

  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Dashboard Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Total Users</p>
          <p className="text-3xl font-bold text-blue-900">
            {loadingStats ? "—" : stats.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Subscribed Users</p>
          <p className="text-3xl font-bold text-purple-900">
            {loadingStats ? "—" : stats.subscribedUsers.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Active Users</p>
          <p className="text-3xl font-bold text-green-900">
            {loadingStats ? "—" : stats.activeUsers.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Recent Users</h4>
          <button
            onClick={handleViewAll}
            className="text-sm px-3 py-1 border rounded text-blue-900 border-blue-200 hover:bg-blue-50"
          >
            View all
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="space-y-3">
            {recentUsers.map((u) => {
              const profile = u.profile ?? {};
              const name = profile.fullName || profile.nickname || u.fullName || "No name";
              const email = profile.email || u.email || "—";
              const created = profile.created_at ?? u.created_at ?? null;
              return (
                <div key={u.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="text-gray-800 font-medium">{name}</div>
                    <div className="text-gray-500 text-sm">{email}</div>
                  </div>
                  <div className="text-gray-500 text-sm">{formatDate(created)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
