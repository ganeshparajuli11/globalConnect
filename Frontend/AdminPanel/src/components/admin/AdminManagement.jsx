import React, { useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";

const AdminManagement = () => {
  // State for the list of admins (simulate API call)
  const [admins, setAdmins] = useState([]);
  // Control modal visibility for adding or editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  // New admin form state, including a profileImage field
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    profileImage: null,
  });

  // Simulate fetching admin data on mount (replace with API call as needed)
  useEffect(() => {
    const initialAdmins = [
      {
        id: 1,
        name: "Admin One",
        email: "admin1@example.com",
        dob: "1990-01-01",
        profileImage: "uploads/profile/admin1.jpg",
      },
      {
        id: 2,
        name: "Admin Two",
        email: "admin2@example.com",
        dob: "1988-05-12",
        profileImage: "uploads/profile/admin2.jpg",
      },
    ];
    setAdmins(initialAdmins);
  }, []);

  // Open modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewAdmin({ name: "", email: "", password: "", dob: "", profileImage: null });
  };

  // Handle form input changes
  const handleChange = (e) => {
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  };

  // Handle file change separately for profile image
  const handleFileChange = (e) => {
    setNewAdmin({ ...newAdmin, profileImage: e.target.files[0] });
  };

  // Handle submission of new admin form
  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, you would submit newAdmin via FormData to your backend.
    // For this demo, we simply add it locally.
    const newAdminEntry = { ...newAdmin, id: Date.now() };
    setAdmins([...admins, newAdminEntry]);
    handleCloseModal();
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Admin Management</h1>
        <div className="flex justify-end mb-6">
          <button
            onClick={handleOpenModal}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Admin
          </button>
        </div>
        {/* Admins Table */}
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left">Profile</th>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Email</th>
                <th className="py-3 px-4 border-b text-left">Date of Birth</th>
                <th className="py-3 px-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">
                    <img
                      src={
                        admin.profileImage.startsWith("http")
                          ? admin.profileImage
                          : `http://localhost:3000/${admin.profileImage}`
                      }
                      alt={admin.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="py-3 px-4 border-b">{admin.name}</td>
                  <td className="py-3 px-4 border-b">{admin.email}</td>
                  <td className="py-3 px-4 border-b">{admin.dob}</td>
                  <td className="py-3 px-4 border-b text-center">
                    <button className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600">
                      Edit
                    </button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Adding New Admin */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newAdmin.name}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newAdmin.email}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={newAdmin.password}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={newAdmin.dob}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                {/* Profile Image Field */}
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Profile Image</label>
                  <input
                    type="file"
                    name="profileImage"
                    onChange={handleFileChange}
                    className="w-full"
                    accept="image/*"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mr-3 px-4 py-2 border rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
