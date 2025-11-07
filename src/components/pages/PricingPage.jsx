"use client";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";

const PricingPreview = () => {
  const totalPlans = 4;
  const [plans, setPlans] = useState([null, null, null, null]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [formData, setFormData] = useState({
    duration: "",
    price: "",
    customProducts: "",
  });

  const [fetching, setFetching] = useState(false); // Fetch loader
  const [savingIndex, setSavingIndex] = useState(null); // Button-level loader for save/delete

  // 🔹 Fetch Plans
  const fetchPlans = async () => {
    setFetching(true);
    try {
      const querySnapshot = await getDocs(collection(db, "pricingPlans"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const filledPlans = Array(totalPlans).fill(null);
      data.forEach((plan) => {
        if (plan.planNumber !== undefined && plan.planNumber < totalPlans) {
          filledPlans[plan.planNumber] = plan;
        }
      });
      setPlans(filledPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setFetching(false);
    }
  };

  // 🔹 Select plan
  const handleSelectPlan = (index) => {
    setSelectedIndex(index);
    const plan = plans[index];
    if (plan) {
      setFormData({
        duration: plan.duration,
        price: plan.price,
        customProducts: plan.customProducts,
      });
    } else {
      setFormData({ duration: "", price: "", customProducts: "" });
    }
  };

  // 🔹 Add/Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.duration || !formData.price || !formData.customProducts)
      return;

    setSavingIndex("save"); // Local save loader
    try {
      const currentPlan = plans[selectedIndex];
      if (currentPlan) {
        await updateDoc(doc(db, "pricingPlans", currentPlan.id), {
          duration: formData.duration,
          price: Number(formData.price),
          customProducts: Number(formData.customProducts),
          planNumber: selectedIndex,
        });
      } else {
        await addDoc(collection(db, "pricingPlans"), {
          duration: formData.duration,
          price: Number(formData.price),
          customProducts: Number(formData.customProducts),
          planNumber: selectedIndex,
        });
      }
      await fetchPlans();
      setSelectedIndex(null);
      setFormData({ duration: "", price: "", customProducts: "" });
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setSavingIndex(null);
    }
  };

  // 🔹 Delete
  const handleDelete = async (index) => {
    const plan = plans[index];
    if (!plan) return;
    if (!confirm(`Are you sure you want to delete ${plan.duration}?`)) return;

    setSavingIndex(index); // Local delete loader
    try {
      await deleteDoc(doc(db, "pricingPlans", plan.id));
      const updatedPlans = [...plans];
      updatedPlans[index] = null;
      setPlans(updatedPlans);
    } catch (error) {
      console.error("Error deleting plan:", error);
    } finally {
      setSavingIndex(null);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen MyContainer flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 uppercase ">
        Pricing Preview
      </h1>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        {plans.map((plan, i) => (
          <div
            key={i}
            className="bg-gradient-to-r from-blue-900 to-blue-700 border border-gray-700/30 rounded-lg p-6 text-center"
          >
            <h2 className="text-xl font-semibold mb-4 text-white">
              Plan {i + 1}
            </h2>
            {plan ? (
              <>
                <p className="text-2xl font-bold text-white mb-2">
                  ${plan.price}
                </p>
                <p className="text-sm text-white mb-4">
                  {plan.duration} + ${plan.customProducts} custom products
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleSelectPlan(i)}
                    className="bg-white text-blue-900 px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-200"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700"
                    disabled={savingIndex === i}
                  >
                    {savingIndex === i ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-200 text-sm">No data available</p>
            )}
          </div>
        ))}
      </div>

      {/* Buttons to select plan */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center mt-10">
        {[1, 2, 3, 4].map((num, i) => (
          <button
            key={i}
            onClick={() => handleSelectPlan(i)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              selectedIndex === i
                ? "bg-blue-900 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-blue-100"
            }`}
          >
            Plan {num}
          </button>
        ))}
      </div>

      {/* Form (only when plan selected) */}
      {selectedIndex !== null && (
        <div className="flex flex-col gap-4 p-6 rounded-lg border border-gray-700/30 shadow-md w-full lg:max-w-[70%] mx-auto ">
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <label className="text-gray-800 font-semibold">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              className="border border-gray-700/50 rounded-lg p-2"
              placeholder="e.g. 1 Month or 1 Year"
            />

            <label className="text-gray-800 font-semibold">Price</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="border border-gray-700/50 rounded-lg p-2"
              placeholder="Price"
            />

            <label className="text-gray-800 font-semibold">Custom Products</label>
            <input
              type="number"
              value={formData.customProducts}
              onChange={(e) =>
                setFormData({ ...formData, customProducts: e.target.value })
              }
              className="border border-gray-700/50 rounded-lg p-2"
              placeholder="Custom Products"
            />

            <button
              type="submit"
              disabled={savingIndex === "save"}
              className="bg-blue-900 w-[200px] text-white p-2 rounded-lg hover:bg-blue-800"
            >
              {savingIndex === "save" ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PricingPreview;
