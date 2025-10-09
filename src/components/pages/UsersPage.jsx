import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function UsersPage() {
  const navigate = useNavigate();
  const { 
    users, 
    usersLoading, 
    usersPage, 
    usersHasMore, 
    goToUsersPage,
    fetchUsersPage
  } = useAppContext();

  useEffect(() => {
    if (users.length === 0) {
      fetchUsersPage(1);
    }
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > usersPage && !usersHasMore) return;
    goToUsersPage(newPage);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Users Management</h3>
        <div className="text-sm text-gray-600">
          Page {usersPage} • {users.length} users
        </div>
      </div>

      {usersLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.profile?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.profile?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.profile?.profileSetup
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.profile?.profileSetup ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.profile?.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => navigate(`/user-details/${user.id}`)}
                        className="text-blue-900 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(usersPage - 1)}
              disabled={usersPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {usersPage}</span>
            <button
              onClick={() => handlePageChange(usersPage + 1)}
              disabled={!usersHasMore}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}