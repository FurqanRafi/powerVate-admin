"use client";

import React, { useContext, useState } from "react";
import AppContext from "../../context/AppContext";
import { toast } from "react-toastify";

export default function PopupUser({ isOpen, onClose, onUserCreated }) {
  const { createUser, fetchUsersPage } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
      setLoading(true);

      // ✅ Step 1: Create the user
      const result = await createUser(formData);

      if (result.success) {
        toast.success("User created successfully!");

        // ✅ Step 2: Wait for users to reload before closing popup
        await fetchUsersPage(1, true);

        // ✅ Step 3: Close popup only after new data is visible
        onClose();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user", err);
      toast.error("Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New User</h2>

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
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
