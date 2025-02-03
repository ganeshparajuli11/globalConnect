import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../sidebar/Sidebar";
import { XCircle, Trash2 } from "lucide-react"; // Using Trash2 for delete icon
import "../category/category.css"
const AllCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Fetch all categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/category/all-admin"
        );
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // ===============================
  // Create Category Functions
  // ===============================
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewCategory({ name: "" });
  };

  const handleCategoryChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required.");
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/category/create",
        newCategory,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories([...categories, response.data.category]);
      closeCreateDialog();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // ===============================
  // Delete Category Functions
  // ===============================
  const openDeleteDialog = (categoryId) => {
    setCategoryToDelete(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCategoryToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const token = localStorage.getItem("access_token");

    try {
      await axios.delete(
        `http://localhost:3000/api/category/delete/${categoryToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(
        categories.filter((category) => category._id !== categoryToDelete)
      );
      closeDeleteDialog();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // ===============================
  // Toggle Category Active Status
  // ===============================
  const handleToggleCategory = async (categoryId) => {
    try {
      await axios.patch(
        `http://192.168.18.105:3000/api/category/status/${categoryId}`
      );
      setCategories(
        categories.map((category) =>
          category._id === categoryId
            ? { ...category, active: !category.active }
            : category
        )
      );
    } catch (error) {
      console.error("Error toggling category status:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-300">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-4">All Categories</h1>

        <button
          onClick={openCreateDialog}
          className="bg-blue-500 text-white p-2 rounded mb-4"
        >
          Create Category
        </button>

        {/* Categories Table */}
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Active Status</th>
              <th className="px-4 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td className="px-4 py-2 border-b">{category.name}</td>

                {/* Active Status Column with Toggle Slider */}
                <td className="px-4 py-2 border-b text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!category.active}
                      onChange={() => handleToggleCategory(category._id)}
                    />
                    <div
                      className={`w-11 h-6 rounded-full bg-gray-200 peer-focus:outline-none peer-focus:ring-2 
                        peer-focus:ring-blue-500 transition-all 
                        ${category.active ? "bg-green-500" : "bg-gray-200"}`}
                    ></div>
                    <span className="ml-3 text-sm font-medium">
                      {category.active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </td>

                {/* Action Column with Delete Icon */}
                <td className="px-4 py-2 border-b text-center">
                  <button
                    onClick={() => openDeleteDialog(category._id)}
                    className="text-red-500 hover:text-red-700 flex items-center justify-center"
                    title="Delete Category"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Create Category Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Create New Category</h2>
                <button onClick={closeCreateDialog} className="text-red-500">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleCategoryChange}
                  className="border w-full p-2 mt-2"
                  placeholder="Enter category name"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={closeCreateDialog}
                  className="bg-gray-500 text-white p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-80">
              <h2 className="text-xl font-bold mb-4">
                Are you sure you want to delete this category?
              </h2>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeDeleteDialog}
                  className="bg-gray-500 text-white p-2 rounded"
                >
                  No
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="bg-red-500 text-white p-2 rounded"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCategory;
