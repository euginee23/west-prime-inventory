import React from "react";

const EquipmentReports = () => {
  return (
    <div>
      <h3>Equipment Reports</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Checked Out By</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EQ001</td>
            <td>Drill Machine</td>
            <td>Checked Out</td>
            <td>John Doe</td>
          </tr>
          <tr>
            <td>EQ002</td>
            <td>Welding Torch</td>
            <td>Available</td>
            <td>-</td>
          </tr>
          <tr>
            <td>EQ003</td>
            <td>Pressure Washer</td>
            <td>Under Maintenance</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentReports;