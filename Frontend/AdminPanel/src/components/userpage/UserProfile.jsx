import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../sidebar/Sidebar";
import ProfilePostCard from "./profilePostCard";
import moment from "moment";
// Helper to get full profile image URL
const getProfileUrl = (path) => {
  if (!path) return "https://via.placeholder.com/150";
  if (path.startsWith("http") || path.startsWith("//")) return path;
  return `http://localhost:3000/${path}`;
};




// Placeholder for an activity graph (you can replace this with an actual chart component)
const ActivityGraph = () => (
  <div className="bg-white p-4 rounded shadow">
    <h4 className="text-lg font-bold mb-2">User Activity Graph</h4>
    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
      <span className="text-gray-500">Activity Graph Placeholder</span>
    </div>
  </div>
);



// Overview Tab: Basic profile details and activity graph
const OverviewTab = ({ user }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-xl font-bold mb-4">Profile Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Age:</strong> {moment(user.dob).format("MMMM D, YYYY")}
          </p>
          <p>
            <strong>Gender:</strong> {user.gender}
          </p>
        </div>
        <div>
          <p>
            <strong>Status:</strong> {user.status}
          </p>
          <p>
            <strong>Verified:</strong> {user.verified ? "Yes" : "No"}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Joined:</strong>{" "}
            {moment(user.date_created).format("MMMM D, YYYY, h:mm A")}
          </p>
        </div>
      </div>
    </div>
    <ActivityGraph />
  </div>
);


const PostsTab = ({ posts, user }) => {
  const [sortBy, setSortBy] = useState("latest");
  // Sorting Logic
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "latest")
      return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "report_count")
      return (b.report_count || 0) - (a.report_count || 0);
    return 0;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">User Posts</h3>

        {/* Sorting Dropdown */}
        <select
          className="border p-2 rounded"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="report_count">Most Reported</option>
        </select>
      </div>

      {/* Scrollable Post List */}
      <div className="h-[500px] overflow-y-auto p-2 bg-gray-50 rounded-lg">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <ProfilePostCard key={post._id} post={post} user={user} />
          ))
        ) : (
          <p className="text-gray-600">No posts available.</p>
        )}
      </div>
    </div>
  );
};

// Activity Tab: Login history and activity logs
const ActivityTab = ({ user }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold mb-4">Login History</h3>
    {user.login_history && user.login_history.length > 0 ? (
      <ul className="divide-y">
        {user.login_history.map((log, index) => (
          <li key={index} className="py-2">
            <p className="text-sm text-gray-700">
              {new Date(log.date).toLocaleString()} — {log.device} —{" "}
              {log.ip_address}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <p>No login history available.</p>
    )}
  </div>
);

// Engagement Tab: Social connections and engagement metrics
const EngagementTab = ({ user }) => (
  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Engagement Metrics</h3>
      <p>
        <strong>Posts:</strong> {user.posts_count}
      </p>
      <p>
        <strong>Comments:</strong> {user.comments_count}
      </p>
      <p>
        <strong>Likes Given:</strong> {user.likes_given}
      </p>
      <p>
        <strong>Likes Received:</strong> {user.likes_received}
      </p>
    </div>
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Social Connections</h3>
      <p>
        <strong>Followers:</strong> {user.followers ? user.followers.length : 0}
      </p>
      <p>
        <strong>Following:</strong> {user.following ? user.following.length : 0}
      </p>
      <p>
        <strong>Blocked Users:</strong>{" "}
        {user.blocked_users ? user.blocked_users.length : 0}
      </p>
    </div>
  </div>
);

// Preferences Tab: User interests, location, and notification settings
const PreferencesTab = ({ user }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Interests & Preferences</h3>
      <p>
        <strong>Interests:</strong>{" "}
        {user.interests && user.interests.length > 0
          ? user.interests.join(", ")
          : "None"}
      </p>
      <p>
        <strong>Destination Country:</strong>{" "}
        {user.destination_country || "N/A"}
      </p>
      <p>
        <strong>Current Location:</strong> {user.current_location.city},{" "}
        {user.current_location.country}
      </p>
    </div>
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Notification Preferences</h3>
      <p>
        <strong>Email:</strong>{" "}
        {user.notification_preferences?.email ? "Enabled" : "Disabled"}
      </p>
      <p>
        <strong>SMS:</strong>{" "}
        {user.notification_preferences?.sms ? "Enabled" : "Disabled"}
      </p>
      <p>
        <strong>Push:</strong>{" "}
        {user.notification_preferences?.push ? "Enabled" : "Disabled"}
      </p>
    </div>
  </div>
);

// Security Tab: OTP and other security details
const SecurityTab = ({ user }) => (
  <div className="p-6">
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Security Details</h3>
      <p>
        <strong>OTP Attempts:</strong> {user.otp_attempts}
      </p>
      <p>
        <strong>OTP Blocked Until:</strong>{" "}
        {user.otp_blocked_until
          ? new Date(user.otp_blocked_until).toLocaleString()
          : "N/A"}
      </p>
    </div>
  </div>
);

const UserProfileDashboard = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState({ user: {}, posts: [] });
  const [accessToken, setAccessToken] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Retrieve the access token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setAccessToken(token);
  }, []);

  // Fetch user data once accessToken and userId are available
  useEffect(() => {
    if (accessToken && userId) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/profile/user-data-admin/${userId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          // Assume the API returns { user: {}, posts: [] }
          setUserData({
            user: response.data.data.user,
            posts: response.data.data.posts,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [accessToken, userId]);

  if (!userData.user._id)
    return <div className="p-6">Loading user profile...</div>;

  // Render tab content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab user={userData.user} />;
      case "posts":
        return <PostsTab posts={userData.posts} user={userData.user} />;
      case "activity":
        return <ActivityTab user={userData.user} />;
      case "engagement":
        return <EngagementTab user={userData.user} />;
      case "preferences":
        return <PreferencesTab user={userData.user} />;
      case "security":
        return <SecurityTab user={userData.user} />;
      default:
        return <OverviewTab user={userData.user} />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1">
        {/* User Profile Header */}
        <div className="bg-white shadow rounded-lg m-6 p-6 flex items-center">
          <img
            src={getProfileUrl(userData.user.profile_image)}
            alt="Profile"
            className="w-20 h-20 rounded-full mr-6 object-cover"
          />
          <div>
            <h2 className="text-3xl font-bold">{userData.user.name}</h2>
            <p className="text-gray-600">{userData.user.email}</p>
          </div>
        </div>
        {/* Tabs Navigation */}
        <div className="mx-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              {[
                { key: "overview", label: "Overview" },
                { key: "posts", label: "Posts" },
                { key: "activity", label: "Activity" },
                { key: "engagement", label: "Engagement" },
                { key: "preferences", label: "Preferences" },
                { key: "security", label: "Security" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap pb-4 px-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          {/* Active Tab Content */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDashboard;
