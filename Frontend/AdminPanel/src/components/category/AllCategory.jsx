import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../sidebar/Sidebar";
import { XCircle, Trash2 } from "lucide-react"; // Using Trash2 for delete icon
import "../category/category.css";

const AllCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState(null);

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

  // Function to open the toggle confirmation dialog
  const openToggleDialog = (categoryId, currentStatus) => {
    setCategoryToToggle({ id: categoryId, currentStatus });
    setIsToggleDialogOpen(true);
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
  const handleToggleCategory = async () => {
    if (!categoryToToggle) return;

    try {
      await axios.patch(
        `http://localhost:3000/api/category/status/${categoryToToggle.id}`
      );
      setCategories(
        categories.map((category) =>
          category._id === categoryToToggle.id
            ? { ...category, active: !category.active }
            : category
        )
      );
      setIsToggleDialogOpen(false);
      setCategoryToToggle(null);
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
                      onChange={() =>
                        openToggleDialog(category._id, category.active)
                      }
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-black dark:text-black">
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
            <div className="bg-white p-6 rounded w-96">
              <h2 className="text-xl font-bold mb-4">Delete Category</h2>
              <p className="mb-4">
                Are you sure you want to delete this category?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Confirmation Dialog */}
        {isToggleDialogOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Status Change
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to{" "}
                  {categoryToToggle?.currentStatus ? "deactivate" : "activate"}{" "}
                  this category?
                  {categoryToToggle?.currentStatus
                    ? " This will hide the category from users."
                    : " This will make the category visible to users."}
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-5 border-t pt-4">
                <button
                  onClick={() => {
                    setIsToggleDialogOpen(false);
                    setCategoryToToggle(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleCategory}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    categoryToToggle?.currentStatus
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  }`}
                >
                  {categoryToToggle?.currentStatus ? "Deactivate" : "Activate"}
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
