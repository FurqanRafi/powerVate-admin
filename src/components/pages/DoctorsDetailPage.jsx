import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import Sidebar from "../../components/Sidebar";

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDoctorById, updateDoctor, deleteDoctor } = useContext(AppContext);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activePage, setActivePage] = useState("doctors");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    setLoading(true);
    const result = await getDoctorById(id);
    if (result.success) {
      setDoctor(result.doctor);
      setEditForm({
        fullname: result.doctor.fullname || "",
        email: result.doctor.email || "",
        phone: result.doctor.phone || "",
        specialty: result.doctor.specialty || "",
        experience: result.doctor.experience || "",
        qualifications: result.doctor.qualifications || "",
        patients: result.doctor.patients || 0, // ✅ Added patients
      });
    } else {
      navigate("/dashboard", { state: { activePage: "doctors" } });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const updates = {};
    Object.keys(editForm).forEach((key) => {
      if (editForm[key] !== (doctor?.[key] || "")) {
        updates[key] = editForm[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    const result = await updateDoctor(id, updates);
    if (result.success) {
      setIsEditing(false);
      await loadDoctor();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteDoctor(id);
    if (result.success) {
      navigate("/dashboard", { state: { activePage: "doctors" } });
    }
    setDeleting(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!doctor) {
    return loading ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
      </div>
    ) : (
      <div className="text-center text-gray-500 mt-20">Doctor not found</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="max-w-4xl flex-1 mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() =>
              navigate("/dashboard", { state: { activePage: "doctors" } })
            }
            className="text-blue-900 hover:text-blue-700 font-medium"
          >
            ← Back to Doctors
          </button>
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                >
                  Edit Doctor
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Doctor
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
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white ${
                    saving
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">
              {doctor.fullname || "Unknown Doctor"}
            </h1>
            <p className="text-blue-100 mt-1">{doctor.email}</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Personal Information
              </h3>
              <div className="space-y-4">
                <InfoField
                  label="Full Name"
                  name="fullname"
                  value={editForm.fullname}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <InfoField
                  label="Email"
                  name="email"
                  value={editForm.email}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <InfoField
                  label="Phone"
                  name="phone"
                  value={editForm.phone}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Joined On
                  </label>
                  <p className="text-gray-900">
                    {formatDate(doctor.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Professional Information
              </h3>
              <div className="space-y-4">
                <InfoField
                  label="Specialty"
                  name="specialty"
                  value={editForm.specialty}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <InfoField
                  label="Experience (years)"
                  name="experience"
                  value={editForm.experience}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <InfoField
                  label="Qualifications"
                  name="qualifications"
                  value={editForm.qualifications}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <InfoField
                  label="Patients"
                  name="patients"
                  value={editForm.patients}
                  isEditing={false} // ✅ Read-only
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
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
                  Delete Doctor
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <strong>{doctor.fullname}</strong>? This action cannot be
                  undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-4 py-2 rounded-lg text-white ${
                      deleting
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {deleting ? "Deleting..." : "Delete Doctor"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, name, value, isEditing, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      {isEditing ? (
        <input
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <p className="text-gray-900">{value || "N/A"}</p>
      )}
    </div>
  );
}
