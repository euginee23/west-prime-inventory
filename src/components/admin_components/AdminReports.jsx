import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

const AdminReports = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className="full-container">
      {/* Tabs & Content Wrapper */}
      <div className="tab-container card p-3 shadow-sm">
        <Tabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
          {/* Tab Navigation */}
          <TabList className="tab-list">
            <Tab className={`tab-item ${tabIndex === 3 ? "active-tab" : ""}`}>
              All Logs
            </Tab>
            <Tab className={`tab-item ${tabIndex === 4 ? "active-tab" : ""}`}>
              Create
            </Tab>
          </TabList>

          {/* Reports Content */}
          <div className="tab-content">
            <TabPanel>
              <div>
                <h4>All Logs</h4>
                <p>This is a placeholder for All report logs.</p>
              </div>
            </TabPanel>
            <TabPanel>
              <div>
                <h4>Create</h4>
                <p>This is a placeholder for creating a report.</p>
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .tab-container {
          border-radius: 8px;
          background: #ffffff;
          max-width: 100%;
        }

        .tab-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 10px;
          border-bottom: 2px solid #ddd;
          padding: 0;
          list-style: none;
          justify-content: flex-start; 
        }

        .tab-item {
          height: 30px; 
          display: flex;
          align-items: center; 
          justify-content: center; 
          padding: 0 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: #f1f1f1;
          border: 1px solid #ccc;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          transition: background 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          min-width: 100px;
          text-align: center;
          color: #333;
        }

        .tab-item:hover {
          background: #e9ecef;
          color: #333;
        }

        .active-tab {
          background: #007bff;
          color: white;
          font-weight: bold;
          box-shadow: 0px -3px 6px rgba(0, 123, 255, 0.2);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .tab-list {
            justify-content: space-between; 
          }

          .tab-item {
            min-width: 30%;
            font-size: 13px;
            padding: 8px 10px;
          }

          .tab-content {
            padding: 10px;
          }
        }

        /* Table Responsiveness */
        .tab-content table {
          width: 100%;
          overflow-x: auto;
          display: block;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;
