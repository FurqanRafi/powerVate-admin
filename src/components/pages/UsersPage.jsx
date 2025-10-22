"use client";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import PopupUser from "./PopupUser";

export default function UsersPage() {
  const navigate = useNavigate();
  const {
    createUser,
    fetchUsersPage,
    users,
    usersLoading,
    usersPage,
    usersHasMore,
    goToUsersPage,
    fetchUserByName,
    fetchUserByDate,
  } = useContext(AppContext);

  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false); // 🔄 for manual refresh
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // 🔄 Fetch All Users
  const refreshUsers = async () => {
    setLoading(true);
    await fetchUsersPage(1, true);
    setLoading(false);
  };

  useEffect(() => {
    if (users.length === 0) {
      refreshUsers();
    }
  }, []);

  // 🔍 Search Function
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      return;
    }

    const allUsers = users;
    const results = allUsers.filter((user) =>
      user.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (results.length > 0) {
      setSearchResults(results);
      setIsSearchMode(true);
    } else {
      setSearchResults([]);
      setIsSearchMode(false);
      alert("No users found");
      setSearchQuery("");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > usersPage && !usersHasMore) return;
    goToUsersPage(newPage);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 📅 Filter by Date
  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      return alert("Please select both From and To dates");
    }

    const data = await fetchUserByDate(fromDate, toDate);

    if (data.success) {
      setIsSearchMode(true);
      setSearchResults(data.users);
    }
  };

  // ✅ Handle Form Submission
  const handleFormSubmit = async (data) => {
    setLoading(true);
    await createUser(data);
    setOpenForm(false);
    await refreshUsers();
  };

  return (
    <div className="p-6">
      {/* 🔹 Popup User Form */}
      <PopupUser
        isOpen={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleFormSubmit}
      />

      {/* 🔍 Search + Filter Section */}
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="px-4 py-2 border rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2 bg-blue-900 text-white rounded-full hover:bg-blue-800"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1 border rounded-full"
          />
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1 border rounded-full"
          />
          <button
            onClick={handleFilter}
            className="px-5 py-2 bg-blue-800 text-white rounded-full hover:bg-blue-700"
          >
            Filter
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Users Management</h3>
        <button
          onClick={() => setOpenForm(true)}
          className="px-5 py-2 bg-blue-900 text-white rounded-full hover:bg-blue-800"
        >
          Add New User
        </button>
      </div>

      {loading || usersLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(isSearchMode ? searchResults : users).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.profile?.fullName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.profile?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.profile?.profileSetup
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.profile?.profileSetup ? "Active" : "Pending"}
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

          {!isSearchMode && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(usersPage - 1)}
                disabled={usersPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">Page {usersPage}</span>
              <button
                onClick={() => handlePageChange(usersPage + 1)}
                disabled={!usersHasMore}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
