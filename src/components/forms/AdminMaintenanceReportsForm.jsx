import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import uploadReport from "../../utils/uploadReport";
import { getLoggedInUser } from "../../utils/auth";

const AdminMaintenanceReportsForm = () => {
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [personnels, setPersonnels] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [statusTypes, setStatusTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const loggedInUser = getLoggedInUser();

        const [res, personnelsRes, labsRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/reports/maintenance`
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/personnels-and-admins`
          ),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/laboratories`),
        ]);

        const allData = res.data;

        const labsFormatted = labsRes.data.data.map(
          (lab) => `${lab.lab_name} (#${lab.lab_number})`
        );
        setLaboratories(labsFormatted);
        setPersonnels(personnelsRes.data);

        if (loggedInUser?.role === "Personnel") {
          const fullName = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
          const personalFiltered = allData.filter(
            (row) => row.handled_by === fullName
          );
          setSelectedPersonnel([fullName]);
          setMaintenanceData(personalFiltered);
          setFiltered(personalFiltered);
        } else {
          setMaintenanceData(allData);
          setFiltered(allData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching maintenance data:", err);
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, []);

  useEffect(() => {
    const fetchPersonnels = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/personnels-and-admins`
        );
        setPersonnels(res.data);
      } catch (err) {
        console.error("Error fetching personnels:", err);
      }
    };

    const fetchLabs = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/laboratories`
        );
        const formatted = res.data.data.map(
          (lab) => `${lab.lab_name} (#${lab.lab_number})`
        );
        setLaboratories(formatted);
      } catch (err) {
        console.error("Error fetching laboratories:", err);
      }
    };

    fetchPersonnels();
    fetchLabs();
  }, []);

  useEffect(() => {
    const uniqueTypes = [
      ...new Set(
        maintenanceData.map((t) => t.transaction_type).filter(Boolean)
      ),
    ];
    setTransactionTypes(uniqueTypes);
    const uniqueStatuses = [
      ...new Set(maintenanceData.map((t) => t.status).filter(Boolean)),
    ];
    setStatusTypes(uniqueStatuses);
  }, [maintenanceData]);

  useEffect(() => {
    let filtered = maintenanceData;

    if (selectedPersonnel.length > 0) {
      filtered = filtered.filter((row) =>
        selectedPersonnel.includes(row.handled_by)
      );
    }

    if (selectedLabs.length > 0) {
      filtered = filtered.filter((row) =>
        selectedLabs.includes(row.laboratory_location)
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((row) =>
        selectedTypes.includes(row.transaction_type)
      );
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((row) =>
        selectedStatuses.includes(row.status)
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        (row) => row.date && new Date(row.date) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (row) => row.date && new Date(row.date) <= end
      );
    }

    setFiltered(filtered);
  }, [
    maintenanceData,
    selectedPersonnel,
    selectedLabs,
    selectedTypes,
    selectedStatuses,
    startDate,
    endDate,
  ]);

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hour, minute, second] = timeStr.split(":");
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second || 0);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const exportToExcel = async () => {
    try {
      const formatted = filtered.map((row, i) => ({
        "#": i + 1,
        Equipment: row.equipment,
        "Lab Location": row.laboratory_location,
        "Handled By": row.handled_by,
        Technician: row.technician,
        "Tracking Code": row.tracking_code,
        Reason: row.reason,
        "Transaction Type": row.transaction_type,
        Date: row.date ? new Date(row.date).toLocaleDateString() : "N/A",
        Time: row.time || "N/A",
        Notes: row.notes || "—",
        Status: row.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const maxColWidths = Object.keys(formatted[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...formatted.map((row) => (row[key] ? row[key].toString().length : 0))
        );
        return { wch: maxLength + 2 };
      });
      worksheet["!cols"] = maxColWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Report");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const filename = await uploadReport({
        buffer: blob,
        type: "excel",
        reportName: "Maintenance Report",
        reportType: "Maintenance Report",
      });

      saveAs(blob, filename);
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [13, 8.5],
      });

      autoTable(doc, {
        head: [
          [
            "#",
            "Equipment",
            "Laboratory",
            "Handled By",
            "Technician",
            "Code",
            "Reason",
            "Type",
            "Date",
            "Time",
            "Notes",
            "Status",
          ],
        ],
        body: filtered.map((row, i) => [
          i + 1,
          row.equipment,
          row.laboratory_location,
          row.handled_by,
          row.technician,
          row.tracking_code,
          row.reason,
          row.transaction_type,
          row.date ? new Date(row.date).toLocaleDateString() : "N/A",
          row.time || "N/A",
          row.notes || "—",
          row.status,
        ]),
        styles: {
          fontSize: 7.5,
          overflow: "linebreak",
          cellPadding: 0.05,
        },
        columnStyles: {
          0: { cellWidth: 0.3 },
          1: { cellWidth: 0.8 },
          2: { cellWidth: 1.0 },
          3: { cellWidth: 1.0 },
          4: { cellWidth: 1.0 },
          5: { cellWidth: 1.2 },
          6: { cellWidth: 2.0 },
          7: { cellWidth: 0.9 },
          8: { cellWidth: 0.8 },
          9: { cellWidth: 0.6 },
          10: { cellWidth: 1.5 },
          11: { cellWidth: 0.7 },
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        startY: 0.5,
        margin: { left: 0.3, right: 0.3 },
        pageBreak: "auto",
      });

      const pdfBlob = doc.output("blob");

      const filename = await uploadReport({
        buffer: pdfBlob,
        type: "pdf",
        reportName: "Maintenance Report",
        reportType: "Maintenance Report",
      });

      saveAs(pdfBlob, filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-report-container">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">MAINTENANCE REPORTS</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="mb-3">
          {/* Filter by Personnel (Admins Only) */}
          {getLoggedInUser()?.role === "Admin" && (
            <div className="filter-container p-3 border rounded bg-light mb-3">
              <h6 className="mb-2">Filter by Personnel:</h6>
              <div className="d-flex flex-wrap gap-2">
                {personnels.map((person) => (
                  <label key={person.user_id} className="form-check-label me-3">
                    <input
                      type="checkbox"
                      className="form-check-input me-1"
                      checked={selectedPersonnel.includes(person.name)}
                      onChange={() =>
                        setSelectedPersonnel((prev) =>
                          prev.includes(person.name)
                            ? prev.filter((n) => n !== person.name)
                            : [...prev, person.name]
                        )
                      }
                    />
                    {person.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filter by Laboratory Location */}
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <h6 className="mb-2">Filter by Laboratory Location:</h6>
            <div className="d-flex flex-wrap gap-2">
              {laboratories.map((lab, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedLabs.includes(lab)}
                    onChange={() =>
                      setSelectedLabs((prev) =>
                        prev.includes(lab)
                          ? prev.filter((l) => l !== lab)
                          : [...prev, lab]
                      )
                    }
                  />
                  {lab}
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Transaction Type */}
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <h6 className="mb-2">Filter by Transaction Type:</h6>
            <div className="d-flex flex-wrap gap-2">
              {transactionTypes.map((type, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedTypes.includes(type)}
                    onChange={() =>
                      setSelectedTypes((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type]
                      )
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Status */}
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <h6 className="mb-2">Filter by Status:</h6>
            <div className="d-flex flex-wrap gap-2">
              {statusTypes.map((status, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedStatuses.includes(status)}
                    onChange={() =>
                      setSelectedStatuses((prev) =>
                        prev.includes(status)
                          ? prev.filter((s) => s !== status)
                          : [...prev, status]
                      )
                    }
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Transaction Date */}
          <h6 className="mb-2">Filter by Transaction Date:</h6>
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="text-end">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                setSelectedPersonnel([]);
                setSelectedLabs([]);
                setSelectedTypes([]);
                setSelectedStatuses([]);
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table table-bordered table-hover compact-table">
            <thead className="table-light sticky-top">
              <tr>
                <th>ID</th>
                <th>Equipment</th>
                <th>Laboratory Location</th>
                <th>Handled By</th>
                <th>Technician</th>
                <th>Tracking Code</th>
                <th>Reason</th>
                <th>Transaction Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.equipment}</td>
                    <td>{row.laboratory_location}</td>
                    <td>{row.handled_by}</td>
                    <td>{row.technician}</td>
                    <td>{row.tracking_code}</td>
                    <td>{row.reason}</td>
                    <td>{row.transaction_type}</td>
                    <td>
                      {row.date
                        ? new Date(row.date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>{formatTimeAMPM(row.time)}</td>
                    <td>{row.notes || "—"}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center text-muted">
                    No maintenance data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-3 d-flex gap-2">
          <button onClick={exportToExcel} className="btn btn-sm btn-success">
            Export to Excel
          </button>
          <button onClick={exportToPDF} className="btn btn-sm btn-danger">
            Export to PDF
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="card-wrapper">
        {filtered.map((row) => (
          <div className="maintenance-card" key={row.id}>
            <p className="fw-bold mb-2">
              #{row.id} - {row.equipment}
            </p>
            <p>
              <span className="label">Lab:</span> {row.laboratory_location}
            </p>
            <p>
              <span className="label">Handled By:</span> {row.handled_by}
            </p>
            <p>
              <span className="label">Technician:</span> {row.technician}
            </p>
            <p>
              <span className="label">Code:</span> {row.tracking_code}
            </p>
            <p>
              <span className="label">Reason:</span> {row.reason}
            </p>
            <p>
              <span className="label">Type:</span> {row.transaction_type}
            </p>
            <p>
              <span className="label">Date:</span>{" "}
              {row.date ? new Date(row.date).toLocaleDateString() : "N/A"}
            </p>
            <p>
              <span className="label">Time:</span> {formatTimeAMPM(row.time)}
            </p>
            <p>
              <span className="label">Notes:</span> {row.notes || "—"}
            </p>
            <p>
              <span className="label">Status:</span> {row.status}
            </p>
          </div>
        ))}
        <div className="mb-3 d-flex gap-2">
          <button onClick={exportToExcel} className="btn btn-sm btn-success">
            Export to Excel
          </button>
          <button onClick={exportToPDF} className="btn btn-sm btn-danger">
            Export to PDF
          </button>
        </div>
      </div>

      <style jsx>{`
        .maintenance-report-container {
          padding: 1rem;
          font-size: 14px;
        }

        .table-scroll {
          max-height: 550px;
          overflow-y: auto;
        }

        .compact-table th,
        .compact-table td {
          padding: 6px 10px !important;
          font-size: 13px;
          vertical-align: middle;
        }

        .compact-table tbody tr:hover {
          background-color: #f1f9ff;
        }

        .card-wrapper {
          display: none;
        }

        .maintenance-card {
          background: #fff;
          border: 1px solid #ddd;
          border-left: 4px solid #198754;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          font-size: 14px;
        }

        .maintenance-card p {
          margin: 4px 0;
        }

        .maintenance-card .label {
          font-weight: 600;
          display: inline-block;
          width: 120px;
          color: #374151;
        }

        .maintenance-card .fw-bold {
          font-size: 16px;
          color: #198754;
        }

        .filter-container label,
        .filter-container .form-check-label {
          font-size: 13px;
        }

        .filter-container h6 {
          font-size: 14px;
          margin-bottom: 0.5rem;
        }

        .filter-container input[type="date"] {
          font-size: 13px;
          padding: 4px 8px;
          height: 32px;
        }

        @media (max-width: 768px) {
          .table-wrapper {
            display: none;
          }

          .card-wrapper {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminMaintenanceReportsForm;
