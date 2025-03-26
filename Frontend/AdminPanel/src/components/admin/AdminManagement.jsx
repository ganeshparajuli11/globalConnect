import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

// Helper to format a stored DOB (string) into YYYY-MM-DD for <input type="date" />
function formatDateForInput(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to format a stored DOB (string) into a more readable display (MM/DD/YYYY)
function formatDateForDisplay(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString(); 
  // Adjust locale or formatting as needed, e.g. en-GB for DD/MM/YYYY
}

const AdminManagement = () => {
  // State for admins list
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Token from local storage
  const [token, setToken] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  // confirmationAction holds the function to run when confirmed
  const [confirmationAction, setConfirmationAction] = useState(() => () => {});

  // Form state for new admin or editing an admin
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    profileImage: null,
  });

  // When editing, hold the id of the admin being edited
  const [editingAdminId, setEditingAdminId] = useState(null);

  // Fetch token on mount
  useEffect(() => {
    const t = reactLocalStorage.get("access_token");
    if (t) setToken(t);
  }, []);

  // Fetch list of admins from the backend
  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/users/allAdmin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.admins) {
        setAdmins(res.data.admins);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching admins", error);
      setIsLoading(false);
    }
  };

  // Fetch admins when token is available
  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token]);

  // Handlers for opening/closing "Add Admin" modal
  const openAddModal = () => {
    setAdminForm({
      name: "",
      email: "",
      password: "",
      dob: "",
      profileImage: null,
    });
    setIsAddModalOpen(true);
  };
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAdminForm({
      name: "",
      email: "",
      password: "",
      dob: "",
      profileImage: null,
    });
  };

  // Handlers for opening/closing "Edit Admin" modal
  const openEditModal = (admin) => {
    setEditingAdminId(admin.id);
    setAdminForm({
      name: admin.name,
      email: admin.email,
      password: "", // leave blank so user can choose whether to change it
      dob: formatDateForInput(admin.dob), // format for <input type="date" />
      profileImage: null,
    });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAdminId(null);
    setAdminForm({
      name: "",
      email: "",
      password: "",
      dob: "",
      profileImage: null,
    });
  };

  // Form change handlers
  const handleFormChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e) => {
    setAdminForm({ ...adminForm, profileImage: e.target.files[0] });
  };

  // Add new admin submission
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", adminForm.name);
    formData.append("email", adminForm.email);
    formData.append("password", adminForm.password);
    formData.append("dob", adminForm.dob);
    if (adminForm.profileImage) {
      formData.append("profile_image", adminForm.profileImage);
    }

    setConfirmationMessage(`Are you sure you want to add admin ${adminForm.name}?`);
    setConfirmationAction(() => async () => {
      try {
        const res = await axios.post(
          "http://localhost:3000/api/users/admin/signup",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success(res.data.message);
        closeAddModal();
        fetchAdmins();
        setIsConfirmationOpen(false);
      } catch (error) {
        console.error("Error adding admin", error);
        toast.error("Error adding admin");
        setIsConfirmationOpen(false);
      }
    });
    setIsConfirmationOpen(true);
  };

  // Edit admin submission
  const handleEditAdmin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", adminForm.name);
    formData.append("email", adminForm.email);
    // Only append password if user actually typed something
    if (adminForm.password) {
      formData.append("password", adminForm.password);
    }
    formData.append("dob", adminForm.dob);
    if (adminForm.profileImage) {
      formData.append("profile_image", adminForm.profileImage);
    }

    setConfirmationMessage(`Are you sure you want to update admin ${adminForm.name}?`);
    setConfirmationAction(() => async () => {
      try {
        // IMPORTANT: The route should match your backend's
        // e.g. router.put("/admin/edit/:adminId", ...)
        const res = await axios.put(
          `http://localhost:3000/api/users/admin/edit/${editingAdminId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success(res.data.message);
        closeEditModal();
        fetchAdmins();
        setIsConfirmationOpen(false);
      } catch (error) {
        console.error("Error editing admin", error);
        toast.error("Error editing admin");
        setIsConfirmationOpen(false);
      }
    });
    setIsConfirmationOpen(true);
  };

  // Delete admin
  const handleDeleteAdmin = (adminId) => {
    // Prevent deletion if this is the last admin
    if (admins.length <= 1) {
      toast.error("Cannot delete the last admin.");
      return;
    }
    setConfirmationMessage(`Are you sure you want to delete this admin?`);
    setConfirmationAction(() => async () => {
      try {
        const res = await axios.delete(
          `http://localhost:3000/api/users/admin/remove/${adminId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(res.data.message);
        fetchAdmins();
        setIsConfirmationOpen(false);
      } catch (error) {
        console.error("Error deleting admin", error);
        toast.error("Error deleting admin");
        setIsConfirmationOpen(false);
      }
    });
    setIsConfirmationOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <ToastContainer />
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Admin Management</h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={openAddModal}
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
                <th className="py-3 px-4 border-b text-left">Role</th>
                <th className="py-3 px-4 border-b text-left">Verified</th>
                <th className="py-3 px-4 border-b text-left">DOB</th>
                <th className="py-3 px-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">
                      <img
                        src={
                          admin.profile_image?.startsWith("http")
                            ? admin.profile_image
                            : `http://localhost:3000/${admin.profile_image}`
                        }
                        alt={admin.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="py-3 px-4 border-b">{admin.name}</td>
                    <td className="py-3 px-4 border-b">{admin.email}</td>
                    <td className="py-3 px-4 border-b">{admin.role}</td>
                    <td className="py-3 px-4 border-b">
                      {admin.verified ? "Yes" : "No"}
                    </td>
                    {/* Display DOB in a friendly format */}
                    <td className="py-3 px-4 border-b">
                      {formatDateForDisplay(admin.dob)}
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Adding New Admin */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
              <form onSubmit={handleAddAdmin}>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={adminForm.name}
                    onChange={handleFormChange}
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
                    value={adminForm.email}
                    onChange={handleFormChange}
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
                    value={adminForm.password}
                    onChange={handleFormChange}
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
                    value={adminForm.dob}
                    onChange={handleFormChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
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
                    onClick={closeAddModal}
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

        {/* Modal for Editing Admin */}
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Edit Admin</h2>
              <form onSubmit={handleEditAdmin}>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={adminForm.name}
                    onChange={handleFormChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={adminForm.email}
                    onChange={handleFormChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={adminForm.password}
                    onChange={handleFormChange}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={adminForm.dob}
                    onChange={handleFormChange}
                    className="w-full border px-3 py-2 rounded"
          
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Profile Image</label>
                  <input
                    type="file"
                    name="profileImage"
                    onChange={handleFileChange}
                    className="w-full"
                    accept="image/*"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="mr-3 px-4 py-2 border rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {isConfirmationOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded p-6 w-80">
              <h2 className="text-lg font-bold mb-4">Confirm Action</h2>
              <p className="mb-6 whitespace-pre-line">{confirmationMessage}</p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => confirmationAction()}
                >
                  Confirm
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={() => setIsConfirmationOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
