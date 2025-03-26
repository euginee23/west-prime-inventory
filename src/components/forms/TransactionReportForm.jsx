import React from "react";

const TransactionReports = () => {
  return (
    <div>
      <h3>Transaction Reports</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Equipment</th>
            <th>User</th>
            <th>Action</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TRX001</td>
            <td>Drill Machine</td>
            <td>John Doe</td>
            <td>Checked Out</td>
            <td>2025-03-25</td>
          </tr>
          <tr>
            <td>TRX002</td>
            <td>Welding Torch</td>
            <td>Jane Smith</td>
            <td>Returned</td>
            <td>2025-03-24</td>
          </tr>
          <tr>
            <td>TRX003</td>
            <td>Pressure Washer</td>
            <td>Mike Johnson</td>
            <td>Marked as Maintenance</td>
            <td>2025-03-23</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TransactionReports;
