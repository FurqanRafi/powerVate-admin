"use client";

import React, { useContext, useState } from "react";
import AppContext from "../../context/AppContext";

export default function popupUser({ isOpen, onClose, onSubmit }) {
  const { createUser } = useContext(AppContext);
  if (!isOpen) return null; // ✅ popup hide logic

  const [loading, setloading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value.trim(),
    };

    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setloading(true);
      await createUser(formData);
      form.reset(); // optional
      onClose();
    } catch (err) {
      console.error("Error creating user", err);
    } finally {
      setloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <h2 className="text-lg font-semibold mb-4">User Form</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            className="w-full border rounded px-3 py-2"
          />

          {/* Buttons */}
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
              {loading ? "Saving...." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
