import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaUndo, FaUserLock, FaUserClock, FaUserMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const UserManagementComponent = ({ 
  selectedUser, 
  setSelectedUser, 
  fetchUserData, 
  fetchActiveUsers, 
  API_BASE_URL, 
  accessToken,
  isVisible,
  setIsVisible 
}) => {
  // State variables
  const [actionModalVisible, setActionModalVisible] = useState(isVisible);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [selectedAction, setSelectedAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Close the modal when parent visibility changes
  React.useEffect(() => {
    setActionModalVisible(isVisible);
  }, [isVisible]);

  // Close handler that notifies parent component
  const handleCloseModal = () => {
    setActionModalVisible(false);
    setIsVisible(false);
  };

  // =======================================================
  // Deleting a User
  // =======================================================
  const handleDelete = () => {
    setConfirmationMessage(
      `Are you sure you want to delete user ${selectedUser?.name}?`
    );
    setOnConfirm(() => async () => {
      if (!deleteReason.trim()) {
        toast.error("Please provide a reason for deletion");
        return;
      }
      
      try {
        await axios.put(
          `${API_BASE_URL}/admin-update-user-status`,
          {
            userId: selectedUser?.id || selectedUser?.userId, // Handle both id formats
            action: "delete",
            reason: deleteReason,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("User deleted successfully");
        fetchUserData(); // Use existing fetch function
      } catch (error) {
        console.error("Delete error:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to delete user");
      } finally {
        setConfirmationModalVisible(false);
        handleCloseModal();
        setSelectedUser(null);
        setDeleteReason('');
      }
    });
    setConfirmationModalVisible(true);
  };

  // =======================================================
  // Block/Unblock, Suspend/Unsuspend, Reset Reports
  // =======================================================
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);
    if (actionType === "unblock" || actionType === "unsuspend") {
      setConfirmationMessage(
        `Are you sure you want to ${actionType} user ${selectedUser?.name}?`
      );
      setOnConfirm(() => async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/admin-update-user-status`,
            {
              userId: selectedUser?.userId,
              action: actionType,
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          toast.success(`User successfully ${actionType}ed`);
          fetchActiveUsers();
        } catch (error) {
          toast.error(
            error.response?.data?.message || `Failed to ${actionType} user`
          );
        } finally {
          setConfirmationModalVisible(false);
          setSelectedUser(null);
          setSelectedAction("");
          handleCloseModal();
        }
      });
      setConfirmationModalVisible(true);
    } else {
      // For block or suspend actions, open the duration/reason modal
      setDurationModalVisible(true);
    }
  };

  // Confirm block/suspend in Duration/Reason modal
  const handleSubmitAction = async () => {
    if (!selectedDuration || !actionReason.trim()) {
      toast.error("Please select a duration and enter a reason.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/admin-update-user-status`,
        {
          userId: selectedUser?.userId,
          action: selectedAction,
          reason: actionReason,
          duration: selectedDuration,
          resetReports: false,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`User ${selectedAction}ed successfully`);
      fetchActiveUsers();
      setDurationModalVisible(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setSelectedDuration("");
      handleCloseModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Failed to ${selectedAction} user`
      );
    }
  };

  // Reset user's report count
  const handleResetReportCount = () => {
    setConfirmationMessage(
      `Are you sure you want to reset report count for user ${selectedUser?.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/reset-report-count`,
          {
            type: "user",
            id: selectedUser?.userId,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("Report count reset successfully");
        fetchActiveUsers();
      } catch (error) {
        console.error("Reset report error:", error.response?.data);
        toast.error(
          error.response?.data?.message || "Failed to reset report count"
        );
      } finally {
        setConfirmationModalVisible(false);
        handleCloseModal();
        setSelectedUser(null);
      }
    });
    setConfirmationModalVisible(true);
  };

  // If no user is selected or modal shouldn't be visible, don't render anything
  if (!actionModalVisible || !selectedUser) {
    return null;
  }

  return (
    <>
      {/* === Action Side-Drawer === */}
      <div className="fixed inset-0 overflow-hidden z-50">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                <div className="px-4 py-6 bg-gray-50 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Manage User: {selectedUser.name}
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <FaTimes className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Info Card */}
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={
                          selectedUser.profile_image
                            ? `http://localhost:3000/${selectedUser.profile_image}`
                            : "https://via.placeholder.com/80"
                        }
                        alt={selectedUser.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                          Active
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="space-y-3">
                      {selectedUser.is_blocked ? (
                        <button
                          onClick={() => handleBlockOrSuspend("unblock")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUndo className="text-green-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Unblock User</div>
                              <div className="text-sm text-gray-500">
                                Allow user to re-access the platform
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockOrSuspend("block")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUserLock className="text-red-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Block User</div>
                              <div className="text-sm text-gray-500">
                                Prevent user from accessing the platform
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                      {selectedUser.is_suspended ? (
                        <button
                          onClick={() => handleBlockOrSuspend("unsuspend")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUndo className="text-green-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Unsuspend User</div>
                              <div className="text-sm text-gray-500">
                                Lift suspension from the user
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockOrSuspend("suspend")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUserClock className="text-yellow-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Suspend User</div>
                              <div className="text-sm text-gray-500">
                                Temporarily restrict user access
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={handleResetReportCount}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaUndo className="text-blue-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Reset Report Count</div>
                            <div className="text-sm text-gray-500">
                              Set report count to 0
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaUserMinus className="text-gray-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Delete User</div>
                            <div className="text-sm text-gray-500">
                              Permanently remove user account
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duration/Reason Modal for block/suspend */}
      {durationModalVisible && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setDurationModalVisible(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-w-full flex justify-center">
              <div className="w-full max-w-lg">
                <div className="bg-white rounded-t-xl shadow-xl">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedAction === "block" ? "Block" : "Suspend"} User
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder={`Why are you ${selectedAction}ing this user?`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "1w", label: "1 Week" },
                          { value: "1m", label: "1 Month" },
                          { value: "6m", label: "6 Months" },
                          { value: "permanent", label: "Permanent" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer border transition-all ${
                              selectedDuration === option.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              checked={selectedDuration === option.value}
                              onChange={(e) => setSelectedDuration(e.target.value)}
                              className="hidden"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSubmitAction}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setDurationModalVisible(false);
                          setActionReason("");
                          setSelectedDuration("");
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModalVisible && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setConfirmationModalVisible(false)}
            />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
              <p className="text-sm text-gray-500 mb-4 whitespace-pre-line">
                {confirmationMessage}
              </p>
              
              {selectedAction === "delete" || confirmationMessage.includes("delete user") ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deletion
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Why are you deleting this user?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              ) : null}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => onConfirm()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmationModalVisible(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagementComponent;