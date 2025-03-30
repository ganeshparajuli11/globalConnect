import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaCheck, FaChevronLeft, FaChevronRight, FaSort, FaTimes } from "react-icons/fa";
import Sidebar from "../sidebar/Sidebar";

const VerifyUser = () => {
    const [userData, setUserData] = useState([]);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [verificationReason, setVerificationReason] = useState("");
    const [sortBy, setSortBy] = useState('followers');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showVerified, setShowVerified] = useState(false);
    const BASE_URL = "http://localhost:3000/";
    const navigate = useNavigate();
    const searchTimeout = useRef(null);

    useEffect(() => {
        const token = reactLocalStorage.get("access_token");
        if (!token) {
            toast.error("Please login to continue");
            navigate("/login");
        } else {
            setAccessToken(token);
        }
    }, [navigate]);

    const fetchUsers = async () => {
        if (!accessToken) return;
        try {
            setIsLoading(true);
            const endpoint = showVerified
                ? "http://localhost:3000/api/dashboard/verified-users"
                : "http://localhost:3000/api/dashboard/unverified-users";

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { sortBy, sortOrder, search: searchTerm },
            });

            if (response.data?.data) {
                setUserData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [accessToken, sortBy, sortOrder, showVerified]);

    const handleVerify = async () => {
        try {
            if (!selectedUser || !verificationReason.trim()) {
                toast.error("Please provide a reason for verification");
                return;
            }

            await axios.put(
                `http://localhost:3000/api/dashboard/verify-user/${selectedUser.userId}`,
                { verified: true, reason: verificationReason },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            toast.success("User verified successfully");
            fetchUsers();
            setConfirmationModalVisible(false);
            setSelectedUser(null);
            setVerificationReason("");
        } catch (error) {
            console.error("Error verifying user:", error);
            toast.error("Failed to verify user");
        }
    };

    const filteredUsers = userData.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="flex h-screen bg-gray-50">
            <ToastContainer />

            <Sidebar />

            <div className="flex-1 overflow-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                clearTimeout(searchTimeout.current);
                                searchTimeout.current = setTimeout(fetchUsers, 500);
                            }}
                            className="pl-10 pr-4 py-2 w-64 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border px-3 py-2 rounded-lg"
                        >
                            <option value="followers">Followers</option>
                            <option value="posts">Posts</option>
                            <option value="name">Name</option>
                            <option value="date">Date</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="border p-2 rounded-lg"
                        >
                            <FaSort className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                        </button>

                        <select
                            value={showVerified ? "verified" : "unverified"}
                            onChange={(e) => setShowVerified(e.target.value === "verified")}
                            className="border px-3 py-2 rounded-lg"
                        >
                            <option value="unverified">Unverified Users</option>
                            <option value="verified">Verified Users</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white p-6">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Followers</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">No users found</td>
                                </tr>
                            ) : (
                                currentUsers.map((user) => (
                                    <tr key={user.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover bg-gray-100"
                                                    src={user.profile_image
                                                        ? `${BASE_URL}${user.profile_image.startsWith('/')
                                                            ? user.profile_image.slice(1)
                                                            : user.profile_image}`
                                                        : "https://via.placeholder.com/40"}
                                                    alt={`${user.name}'s profile`}
                                                    onError={(e) => {
                                                        console.log('Image load failed:', e.target.src);
                                                        e.target.onerror = null; // Prevent infinite loop
                                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E7EB'/%3E%3Cpath d='M20 20.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0 2c3 0 9 1.5 9 4.5v2h-18v-2c0-3 6-4.5 9-4.5z' fill='%239CA3AF'/%3E%3C/svg%3E";
                                                    }}
                                                    loading="lazy"
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.followers_count}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.posts_count}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setConfirmationModalVisible(true);
                                                }}
                                                className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm 
            ${showVerified
                                                        ? 'border-red-500 text-red-600 hover:bg-red-50'
                                                        : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 
            ${showVerified ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                            >
                                                {showVerified ? (
                                                    <>
                                                        <FaTimes className="mr-1" />
                                                        Unverify
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck className="mr-1" />
                                                        Verify
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VerifyUser;
