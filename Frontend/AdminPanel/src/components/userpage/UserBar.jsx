import React from "react";
import { 
  FaUsers, FaUserCheck, FaUserClock, FaUserLock, 
  FaExclamationTriangle, FaBan, FaUserPlus, FaHistory,
  FaChartLine, FaPercentage
} from "react-icons/fa";

const UserBar = ({ stats = {}, loading, error }) => {
  // Calculate percentages only if totalUsers is greater than 0
  const activePercentage = stats?.totalUsers ? 
    ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0;
  
  const inactivePercentage = stats?.totalUsers ? 
    ((stats.inactiveUsers / stats.totalUsers) * 100).toFixed(1) : 0;
  
  const problemUserPercentage = stats?.totalUsers ? 
    (((stats.blockedUsers + stats.reportedUsers) / stats.totalUsers) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-500 rounded-md">
        Error loading user statistics: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <FaChartLine className="mr-2" /> User Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Users Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">{(stats?.totalUsers || 0).toLocaleString()}</h3>
                <p className="text-sm mt-2">
                  <span className="bg-blue-400/30 px-2 py-1 rounded">
                    +{stats?.newUsers || 0} today
                  </span>
                </p>
              </div>
              <FaUsers size={24} className="text-white/80" />
            </div>
          </div>

          {/* Active vs Inactive */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Recently Active Users</p>
                <h3 className="text-2xl font-bold text-green-500 mt-1">
                  {(stats?.recentlyActiveUsers || 0).toLocaleString()}
                </h3>
                <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
              </div>
              <FaUserCheck size={24} className="text-green-500" />
            </div>
            <div className="mt-4 bg-gray-200 h-2 rounded-full">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${stats?.totalUsers ? ((stats.recentlyActiveUsers / stats.totalUsers) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Problem Users */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Problem Users</p>
                <h3 className="text-2xl font-bold text-red-500 mt-1">
                  {((stats?.blockedUsers || 0) + (stats?.reportedUsers || 0)).toLocaleString()}
                </h3>
                <p className="text-sm text-gray-500 mt-2">{problemUserPercentage}% of total</p>
              </div>
              <FaExclamationTriangle size={24} className="text-red-500" />
            </div>
            <div className="mt-4 bg-gray-200 h-2 rounded-full">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${problemUserPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaUserCheck className="text-green-500 mr-3" size={20} />
                <span>Recently Active Users</span>
              </div>
              <span className="font-semibold">{(stats?.recentlyActiveUsers || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaUserClock className="text-yellow-500 mr-3" size={20} />
                <span>Inactive Users</span>
              </div>
              <span className="font-semibold">{(stats?.inactiveUsers || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaHistory className="text-blue-500 mr-3" size={20} />
                <span>Long-term Inactive</span>
              </div>
              <span className="font-semibold">{(stats?.longInactiveUsers || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Moderation Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Moderation Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-orange-500 mr-3" size={20} />
                <span>Reported Users</span>
              </div>
              <span className="font-semibold">{(stats?.reportedUsers || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaBan className="text-red-500 mr-3" size={20} />
                <span>Blocked Users</span>
              </div>
              <span className="font-semibold">{(stats?.blockedUsers || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <FaUserPlus className="text-green-500 mr-3" size={20} />
                <span>New Users Today</span>
              </div>
              <span className="font-semibold">{(stats?.newUsers || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {((stats?.longInactiveUsers > 0) || (stats?.reportedUsers > 0)) && (
        <div className="space-y-4">
          {stats?.longInactiveUsers > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 mr-3" size={20} />
                <div>
                  <p className="text-yellow-700 font-medium">Long-term Inactive Users Alert</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    {(stats?.longInactiveUsers || 0).toLocaleString()} users haven't been active for over 30 days
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats?.reportedUsers > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-3" size={20} />
                <div>
                  <p className="text-red-700 font-medium">Reported Users Alert</p>
                  <p className="text-red-600 text-sm mt-1">
                    {(stats?.reportedUsers || 0).toLocaleString()} users have been reported and need review
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserBar;
