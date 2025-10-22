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
    fetchUserByDate,
    users,
    usersLoading,
    usersPage,
    setUsersPage,
    fetchUserByName,
    usersHasMore,
    goToUsersPage,
  } = useContext(AppContext);

  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const refreshUsers = async () => {
    setLoading(true);
    await fetchUsersPage(1, true);
    setLoading(false);
    setIsSearchMode(false);
    setSearchQuery("");
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // const handleSearch = async () => {
  //   const q = searchQuery.trim();
  //   if (!q) {
  //     setIsSearchMode(false);
  //     await fetchUsersPage(1, true);
  //     return;
  //   }
  //   const results = users.filter((user) =>
  //     user.profile?.fullName?.toLowerCase().includes(q.toLowerCase())
  //   );
  //   setSearchResults(results);
  //   setIsSearchMode(true);
  // };
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setIsSearchMode(false);
      await fetchUsersPage(1, true);
      return;
    }

    setLoading(true);
    const results = await fetchUserByName(q); // ✅ pure Firestore se fetch karega
    if (results && results.length > 0) {
      setSearchResults(results);
      setIsSearchMode(true);
    } else {
      setSearchResults([]);
      setIsSearchMode(true);
    }
    setLoading(false);
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setFromDate("");
    setToDate("");
    await fetchUsersPage(1, true);
  };

  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      return alert("Please select both From and To dates");
    }
    setLoading(true);
    const data = await fetchUserByDate(fromDate, toDate);
    setLoading(false);
    if (data.success) {
      setIsSearchMode(true);
      setSearchResults(data.users);
    } else {
      alert("No users found in this date range");
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

  // ✅ Handle Form Submission
  const handleFormSubmit = async (data) => {
    setLoading(true);
    await createUser(data);
    setOpenForm(false);
    await refreshUsers();
  };

  return (
    <div className="p-6">
      <PopupUser
        isOpen={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleFormSubmit}
      />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>

        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="px-3 py-2 border rounded-md pr-8"
              />

              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-900 text-white rounded-md"
            >
              Search
            </button>

            <button
              onClick={refreshUsers}
              className="px-3 py-2 bg-gray-100 rounded-md"
            >
              Refresh
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              />
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFilter();
                  }
                }}
                className="px-3 py-1 border rounded-md text-sm"
              />
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700"
              >
                Filter
              </button>
            </div>

            {/* ➕ Add User Button */}
            <button
              onClick={() => setOpenForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg font-medium shadow-sm transition-all"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      {/* 🔎 Search Results Count */}
      {isSearchMode && (
        <div className="mb-4 text-gray-600 text-sm">
          🔍 Found <span className="font-semibold">{searchResults.length}</span>{" "}
          result{searchResults.length !== 1 && "s"} for{" "}
          <span className="font-medium">
            {searchQuery ? `"${searchQuery}"` : "selected date range"}
          </span>
          {/* cross button */}
          <button
            onClick={handleClearSearch}
            className="ml-2 text-red-400 hover:text-gray-600"
            title="Clear search"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🔹 Table Section */}
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
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(usersPage - 1)}
                disabled={usersPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-gray-700 font-medium">
                Page {usersPage}
              </span>

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
