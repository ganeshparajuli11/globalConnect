import React from "react";
import Sidebar from "../sidebar/Sidebar";

const PrivacyPolicy = () => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-0 flex-1 min-h-screen bg-gray-100 p-6">
        {/* Header */}
        <header className="flex justify-between items-center bg-white shadow-md px-6 py-4 rounded-md">
          <h1 className="text-2xl font-bold text-gray-800">Privacy Policy</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Edit Privacy Policy
          </button>
        </header>

        {/* Policy Content */}
        <section className="mt-6 bg-white shadow-md p-6 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800">omnis iste natus</h2>
          <p className="text-sm text-gray-600 mt-1">Updated on: 12/12/2024</p>

          <ol className="mt-4 space-y-6">
            {/* Policy Sections */}
            <li>
              <h3 className="text-lg font-semibold text-gray-800">1. Introduction</h3>
              <p className="text-gray-600 mt-2">
                Welcome to GlobalConnect. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.
              </p>
            </li>

            {/* Add other sections here */}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
