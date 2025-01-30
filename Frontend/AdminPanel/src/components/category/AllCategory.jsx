import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../category/category.css";
import Sidebar from '../sidebar/Sidebar';
import { XCircle } from "lucide-react";
const AllCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToToggle, setCategoryToToggle] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    fields: [{ name: '', type: 'text', label: '', required: false }],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/category/all-admin');
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewCategory({
      name: '',
      fields: [{ name: '', type: 'text', label: '', required: false }],
    });
  };

  const handleAddField = () => {
    setNewCategory({
      ...newCategory,
      fields: [...newCategory.fields, { name: '', type: 'text', label: '', required: false }],
    });
  };

  const handleCategoryChange = (e) => {
    setNewCategory({
      ...newCategory,
      [e.target.name]: e.target.value,
    });
  };

  const handleFieldChange = (e, index) => {
    const updatedFields = [...newCategory.fields];
    updatedFields[index][e.target.name] = e.target.value;
    setNewCategory({ ...newCategory, fields: updatedFields });
  };

  const handleAddCategory = () => {

    const isValid = newCategory.fields.every((field) => {
      return field.name && field.type && field.label; // All fields must have name, type, and label
    });
  
    if (!isValid) {
      alert("Each field must have a name, type, and label.");
      return; // Prevent form submission if fields are invalid
    }
  
    const token = localStorage.getItem('access_token'); // Or retrieve the token from wherever it's stored
    
    axios.post('http://localhost:3000/api/category/create', newCategory, {
      headers: {
        'Authorization': `Bearer ${token}`, 
      },
    })
    .then(response => {
      setCategories([...categories, response.data.category]);
      handleCloseDialog();
    })
    .catch(error => console.error("Error adding category:", error));
  };
  

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      const token = localStorage.getItem('access_token'); // Retrieve token from storage
  
      axios.delete(`http://localhost:3000/api/category/delete/${categoryToDelete}`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Send token as a bearer token in the request header
        },
      })
      .then(() => {
        setCategories(categories.filter(category => category._id !== categoryToDelete));
        setIsDeleteDialogOpen(false);
      })
      .catch(error => console.error("Error deleting category:", error));
    }
  };
  

  const handleToggleCategory = () => {
    if (categoryToToggle) {
      axios.patch(`http://localhost:3000/api/category/status/${categoryToToggle}`)
        .then(() => {
          setCategories(categories.map((category) =>
            category._id === categoryToToggle ? { ...category, active: !category.active } : category
          ));
          setCategoryToToggle(null);
        })
        .catch(error => console.error("Error toggling category status:", error));
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-100 border-r border-gray-300">
        <Sidebar />
      </div>

      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-4">All Categories</h1>

        <button
          onClick={handleOpenDialog}
          className="bg-blue-500 text-white p-2 rounded mb-4"
        >
          Create Category
        </button>

        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Fields</th>
              <th className="px-4 py-2 border-b">Active Status</th>
              <th className="px-4 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td className="px-4 py-2 border-b">{category.name}</td>
                <td className="px-4 py-2 border-b">
                  {category.fields.map((field, index) => (
                    <div key={index}>{field.label} ({field.type})</div>
                  ))}
                </td>
                <td className="px-4 py-2 border-b">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={category.active}
                      onChange={() => setCategoryToToggle(category._id)}
                    />
                    <span className="slider"></span>
                  </label>
                </td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => {
                      setCategoryToDelete(category._id);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isDialogOpen && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded w-96 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Create New Category</h2>
        <button onClick={handleCloseDialog} className="text-red-500">
          <XCircle size={24} /> {/* Use the lucide-react close icon */}
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold">Category Name</label>
        <input
          type="text"
          name="name"
          value={newCategory.name}
          onChange={handleCategoryChange}
          className="border w-full p-2 mt-2"
          placeholder="Enter category name"
        />
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Fields</h3>
        {newCategory.fields.map((field, index) => (
          <div key={index} className="mt-4">
            <div>
              <label className="block text-sm font-semibold">Field Name</label>
              <input
                type="text"
                name="name"
                value={field.name}
                onChange={(e) => handleFieldChange(e, index)}
                className="border w-full p-2 mt-2"
                placeholder="Enter field name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mt-4">Field Label</label>
              <input
                type="text"
                name="label"
                value={field.label}
                onChange={(e) => handleFieldChange(e, index)}
                className="border w-full p-2 mt-2"
                placeholder="Enter field label"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mt-4">Field Type</label>
              <select
                name="type"
                value={field.type}
                onChange={(e) => handleFieldChange(e, index)}
                className="border w-full p-2 mt-2"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="dropdown">Dropdown</option>
                <option value="file">File</option>
                <option value="number">Number</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mt-4">Is this field required?</label>
              <input
                type="checkbox"
                name="required"
                checked={field.required}
                onChange={(e) => {
                  const updatedFields = [...newCategory.fields];
                  updatedFields[index].required = e.target.checked;
                  setNewCategory({ ...newCategory, fields: updatedFields });
                }}
                className="mt-2"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddField}
          className="bg-green-500 text-white p-2 rounded mt-4"
        >
          Add Another Field
        </button>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={handleCloseDialog}
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

        {isDeleteDialogOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
              <p>Are you sure you want to delete this category?</p>

              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="bg-gray-500 text-white p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="bg-red-500 text-white p-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {categoryToToggle && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
              <h2 className="text-xl font-bold">Toggle Active Status</h2>
              <p>Are you sure you want to toggle this category's active status?</p>

              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setCategoryToToggle(null)}
                  className="bg-gray-500 text-white p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleCategory}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Confirm
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
