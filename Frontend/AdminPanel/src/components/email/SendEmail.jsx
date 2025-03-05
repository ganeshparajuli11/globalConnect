import React, { useState, useEffect } from 'react';
import { FiMail, FiUsers, FiSend, FiX, FiClock, FiAlertTriangle, FiInfo, FiGift } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Sidebar from '../sidebar/Sidebar';

// Prebuilt email templates
const emailTemplates = [
  {
    id: 'maintenance',
    icon: <FiClock />,
    title: 'Maintenance Notice',
    subject: 'Scheduled Maintenance Notice - GlobalConnect App',
    message: `
      <p>Dear User,</p>
      <p>We want to inform you that GlobalConnect will be undergoing scheduled maintenance on [DATE] from [TIME] to [TIME] (UTC).</p>
      <p>During this period, the app will be temporarily unavailable as we work to improve our services and implement important updates.</p>
      <p>We apologize for any inconvenience this may cause and appreciate your patience.</p>
      <p>Best regards,<br/>The GlobalConnect Team</p>
    `
  },
  {
    id: 'update',
    icon: <FiInfo />,
    title: 'App Update',
    subject: 'Important Update Available - GlobalConnect',
    message: `
      <p>Dear User,</p>
      <p>A new version of GlobalConnect is now available with exciting new features and improvements!</p>
      <p>Key Updates:</p>
      <ul>
        <li>Enhanced user interface</li>
        <li>Improved performance</li>
        <li>New features and capabilities</li>
      </ul>
      <p>Please update your app to the latest version to enjoy these improvements.</p>
      <p>Best regards,<br/>The GlobalConnect Team</p>
    `
  },
  {
    id: 'urgent',
    icon: <FiAlertTriangle />,
    title: 'Urgent Notice',
    subject: 'Important: Urgent System Notice',
    message: `
      <p>Dear User,</p>
      <p>We are currently experiencing technical difficulties with some of our services. Our team is working diligently to resolve the issue.</p>
      <p>Expected resolution time: [TIME]</p>
      <p>We apologize for any inconvenience and thank you for your understanding.</p>
      <p>Best regards,<br/>The GlobalConnect Team</p>
    `
  },
  {
    id: 'welcome',
    icon: <FiGift />,
    title: 'Welcome Message',
    subject: 'Welcome to GlobalConnect!',
    message: `
      <p>Dear User,</p>
      <p>Welcome to GlobalConnect! We're thrilled to have you join our global community.</p>
      <p>Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Connect with other users</li>
        <li>Explore our features</li>
      </ul>
      <p>If you need any assistance, our support team is here to help!</p>
      <p>Best regards,<br/>The GlobalConnect Team</p>
    `
  }
];

const getProfileUrl = (path) => {
  if (!path) return "https://via.placeholder.com/150";
  if (path.startsWith("http") || path.startsWith("//")) return path;
  return `http://localhost:3000/${path}`;
};

const SendEmail = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        setSearchLoading(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await axios.get(`http://localhost:3000/api/dashboard/search-users?query=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(response.data.data);
        } catch (error) {
          console.error('Error searching users:', error);
          toast.error('Failed to search users');
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const emails = sendToAll ? [] : selectedUsers.map(user => user.email).join(',');
      
      await axios.post(
        'http://localhost:3000/api/dashboard/send-email-to-users',
        {
          subject,
          message,
          sendToAll,
          specificEmails: emails
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Email sent successfully!');
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      setSendToAll(true);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeUser = (email) => {
    setSelectedUsers(selectedUsers.filter(user => user.email !== email));
  };

  const applyTemplate = (template) => {
    setSubject(template.subject);
    setMessage(template.message);
    setShowTemplates(false);
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FiMail className="text-3xl text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-800">Send Email</h1>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
              >
                <FiInfo className="mr-2" />
                Templates
              </button>
            </div>

            {/* Templates Modal */}
            {showTemplates && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">Email Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-start space-x-3"
                    >
                      <div className="text-blue-600 text-xl mt-1">{template.icon}</div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{template.title}</div>
                        <div className="text-sm text-gray-500 truncate">{template.subject}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-6">
              {/* Send To Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Send To</label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSendToAll(true);
                      setSelectedUsers([]);
                    }}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      sendToAll
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FiUsers className="mr-2" />
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendToAll(false);
                      setShowUserSearch(true);
                    }}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      !sendToAll
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FiMail className="mr-2" />
                    Specific Users
                  </button>
                </div>
              </div>

              {/* User Selection */}
              {!sendToAll && (
                <div className="relative">
                  <div className="min-h-[44px] p-2 border border-gray-300 rounded-lg flex flex-wrap gap-2 items-center">
                    {selectedUsers.map(user => (
                      <div
                        key={user.email}
                        className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full max-w-[200px]"
                      >
                        {user.profile_image ? (
                          <img
                            src={getProfileUrl(user.profile_image)}
                            alt={user.name}
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mr-2">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="mr-1 truncate">{user.name}</span>
                        <button
                          type="button"
                          onClick={() => removeUser(user.email)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder={selectedUsers.length === 0 ? "Search users by name or email..." : ""}
                      value={searchTerm}
                      onChange={handleSearchTermChange}
                      className="flex-1 min-w-[200px] border-0 focus:ring-0 p-1 bg-transparent"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addUser(user)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center transition-colors duration-150"
                          >
                            {user.profile_image ? (
                              <img
                                src={getProfileUrl(user.profile_image)}
                                alt={user.name}
                                className="w-8 h-8 rounded-full mr-3 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{user.name}</div>
                              <div className="text-sm text-gray-500 truncate">{user.email}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No users found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <ReactQuill
                  value={message}
                  onChange={setMessage}
                  className="h-64 mb-12"
                  theme="snow"
                  placeholder="Compose your message..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiSend className="mr-2" />
                  <span>{loading ? 'Sending...' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendEmail; 