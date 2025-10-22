"use client";

import React, { useState, useEffect } from "react";

export default function PopupDoctor({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    specialty: "",
  });

  // ✅ Function to format Firebase Timestamp (for "Joined On")
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ Fill form fields if editing a doctor
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullname: initialData.fullname || "",
        email: initialData.email || "",
        specialty: initialData.specialty || "",
        password: "", // never pre-fill password for security
      });
    } else {
      setFormData({
        fullname: "",
        email: "",
        password: "",
        specialty: "",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation (password optional if editing)
    if (!formData.fullname || !formData.email || !formData.specialty) {
      alert("Please fill in all required fields");
      return;
    }

    if (!initialData && !formData.password) {
      alert("Password is required for new doctors");
      return;
    }

    try {
      setLoading(true);

      // ✅ Don’t send password if left blank while editing
      const payload = { ...formData };
      if (initialData && !formData.password) {
        delete payload.password;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Error submitting doctor", err);
      alert("Failed to submit doctor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          {initialData ? "Edit Doctor" : "Add New Doctor"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="fullname"
            placeholder="Full Name"
            value={formData.fullname}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="password"
            name="password"
            placeholder={
              initialData
                ? "Enter new password (optional)"
                : "Password (required)"
            }
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            name="specialty"
            placeholder="Specialty"
            value={formData.specialty}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          {/* ✅ Show "Joined On" date only when editing */}
          {initialData && initialData.created_At && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium text-gray-800">Joined On: </span>
              {formatDate(initialData.created_At)}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
