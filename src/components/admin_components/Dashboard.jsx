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
import axios from "axios";
import { useEffect } from "react";
import EquipmentListModal from "../modals/DashboardEquipmentListModal";
import ReactLoading from "react-loading";

const Dashboard = () => {
  const today = new Date().toISOString().split("T")[0];

  const [equipmentTotal, setEquipmentTotal] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [inUseCount, setInUseCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [operationalData, setOperationalData] = useState([]);
  const [equipmentDistributionData, setEquipmentDistributionData] = useState(
    []
  );
  const [recentActivities, setRecentActivities] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllDashboardData = async () => {
      try {
        await fetchTotalEquipments();
        await fetchAvailableEquipments();
        await fetchInUseEquipments();
        await fetchLostEquipments();
        await fetchMaintenanceEquipments();
        await fetchOperationalStatus();
        await fetchEquipmentDistribution();
        await fetchRecentActivities();
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllDashboardData();
  }, []);

  const fetchTotalEquipments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/total-equipments-today`
      );
      setEquipmentTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch equipment total:", error);
    }
  };

  const fetchAvailableEquipments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/available-equipments`
      );
      setAvailableCount(res.data.total);
    } catch (error) {
      console.error("Failed to fetch available equipment count:", error);
    }
  };

  const fetchInUseEquipments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/in-use-equipments`
      );
      setInUseCount(res.data.total);
    } catch (error) {
      console.error("Failed to fetch in-use equipment count:", error);
    }
  };

  const fetchLostEquipments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/lost-equipments`
      );
      setLostCount(res.data.total);
    } catch (error) {
      console.error("Failed to fetch lost equipment count:", error);
    }
  };

  const fetchMaintenanceEquipments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/maintenance-equipments`
      );
      setMaintenanceCount(res.data.total);
    } catch (error) {
      console.error("Failed to fetch maintenance equipment count:", error);
    }
  };

  const fetchOperationalStatus = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/operational-status`
      );
      const { operational, defective, damaged } = res.data.data;

      const chartData = [
        {
          name: "Operational",
          value: parseInt(operational),
          color: "#28a745",
        },
        { name: "Defective", value: parseInt(defective), color: "#ffc107" },
        { name: "Damaged", value: parseInt(damaged), color: "#dc3545" },
      ];

      const total = chartData.reduce((acc, cur) => acc + cur.value, 0);
      setOperationalData(
        total === 0
          ? [{ name: "No Data", value: 1, color: "#d6d6d6" }]
          : chartData
      );
    } catch (err) {
      console.error("Failed to fetch operational status:", err);
    }
  };

  const fetchEquipmentDistribution = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/equipments-by-lab`
      );
      setEquipmentDistributionData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch equipment distribution:", error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/recent-activities`
      );
      const activities = res.data.data.map((item, index) => {
        const rawDate = new Date(item.activity_date);
        return {
          id: index + 1,
          action: item.action,
          user: item.personnel,
          date: rawDate,
          displayDate: rawDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          }),
        };
      });
      setRecentActivities(activities);
    } catch (err) {
      console.error("Failed to fetch recent activities:", err);
    }
  };

  const equipmentSummary = [
    {
      title: `Total Equipments (as of: ${today})`,
      count: equipmentTotal,
      icon: <FaClipboardList size={20} />,
      color: "#007bff",
    },
    {
      title: "Available",
      count: availableCount,
      icon: <FaCheckCircle size={20} />,
      color: "#28a745",
    },
    {
      title: "In-Use",
      count: inUseCount,
      icon: <FaTools size={20} />,
      color: "#ffc107",
    },
    {
      title: "Maintenance / Repair",
      count: maintenanceCount,
      icon: <FaExclamationTriangle size={20} />,
      color: "#dc3545",
    },
  ];

  const equipmentStatusData = [
    { name: "Available", value: availableCount, color: "#28a745" },
    { name: "In-Use", value: inUseCount, color: "#ffc107" },
    { name: "Maintenance", value: maintenanceCount, color: "#dc3545" },
    { name: "Lost", value: lostCount, color: "#6c757d" },
  ];

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredActivities = recentActivities.filter((activity) => {
    if (!startDate && !endDate) return true;

    const activityDate = new Date(activity.date);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (activityDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (activityDate > end) return false;
    }

    return true;
  });

  const handlePieSliceClick = async (
    categoryName,
    categoryType = "availability"
  ) => {
    try {
      const endpoint =
        categoryType === "availability"
          ? `/dashboard/equipments-by-availability?status=${categoryName}`
          : `/dashboard/equipments-by-operational?status=${categoryName}`;

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`
      );

      const equipments = res.data.map((eq) => ({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        brand: eq.brand,
        lab: `${eq.lab_name} (#${eq.lab_number})`,
      }));

      setSelectedCategory(categoryName);
      setSelectedEquipments(equipments);
      setShowModal(true);
    } catch (err) {
      console.error("Error loading equipment list:", err);
    }
  };

  const handleBarClick = async (barData) => {
    try {
      const match = barData.name.match(/^(.*?)\s*\(#(\d+)\)$/);

      if (!match) {
        console.warn("Invalid lab label format:", barData.name);
        return;
      }

      const labName = match[1].trim();
      const labNumber = parseInt(match[2]);

      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/dashboard/equipments-by-lab-name?lab_name=${encodeURIComponent(
          labName
        )}&lab_number=${labNumber}`
      );

      const equipments = res.data.map((eq) => ({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        brand: eq.brand,
        lab: `${eq.lab_name} (#${eq.lab_number})`,
      }));

      setSelectedCategory(`${labName} (#${labNumber})`);
      setSelectedEquipments(equipments);
      setShowModal(true);
    } catch (err) {
      console.error("Error loading lab equipment list:", err);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <ReactLoading type="spin" color="#007bff" height={60} width={60} />
      </div>
    );
  }

  return (
    <div
      className="container mt-3"
      style={{ maxWidth: "1400px", margin: "auto" }}
    >
      <EquipmentListModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={`${selectedCategory} Equipments`}
        equipments={selectedEquipments}
      />

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
        <div className="col-lg-7">
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="card shadow-sm p-2 mb-2">
                <h6 className="text-center mb-2" style={{ fontSize: "0.9rem" }}>
                  Equipment Availability Status
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
                      onClick={(data) => handlePieSliceClick(data.name)}
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

            <div className="col-12 col-md-6">
              <div className="card shadow-sm p-2 mb-2">
                <h6 className="text-center mb-2" style={{ fontSize: "0.9rem" }}>
                  Equipment Operational Status
                </h6>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={operationalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={(data) =>
                        handlePieSliceClick(data.name, "operational")
                      }
                    >
                      {operationalData.map((entry, index) => (
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

                <Bar dataKey="count" onClick={(data) => handleBarClick(data)}>
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

        <div className="col-lg-5">
          <div className="card shadow-sm p-2 mb-2">
            <h6 className="text-center mb-2" style={{ fontSize: "0.85rem" }}>
              Filter by Date
            </h6>

            <div className="d-flex align-items-center gap-2 flex-column flex-sm-row px-2">
              <Form.Group className="w-100">
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onBlur={(e) => setStartDate(e.target.value)}
                  className="w-100"
                  style={{ fontSize: "0.85rem", padding: "6px" }}
                />
              </Form.Group>

              <span
                className="text-muted d-none d-sm-block"
                style={{ fontSize: "0.85rem" }}
              >
                to
              </span>

              <Form.Group className="w-100">
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onBlur={(e) => setEndDate(e.target.value)}
                  className="w-100"
                  style={{ fontSize: "0.85rem", padding: "6px" }}
                />
              </Form.Group>
            </div>

            <div className="d-flex gap-2 mt-2 px-2">
              <Button
                variant="danger"
                size="sm"
                className="w-100 w-sm-auto"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                style={{ fontSize: "0.8rem", padding: "6px" }}
              >
                Clear Filter
              </Button>
            </div>
          </div>

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
                    <td style={{ padding: "6px" }}>{activity.displayDate}</td>
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
