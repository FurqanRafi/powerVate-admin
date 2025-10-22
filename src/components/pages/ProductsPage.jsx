"use client";

import React, { useContext, useEffect, useState } from "react";
import PopupProducts from "./PopupProducts";
import AppContext from "../../context/AppContext";

const ProductsPage = () => {
  const { createProduct, getAllProducts, updateProduct, deleteProduct } =
    useContext(AppContext);

  const [products, setProducts] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Centralized function to fetch all products
  const refreshProducts = async () => {
    setLoading(true);
    const res = await getAllProducts();
    if (res.success) setProducts(res.products);
    setLoading(false);
  };

  // ✅ Fetch products once on mount
  useEffect(() => {
    refreshProducts();
  }, []);

  // ✅ Handle Add / Update
  const handleFormSubmit = async (data) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }

    setOpenForm(false);
    setEditingProduct(null);
    refreshProducts();
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      refreshProducts();
    }
  };

  return (
    <div className="p-6">
      {/* Popup Form */}
      <PopupProducts
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Products Management
        </h1>
        <button
          onClick={() => setOpenForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg font-medium shadow-sm transition-all"
        >
          + Add Product
        </button>
      </div>

      {/* Product List Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          All Products
        </h2>

        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Image Section */}
                <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-[95%] h-[95%] rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No Image</span>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                    {product.name || "Untitled Product"}
                  </h3>

                  <p
                    className="text-sm text-blue-600 break-words mb-3 hover:underline cursor-pointer"
                    title={product.imageUrl}
                  >
                    {product.imageUrl ? (
                      <a
                        href={product.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {product.imageUrl.slice(0, 35)}...
                      </a>
                    ) : (
                      "No image URL"
                    )}
                  </p>

                  {/* Buttons */}
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setOpenForm(true);
                      }}
                      className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
