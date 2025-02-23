import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";

const ReportedUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "block", "suspend", or "unblock"
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const navigate = useNavigate();

  // Retrieve token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) setAccessToken(token);
  }, []);

  // Fetch reported user data
  const fetchReportedUsers = () => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/get-all-reported-user", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          if (response.data.message === "Admin report fetched successfully.") {
            setUserData(response.data.data);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching reported users:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedUsers();
  }, [accessToken]);

  // Filter reports by reported user's name
  const filteredData = userData.filter((report) =>
    report.reportedTo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open detail modal when clicking on profile image or name
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // Open actions modal from the three-dot button
  const handleActionClick = (e, report) => {
    e.stopPropagation();
    setSelectedReport(report);
    setActionModalVisible(true);
  };

  // For block/suspend, open the Duration/Reason modal
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);
    setDurationModalVisible(true);
  };

  // For unblock, immediately show a confirmation dialog
  const handleUnblockConfirm = (e, report) => {
    e.stopPropagation();
    setSelectedReport(report);
    setSelectedAction("Suspended");
    setConfirmationMessage(
      `Are you sure you want to unblock user ${report.reportedTo.name}?`
    );
    setOnConfirm(() => () => {
      updateUnblockStatus();
    });
    setConfirmationModalVisible(true);
    setActionModalVisible(false);
  };

  // API call to update user status (block or suspend)
  const updateUserStatus = (durationValue) => {
    const payload = {
      userId: selectedReport.reportedTo._id,
      action: selectedAction,
      reason: actionReason,
      duration: durationValue,
    };
    axios
      .put("http://localhost:3000/api/dashboard/admin-update-user-status", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        setConfirmationModalVisible(false);
        setDurationModalVisible(false);
        setSelectedReport(null);
        setSelectedAction("");
        setActionReason("");
        setSelectedDuration("");
        fetchReportedUsers();
      })
      .catch((error) => {
        console.error("Error updating user status:", error);
        setConfirmationModalVisible(false);
        alert("Error updating user status.");
      });
  };

  // API call to update unblocking status
  const updateUnblockStatus = () => {
    const payload = {
      userId: selectedReport.reportedTo._id,
      status: "Suspended", // or "Suspended" if desired; here we default to Active
    };
    axios
      .put("http://localhost:3000/api/dashboard/admin-remove-user-status", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        setConfirmationModalVisible(false);
        setSelectedReport(null);
        fetchReportedUsers();
      })
      .catch((error) => {
        console.error("Error unblocking user:", error);
        setConfirmationModalVisible(false);
        alert("Error unblocking user.");
      });
  };

  // Delete action (simulate deletion; replace with API call if needed)
  const handleDelete = () => {
    setConfirmationMessage(`Are you sure you want to delete user ${selectedReport.reportedTo.name}?`);
    setOnConfirm(() => () => {
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedReport(null);
    });
    setConfirmationModalVisible(true);
  };

  // Handle submit for block/suspend action from the Duration/Reason modal
  const handleSubmitAction = () => {
    if (!selectedDuration || !actionReason.trim()) {
      alert("Please select a duration and enter a reason.");
      return;
    }
    const durationText =
      selectedDuration === "1w"
        ? "1 Week"
        : selectedDuration === "1m"
        ? "1 Month"
        : selectedDuration === "6m"
        ? "6 Months"
        : "Permanent";
    setConfirmationMessage(
      `Are you sure you want to ${selectedAction} user ${selectedReport.reportedTo.name} for ${durationText} with the reason:\n"${actionReason}"?`
    );
    setOnConfirm(() => () => {
      updateUserStatus(selectedDuration);
    });
    setConfirmationModalVisible(true);
  };


  // Navigate to user profile page
  const goToUserProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search user by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Filter
          </button>
        </div>

        {/* Reported Users Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">SN</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Profile</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Report Count</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredData.map((report, index) => (
                  <tr key={index} className="border-b hover:bg-gray-200">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4">
                      <img
                        src={
                          report.reportedTo.profile_image
                            ? `http://localhost:3000/${report.reportedTo.profile_image}`
                            : "https://via.placeholder.com/80"
                        }
                        alt={report.reportedTo.name}
                        className="w-16 h-16 rounded-full object-cover cursor-pointer"
                        onClick={() => handleViewDetails(report)}
                      />
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleViewDetails(report)}
                    >
                      {report.reportedTo.name}
                    </td>
                    <td className="px-6 py-4">{report.reportedTo.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white ${
                          report.reportedTo.status === "Blocked"
                            ? "bg-red-500"
                            : report.reportedTo.status === "Suspended"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      >
                        {report.reportedTo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{report.reportedCount}</td>
                    <td className="px-6 py-4 flex space-x-2">
                      {/* Only the three-dot button is shown since clicking on image/name shows details */}
                      <button
                        onClick={(e) => handleActionClick(e, report)}
                        className="text-red-600 hover:text-red-800 text-3xl"
                        title="Actions"
                      >
                        &#8942;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {detailModalVisible && selectedReport && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 lg:w-1/2 overflow-y-auto max-h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Reported User Details</h2>
                <button
                  className="text-gray-600"
                  onClick={() => setDetailModalVisible(false)}
                >
                  Close
                </button>
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={
                    selectedReport.reportedTo.profile_image
                      ? `http://localhost:3000/${selectedReport.reportedTo.profile_image}`
                      : "https://via.placeholder.com/80"
                  }
                  alt={selectedReport.reportedTo.name}
                  className="w-24 h-24 rounded-full object-cover cursor-pointer"
                  onClick={() =>
                    goToUserProfile(selectedReport.reportedTo._id)
                  }
                />
                <div>
                  <h3
                    className="text-xl font-semibold cursor-pointer"
                    onClick={() =>
                      goToUserProfile(selectedReport.reportedTo._id)
                    }
                  >
                    {selectedReport.reportedTo.name}
                  </h3>
                  <p className="text-gray-600">
                    {selectedReport.reportedTo.email}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <p>
                  <span className="font-semibold">Report Count:</span>{" "}
                  {selectedReport.reportedCount}
                </p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Report Reasons:</h4>
                <ul className="list-disc list-inside">
                  {selectedReport.reportCategoryDetails.map((category, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{category.report_title}:</span>{" "}
                      {category.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Reported By:</h4>
                <ul>
                  {selectedReport.reportedBy.map((reporter, idx) => (
                    <li
                      key={idx}
                      className="flex items-center space-x-2 mb-1 cursor-pointer"
                      onClick={() => goToUserProfile(reporter._id)}
                    >
                      <img
                        src={
                          reporter.profile_image
                            ? `http://localhost:3000/${reporter.profile_image}`
                            : "https://via.placeholder.com/40"
                        }
                        alt={reporter.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span>{reporter.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions Modal */}
        {actionModalVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-64">
              <h2 className="text-lg font-semibold mb-4">Select Action</h2>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={() => handleBlockOrSuspend("block")}
              >
                Block
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={() => handleBlockOrSuspend("suspend")}
              >
                Suspend
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={(e) => {
                  setActionModalVisible(false);
                  handleDelete();
                }}
              >
                Delete
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-200"
                onClick={(e) => handleUnblockConfirm(e, selectedReport)}
              >
                Unblock
              </button>
              <button
                className="mt-4 w-full text-center text-gray-600"
                onClick={() => setActionModalVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Duration/Reason Modal for Block/Suspend */}
        {durationModalVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-72">
              <h2 className="text-lg font-semibold mb-4">
                {selectedAction === "block" ? "Block" : "Suspend"} User
              </h2>
              <div className="mb-4">
                <textarea
                  placeholder="Enter reason for action"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Select Duration:</label>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="1w"
                      checked={selectedDuration === "1w"}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    1 Week
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="1m"
                      checked={selectedDuration === "1m"}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    1 Month
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="6m"
                      checked={selectedDuration === "6m"}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    6 Months
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="permanent"
                      checked={selectedDuration === "permanent"}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    Permanent
                  </label>
                </div>
              </div>
              <button
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleSubmitAction}
              >
                Submit
              </button>
              <button
                className="mt-4 w-full text-center text-gray-600"
                onClick={() => {
                  setDurationModalVisible(false);
                  setActionReason("");
                  setSelectedDuration("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationModalVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
              <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
              <p className="mb-6 whitespace-pre-line">{confirmationMessage}</p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  onClick={() => onConfirm()}
                >
                  Confirm
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  onClick={() => setConfirmationModalVisible(false)}
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

export default ReportedUser;
