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

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    setLoading(true);
    const result = await getDoctorById(id);
    if (result.success) {
      setDoctor(result.doctor);
      setEditForm({
        fullName: result.doctor.fullName || "",
        email: result.doctor.email || "",
        phone: result.doctor.phone || "",
        specialty: result.doctor.specialty || "",
        experience: result.doctor.experience || "",
        qualifications: result.doctor.qualifications || "",
      });
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.fullname]: e.target.value });
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

    const result = await updateDoctor(id, updates);
    if (result.success) {
      setIsEditing(false);
      await loadDoctor();
    }
  };

  const handleDelete = async () => {
    const result = await deleteDoctor(id);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
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
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg"
                >
                  Edit Doctor
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Delete Doctor
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{doctor.fullName || "-"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Full Name"
              name="fullName"
              value={editForm.fullName}
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
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Joined On
              </label>
              <p className="text-gray-900">{formatDate(doctor.created_At)}</p>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Doctor
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <strong>{doctor.fullName}</strong>? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Delete
                </button>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      ) : (
        <p className="text-gray-900">{value || "-"}</p>
      )}
    </div>
  );
}
