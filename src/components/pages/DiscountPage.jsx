import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function DiscountPage() {
  const { 
    getDiscount, 
    createOrUpdateDiscount, 
    toggleDiscountStatus, 
    deleteDiscount 
  } = useAppContext();

  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discountValue, setDiscountValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDiscount();
  }, []);

  const loadDiscount = async () => {
    setLoading(true);
    const result = await getDiscount();
    if (result.success && result.discount) {
      setDiscount(result.discount);
      setDiscountValue(result.discount.discount.toString());
    } else {
      setDiscount(null);
      setDiscountValue('');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value < 0 || value > 100) {
      alert('Please enter a valid discount between 0 and 100');
      return;
    }

    setSaving(true);
    const result = await createOrUpdateDiscount(value);
    if (result.success) {
      await loadDiscount();
    }
    setSaving(false);
  };

  const handleToggle = async () => {
    if (!discount) return;
    
    setSaving(true);
    const result = await toggleDiscountStatus(!discount.isActive);
    if (result.success) {
      await loadDiscount();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteDiscount();
    if (result.success) {
      setShowDeleteModal(false);
      await loadDiscount();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Discount Management</h3>
        <p className="text-gray-600 mt-1">Manage application-wide discount settings</p>
      </div>

      {/* Main Discount Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="space-y-6">
          {/* Discount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="Enter discount percentage"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">%</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !discountValue}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {discount ? 'Update' : 'Save'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter a value between 0 and 100
            </p>
          </div>

          {/* Current Discount Display */}
          {discount && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Current Discount</h4>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Discount</p>
                    <p className="text-4xl font-bold text-blue-900">{discount.discount}%</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                      discount.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                    discount.isActive
                      ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {discount.isActive ? 'Deactivate Discount' : 'Activate Discount'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={saving}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* No Discount Message */}
          {!discount && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No discount configured</p>
              <p className="text-gray-500 text-sm mt-1">Enter a discount percentage above to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-blue-900 mb-1">How it works</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Only one discount can be active at a time</li>
              <li>• Discount applies application-wide when activated</li>
              <li>• You can update the discount value anytime</li>
              <li>• Deactivate to temporarily disable without deleting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Discount</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the current discount? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete Discount'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}