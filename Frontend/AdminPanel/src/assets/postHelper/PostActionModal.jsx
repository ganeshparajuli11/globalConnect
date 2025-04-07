import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { 
  FaTimes, 
  FaSpinner, 
  FaUndo, 
  FaLock, 
  FaUnlock, 
  FaClock, 
  FaTrash,
  FaSkull,
  FaCheckCircle
} from 'react-icons/fa';

const PostActionModal = ({ post, isVisible, setIsVisible, onActionComplete, accessToken }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1w');
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [permanentConfirmation, setPermanentConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setSelectedAction('');
      setActionReason('');
      setSelectedDuration('1w');
      setPermanentConfirmation('');
      setIsProcessing(false);
      setConfirmationModalVisible(false);
    }
  }, [isVisible]);

  if (!isVisible || !post) return null;

  const sanitizeHtml = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;
    if (selectedAction === "permanentDelete") {
      const confirmation = permanentConfirmation.trim().toLowerCase();
      if (confirmation !== "delete" && confirmation !== "yes") {
        alert("Please type 'delete' or 'yes' to confirm permanent deletion.");
        return;
      }
    }
    setIsProcessing(true);

    let payload = {
      postId: post.id || post._id,
      action: selectedAction,
      reason: actionReason,  // optional: if empty, backend will use a default
    };

    if (selectedAction === "suspend") {
      const now = new Date();
      let suspendUntil;
      if (selectedDuration === "1w") {
        suspendUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (selectedDuration === "1m") {
        suspendUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (selectedDuration === "permanent") {
        suspendUntil = new Date("9999-12-31");
      }
      payload.suspended_from = now;
      payload.suspended_until = suspendUntil;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/post/admin/action`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onActionComplete && onActionComplete();
    } catch (err) {
      console.error(err);
      alert("Failed to complete action. Please try again.");
    } finally {
      setIsProcessing(false);
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
             onClick={() => setIsVisible(false)} />
        
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-4 py-6 bg-gray-50 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Manage Post</h2>
                  <button onClick={() => setIsVisible(false)} 
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                <div className="space-y-4">
                  {/* Post Preview Card */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-500">Post ID:</span>
                      <span className="ml-2 text-sm text-gray-900">{post.id || post._id}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${post.isBlocked ? 'bg-red-100 text-red-800' : 
                          post.isSuspended ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {post.isBlocked ? 'Blocked' : 
                         post.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    {post.content && (
                      <div className="mt-3 prose prose-sm max-w-none text-gray-600">
                        <div dangerouslySetInnerHTML={sanitizeHtml(post.content)} />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {post.isBlocked ? (
                      <button onClick={() => setSelectedAction('unblock')}
                              className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                       border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <FaUnlock className="text-green-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Unblock Post</div>
                            <div className="text-sm text-gray-500">Allow post to be visible again</div>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <button onClick={() => setSelectedAction('block')}
                              className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                       border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <FaLock className="text-red-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Block Post</div>
                            <div className="text-sm text-gray-500">Hide post from all users</div>
                          </div>
                        </div>
                      </button>
                    )}

                    <button onClick={() => setSelectedAction('suspend')}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                     border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <FaClock className="text-yellow-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Suspend Post</div>
                          <div className="text-sm text-gray-500">Temporarily hide this post</div>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setSelectedAction('resetReports')}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                     border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <FaUndo className="text-blue-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Reset Reports</div>
                          <div className="text-sm text-gray-500">Clear all reports for this post</div>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setSelectedAction('delete')}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                     border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <FaTrash className="text-gray-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Delete Post</div>
                          <div className="text-sm text-gray-500">Remove this post</div>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setSelectedAction('permanentDelete')}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                     border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <FaSkull className="text-red-600 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Permanent Delete</div>
                          <div className="text-sm text-gray-500">Permanently remove this post (cannot be undone)</div>
                        </div>
                      </div>
                    </button>

                    {post.status !== "Active" && (
                      <button onClick={() => setSelectedAction('activate')}
                              className="w-full flex items-center justify-between px-4 py-3 bg-white border 
                                       border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-green-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Activate Post</div>
                            <div className="text-sm text-gray-500">Reset post to active state</div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {selectedAction && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={() => setSelectedAction('')} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle 
                          transition-all transform bg-white shadow-xl rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}
              </h3>
              
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={`Optionally, why are you ${selectedAction}ing this post?`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                {selectedAction === 'suspend' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: '1w', label: '1 Week' },
                        { value: '1m', label: '1 Month' },
                        { value: 'permanent', label: 'Permanent' }
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer 
                                    border transition-all ${
                            selectedDuration === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
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
                )}

                {selectedAction === 'permanentDelete' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Type 'delete' or 'yes' to confirm permanent deletion
                    </label>
                    <input
                      type="text"
                      value={permanentConfirmation}
                      onChange={(e) => setPermanentConfirmation(e.target.value)}
                      placeholder="Type 'delete' or 'yes' to confirm"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 
                               focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-sm text-red-600">
                      This action cannot be undone. The post will be permanently deleted.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2 ${
                      selectedAction === 'permanentDelete' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded-lg transition-colors disabled:opacity-50`}
                  >
                    {isProcessing && <FaSpinner className="animate-spin inline mr-2" />}
                    {selectedAction === 'permanentDelete' ? 'Permanently Delete' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setSelectedAction('')}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                             hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostActionModal;