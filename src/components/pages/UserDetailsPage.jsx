import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import Sidebar from "../../components/Sidebar";
import DashboardPage from "../../components/pages/DashboardPage";
import UsersPage from "../../components/pages/UsersPage";
import DoctorsPage from "../../components/pages/DoctorsPage";
import DiscountPage from "../../components/pages/DiscountPage";
import SettingsPage from "../../components/pages/SettingsPage";

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, updateUser, deleteUser } = useAppContext();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activePage, setActivePage] = useState("users");
  const [adminData, setAdminData] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");

    if (!token || !data) {
      navigate("/");
      return;
    }

    setAdminData(JSON.parse(data));
  }, [navigate]);
  useEffect(() => {
    if (adminData) {
      loadUser();
    }
  }, [id, adminData]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "users":
        return <UsersPage />;
      case "doctors":
        return <DoctorsPage />;
      case "discount":
        return <DiscountPage />;

      case "settings":
        return <SettingsPage adminData={adminData} />;

      default:
        return <DashboardPage />;
    }
  };
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/user-details/")) {
      setActivePage("users");
    }
  }, []);

  if (!adminData) {
    return null;
  }

  const loadUser = async () => {
    setLoading(true);
    const result = await getUserById(id);
    if (result.success) {
      setUser(result.user);
      setEditForm({
        fullName: result.user.profile?.fullName || "",
        email: result.user.profile?.email || "",
        phone: result.user.profile?.phone || "",
        nickname: result.user.profile?.nickname || "",
        age: result.user.profile?.age || "",
        gender: result.user.profile?.gender || "",
        weight: result.user.profile?.weight || "",
        height: result.user.profile?.height || "",
        workoutGoal: result.user.profile?.workoutGoal || "",
        activityLevel: result.user.profile?.activityLevel || "",
      });
    } else {
      navigate("/dashboard", {
        state: {
          activePage: "users",
        },
      });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    const updates = {};
    Object.keys(editForm).forEach((key) => {
      if (editForm[key] !== (user.profile?.[key] || "")) {
        updates[key] = editForm[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    const result = await updateUser(id, updates);
    if (result.success) {
      setIsEditing(false);
      await loadUser();
    }
  };
  const handleDelete = async () => {
    const result = await deleteUser(id);
    if (result.success) {
      navigate("/dashboard", {
        state: {
          activePage: "users",
        },
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  //   if (loading) {
  //     return (
  //       <div className="flex items-center justify-center min-h-screen">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  //       </div>
  //     );
  //   }

  if (!user) {
    return loading ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : (
        <div className="max-w-4xl flex-1 mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                navigate("/dashboard", {
                  state: {
                    activePage: "users",
                    fromUserDetails: true,
                  },
                });
              }}
              className="text-blue-900 hover:text-blue-700 font-medium"
            >
              ← Back to Users
            </button>
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Details Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">
                {user.profile?.fullName || "N/A"}
              </h1>
              <p className="text-blue-100 mt-1">
                {user.profile?.email || "N/A"}
              </p>
            </div>

            <div className="p-6">
              {/* Status Badges */}
              <div className="flex gap-3 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.profile?.profileSetup
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.profile?.profileSetup
                    ? "Profile Complete"
                    : "Profile Pending"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.profile?.subscription
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.profile?.subscription
                    ? "Subscribed User"
                    : "Unsubscribed User"}
                </span>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    Personal Information
                  </h3>

                  <div className="space-y-4">
                    <InfoField
                      label="Full Name"
                      value={editForm.fullName}
                      name="fullName"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Nickname"
                      value={editForm.nickname}
                      name="nickname"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Email"
                      value={editForm.email}
                      name="email"
                      type="email"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Phone"
                      value={editForm.phone}
                      name="phone"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Age"
                      value={editForm.age}
                      name="age"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Gender"
                      value={editForm.gender}
                      name="gender"
                      type="select"
                      options={["Male", "Female", "Other"]}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Fitness Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    Fitness Information
                  </h3>

                  <div className="space-y-4">
                    <InfoField
                      label="Weight"
                      value={editForm.weight}
                      name="weight"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Height"
                      value={editForm.height}
                      name="height"
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Workout Goal"
                      value={editForm.workoutGoal}
                      name="workoutGoal"
                      type="select"
                      options={[
                        "Lose Weight",
                        "Gain Muscle",
                        "Stay Fit",
                        "Improve Endurance",
                      ]}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Activity Level"
                      value={editForm.activityLevel}
                      name="activityLevel"
                      type="select"
                      options={["Beginner", "Intermediate", "Advanced"]}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Joined Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(user.profile?.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete User
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete{" "}
                    <strong>{user.profile?.fullName}</strong>? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  name,
  type = "text",
  options = [],
  isEditing,
  onChange,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      {isEditing ? (
        type === "select" ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      ) : (
        <p className="text-gray-900">{value || "N/A"}</p>
      )}
    </div>
  );
}
