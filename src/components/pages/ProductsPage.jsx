"use client";
import React, { useEffect, useState, useContext } from "react";
import PopupProducts from "./PopupProducts";
import AppContext from "../../context/AppContext";

const ProductsPage = () => {
  const {
    createProduct,
    products,
    productsLoading,
    productsPage,
    productsHasMore,
    fetchProductsPage,
    updateProduct,
    deleteProduct,
  } = useContext(AppContext);

  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchProductsPage(1);
  }, []);

  // Refresh Products
  const refreshProducts = async () => {
    setLocalLoading(true);
    await fetchProductsPage(1, true);
    setLocalLoading(false);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  // Form Submit (Add / Edit)
  const handleFormSubmit = async (data) => {
    setLocalLoading(true);
    if (editingProduct) {
      await updateProduct(editingProduct._id || editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setOpenForm(false);
    setEditingProduct(null);
    await fetchProductsPage(1, true);
    setLocalLoading(false);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  // Delete Product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setLocalLoading(true);
    await deleteProduct(id);

    // Pehle current page fetch karo
    await fetchProductsPage(productsPage, true);

    // Agar current page khali ho gaya aur page > 1 hai
    if (products.length === 1 && productsPage > 1) {
      // Pichle page fetch karo
      await fetchProductsPage(productsPage - 1, true);
    }

    setLocalLoading(false);
  };

  // ✅ Search Products
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      await fetchProductsPage(1, true);
      setIsSearchMode(false);
      return;
    }

    setLocalLoading(true);
    await fetchProductsPage(1, true, q);
    setIsSearchMode(true);
    setLocalLoading(false);
  };

  // ✅ Clear Search
  const handleClearSearch = async () => {
    setSearchQuery("");
    setIsSearchMode(false);
    await fetchProductsPage(1, true);
  };

  return (
    <div className="p-6">
      <PopupProducts
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Products Management
        </h1>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="px-3 py-2 border rounded-md pr-8"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-900 text-white rounded-md"
            >
              Search
            </button>

            <button
              onClick={refreshProducts}
              className="px-3 py-2 bg-gray-100 rounded-md"
            >
              Refresh
            </button>
          </div>

          <button
            onClick={() => setOpenForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg font-medium shadow-sm transition-all"
          >
            + Add Product
          </button>
        </div>
      </div>

      {isSearchMode && (
        <div className="mb-4 text-gray-600 text-sm">
          🔍 Found <span className="font-semibold">{products.length}</span>{" "}
          result{products.length !== 1 && "s"} for "
          <span className="font-medium">{searchQuery}</span>"
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          All Products
        </h2>

        {localLoading || productsLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-900 rounded-full"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id || product.id}
                  className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden bg-gray-50">
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

                  <div className="p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                      {product.name || "Untitled Product"}
                    </h3>

                    <p
                      className="text-sm text-blue-600 break-words mb-4 hover:underline cursor-pointer"
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
                        onClick={() => handleDelete(product._id || product.id)}
                        className="px-4 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isSearchMode && (
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => fetchProductsPage(productsPage - 1)}
                  disabled={productsPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-gray-700 font-medium">
                  Page {productsPage}
                </span>

                <button
                  onClick={() => fetchProductsPage(productsPage + 1)}
                  disabled={!productsHasMore}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
