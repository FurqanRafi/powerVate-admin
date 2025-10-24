"use client";
import React, { useEffect, useState } from "react";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUpload.js";
import { toast } from "react-toastify";

const PopupProducts = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
  });

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          imageUrl: initialData.imageUrl || "",
        });
      } else {
        setFormData({ name: "", imageUrl: "" });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // ✅ Cloudinary Upload
  const handleUpload = async (file) => {
    if (!file) return toast.warn("Please select an image first.");
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl)
      return toast.warn("Please fill all required fields.");
    await onSubmit(formData); // send { name, imageUrl } to backend
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {initialData ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 🔹 Image Preview Section */}
          <div className="flex flex-col items-center gap-2">
            {formData.imageUrl ? (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-60 h-40 object-cover rounded-lg border shadow-sm"
              />
            ) : (
              <div className="w-60 h-40 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg text-sm">
                No Image
              </div>
            )}
          </div>

          {/* 🔹 Upload Image */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-800">Product Image</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>

              <input
                type="text"
                placeholder="Image URL..."
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* 🔹 Product Name */}
          <div>
            <label className="block mb-1 font-medium text-gray-800">
              Product Name
            </label>
            <input
              type="text"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* 🔹 Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 ${
                uploading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {initialData
                ? loading
                  ? "Updating..."
                  : "Update"
                : loading
                ? "Creating..."
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupProducts;
