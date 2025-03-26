import React from "react";

const MaintenanceReports = () => {
  return (
    <div>
      <h3>Maintenance Reports</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Maintenance ID</th>
            <th>Equipment</th>
            <th>Technician</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MT001</td>
            <td>Drill Machine</td>
            <td>James Wilson</td>
            <td>Completed</td>
            <td>2025-03-22</td>
          </tr>
          <tr>
            <td>MT002</td>
            <td>Pressure Washer</td>
            <td>Anna Lee</td>
            <td>In Progress</td>
            <td>2025-03-24</td>
          </tr>
          <tr>
            <td>MT003</td>
            <td>Hydraulic Jack</td>
            <td>Michael Brown</td>
            <td>Scheduled</td>
            <td>2025-03-26</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceReports;
