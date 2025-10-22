"use client";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import PopupDoctor from "./PopupDoctor";
import { Trash, Trash2, X } from "lucide-react";

export default function DoctorsPage() {
  const navigate = useNavigate();
  const { addDoctors, getAllDoctor, updateDoctor, deleteDoctor } =
    useContext(AppContext);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const refreshDoctors = async () => {
    setLoading(true);
    const res = await getAllDoctor();
    if (res.success) setDoctors(res.doctors);
    setLoading(false);
  };

  useEffect(() => {
    refreshDoctors();
  }, []);

  const handleFormSubmit = async (data) => {
    if (editingDoctor) {
      await updateDoctor(editingDoctor.id, data);
    } else {
      await addDoctors(data);
    }
    setOpenForm(false);
    setEditingDoctor(null);
    refreshDoctors();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      await deleteDoctor(id);
      refreshDoctors();
    }
  };

  return (
    <div className="p-6">
      <PopupDoctor
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingDoctor(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDoctor}
      />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Doctors Management</h3>
        <button
          onClick={() => {
            setOpenForm(true);
            setEditingDoctor(null);
          }}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Add New Doctor
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="relative bg-white rounded-lg shadow p-6"
            >
              {/* ❌ Delete Button in Top-Right */}
              <button
                onClick={() => handleDelete(doctor.id)}
                className="absolute top-6 right-6  text-red-500 hover:text-red-600 transition"
                title="Delete Doctor"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {doctor.fullname?.split(" ")[1]?.[0] ||
                    doctor.fullname?.[0] ||
                    "D"}
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-800">
                    {doctor.fullname}
                  </h4>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {doctor.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Patients:</span>{" "}
                  {doctor.patients}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/doctor-details/${doctor.id}`)}
                  className="flex-1 bg-blue-50 text-blue-900 py-2 rounded hover:bg-blue-100 transition text-sm"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setEditingDoctor(doctor);
                    setOpenForm(true);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
