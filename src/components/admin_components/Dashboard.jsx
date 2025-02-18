import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Table, Button, Form } from "react-bootstrap";
import {
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClipboardList,
  FaDownload,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const Dashboard = () => {
  const today = new Date().toISOString().split("T")[0];

  const equipmentSummary = [
    {
      title: `Total Equipments (as of: ${today})`,
      count: 120,
      icon: <FaClipboardList size={20} />,
      color: "#007bff",
    },
    {
      title: "Available",
      count: 80,
      icon: <FaCheckCircle size={20} />,
      color: "#28a745",
    },
    {
      title: "Released",
      count: 30,
      icon: <FaTools size={20} />,
      color: "#ffc107",
    },
    {
      title: "Maintenance / Repair",
      count: 10,
      icon: <FaExclamationTriangle size={20} />,
      color: "#dc3545",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Released Keyboard",
      user: "John Doe",
      date: "2025-02-18",
    },
    {
      id: 2,
      action: "Returned Mouse",
      user: "Dark Willow",
      date: "2025-02-17",
    },
    {
      id: 3,
      action: "Reported issue with Printer",
      user: "Invoker",
      date: "2025-02-16",
    },
    {
      id: 4,
      action: "Released Projector",
      user: "Crystal Maiden",
      date: "2025-02-15",
    },
    {
      id: 5,
      action: "Repaired Scanner",
      user: "Wind Ranger",
      date: "2025-02-14",
    },
    {
      id: 6,
      action: "Added Equipment PC",
      user: "Techies",
      date: "2025-02-13",
    },
    {
      id: 7,
      action: "Added Equipment Printer",
      user: "Razor",
      date: "2025-02-12",
    },
    { id: 8, action: "Returned PC", user: "Storm Spirit", date: "2025-02-11" },
    {
      id: 9,
      action: "Returned Monitor",
      user: "Earth Shaker",
      date: "2025-02-10",
    },
    {
      id: 10,
      action: "Added Equipment Router",
      user: "Puck",
      date: "2025-02-08",
    },
  ];

  const equipmentStatusData = [
    { name: "Available", value: 80, color: "#28a745" },
    { name: "In Use", value: 30, color: "#ffc107" },
    { name: "Maintenance", value: 10, color: "#dc3545" },
  ];

  const equipmentDistributionData = [
    { name: "Lab A", count: 45 },
    { name: "Lab B", count: 35 },
    { name: "Lab C", count: 25 },
    { name: "Lab D", count: 15 },
    { name: "Lab E", count: 10 },
  ];

  // State for date filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter activities based on date range
  const filteredActivities = recentActivities.filter((activity) => {
    if (!startDate || !endDate) return true;
    return activity.date >= startDate && activity.date <= endDate;
  });

  // Function to download filtered activities as Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredActivities);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recent Activities");
    XLSX.writeFile(wb, "Recent_Activities.xlsx");
  };

  return (
    <div className="container mt-3" style={{ maxWidth: "1400px", margin: "auto" }}>
      {/* Equipment Summary Cards */}
      <div className="row gx-2 gy-2">
        {equipmentSummary.map((item, index) => (
          <div key={index} className="col-6 col-sm-6 col-md-3">
            <div
              className="card shadow-sm text-center p-2"
              style={{ borderLeft: `4px solid ${item.color}` }}
            >
              <div className="d-flex flex-column align-items-center">
                {item.icon}
                <h6 className="mt-1 mb-0" style={{ fontSize: "0.85rem" }}>
                  {item.title}
                </h6>
                <strong className="fs-6">{item.count}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mt-3">
        {/* Charts Section (Left Side) */}
        <div className="col-lg-7">
          <div className="row">
            {/* Equipment Status Chart - Left Side */}
            <div className="col-12 col-md-6">
              <div className="card shadow-sm p-2 mb-2">
                <h6 className="text-center mb-2" style={{ fontSize: "0.9rem" }}>
                  Equipment Status
                </h6>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={equipmentStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {equipmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={18}
                      wrapperStyle={{ fontSize: "0.8rem" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* New Chart - Right Side */}
            <div className="col-12 col-md-6">
              <div className="card shadow-sm p-2 mb-2">
                <h6 className="text-center mb-2" style={{ fontSize: "0.9rem" }}>
                  Equipment Condition
                </h6>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Good", value: 70, color: "#28a745" },
                        { name: "Fair", value: 20, color: "#ffc107" },
                        { name: "Damaged", value: 10, color: "#dc3545" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40} // Creates the "hole" for a doughnut chart
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#28a745" />
                      <Cell fill="#ffc107" />
                      <Cell fill="#dc3545" />
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={18}
                      wrapperStyle={{ fontSize: "0.8rem" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card shadow-sm p-2 mb-2">
            <h6 className="text-center mb-3" style={{ fontSize: "0.9rem" }}>
              Equipment Distribution by Lab
            </h6>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={equipmentDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: "0.8rem" }} />
                <YAxis tick={{ fontSize: "0.8rem" }} />
                <Tooltip />

                {/* Bar colors */}
                <Bar dataKey="count">
                  {equipmentDistributionData.map((entry, index) => {
                    const colors = [
                      "#6AAFE6",
                      "#A3D9A5",
                      "#FFD166",
                      "#FF9F80",
                      "#B89EFF",
                    ];
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities Section (Right Side) */}
        <div className="col-lg-5">
          {/* Date Filter Container */}
          <div className="card shadow-sm p-2 mb-2">
            <h6 className="text-center mb-2" style={{ fontSize: "0.85rem" }}>
              Filter by Date
            </h6>

            <div className="d-flex align-items-center gap-2 flex-column flex-sm-row px-2">
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-100"
                style={{ fontSize: "0.8rem", padding: "6px" }}
              />
              <span
                className="d-none d-sm-block text-muted"
                style={{ fontSize: "0.85rem" }}
              >
                to
              </span>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-100"
                style={{ fontSize: "0.8rem", padding: "6px" }}
              />
            </div>

            <div className="d-flex gap-2 mt-2 px-2">
              <Button
                variant="primary"
                size="sm"
                className="w-100 w-sm-auto"
                onClick={() => {}}
                style={{ fontSize: "0.8rem", padding: "6px" }}
              >
                <FaClipboardList className="me-1" /> Apply
              </Button>
              <Button
                variant="success"
                size="sm"
                className="w-100 w-sm-auto"
                onClick={downloadExcel}
                style={{ fontSize: "0.8rem", padding: "6px" }}
              >
                <FaDownload className="me-1" /> Export
              </Button>
            </div>
          </div>

          {/* Recent Activities Table */}
          <div className="card shadow-sm p-2">
            <h6
              className="text-center mb-2"
              style={{ fontSize: "0.85rem", marginBottom: "4px" }}
            >
              Recent Activities
            </h6>
            <Table
              striped
              bordered
              hover
              responsive
              size="sm"
              className="text-center"
              style={{ fontSize: "0.75rem" }}
            >
              <thead className="table-dark">
                <tr>
                  <th style={{ padding: "6px" }}>#</th>
                  <th style={{ padding: "6px" }}>Action</th>
                  <th style={{ padding: "6px" }}>Personnel</th>
                  <th style={{ padding: "6px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td style={{ padding: "6px" }}>{activity.id}</td>
                    <td style={{ padding: "6px" }}>{activity.action}</td>
                    <td style={{ padding: "6px" }}>{activity.user}</td>
                    <td style={{ padding: "6px" }}>{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
