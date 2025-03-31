import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import uploadReport from "../../utils/uploadReport";

const AdminPersonnelsReportsForm = () => {
  const [personnels, setPersonnels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [laboratories, setLaboratories] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPersonnels = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/reports/personnels`
        );
        setPersonnels(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Error fetching personnels:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLabs = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/laboratories`
        );
        const formatted = res.data.data.map(
          (lab) => `${lab.lab_name} (${lab.lab_number})`
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
    let filteredData = [...personnels];

    if (selectedLabs.length > 0) {
      filteredData = filteredData.filter((p) =>
        selectedLabs.includes(`${p.lab_name} (${p.lab_number})`)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(
        (p) => p.assignment_date && new Date(p.assignment_date) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(
        (p) => p.assignment_date && new Date(p.assignment_date) <= end
      );
    }

    setFiltered(filteredData);
  }, [personnels, selectedLabs, startDate, endDate]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const exportToExcel = async () => {
    try {
      setDownloading(true);

      const formatted = filtered.map((p, i) => ({
        "#": i + 1,
        "Full Name": p.full_name,
        Phone: p.phone,
        Email: p.email,
        Username: p.username,
        Assignment: p.assignment_status,
        Laboratory: `${p.lab_name} (${p.lab_number})`,
        "Assignment Date": p.assignment_date
          ? new Date(p.assignment_date).toLocaleDateString()
          : "N/A",
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel Report");

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
        reportName: "Personnel Report",
        reportType: "Personnel Report",
      });

      saveAs(blob, filename);
    } catch (err) {
      console.error("Excel export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setDownloading(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      autoTable(doc, {
        head: [
          [
            "#",
            "Full Name",
            "Phone",
            "Email",
            "Username",
            "Assignment",
            "Laboratory",
            "Assignment Date",
          ],
        ],
        body: filtered.map((p, i) => [
          i + 1,
          p.full_name,
          p.phone,
          p.email,
          p.username,
          p.assignment_status,
          `${p.lab_name} (${p.lab_number})`,
          p.assignment_date
            ? new Date(p.assignment_date).toLocaleDateString()
            : "N/A",
        ]),
        styles: {
          fontSize: 8,
          overflow: "linebreak",
          cellPadding: 1,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 },
          7: { cellWidth: 25 },
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        startY: 15,
        margin: { left: 10, right: 10 },
        pageBreak: "auto",
      });

      const pdfBlob = doc.output("blob");

      const filename = await uploadReport({
        buffer: pdfBlob,
        type: "pdf",
        reportName: "Personnel Report",
        reportType: "Personnel Report",
      });

      saveAs(pdfBlob, filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="personnel-report-container">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">PERSONNEL ASSIGNED LABORATORY</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="mb-3">
          {/* Filter by Laboratory Location */}
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <h6 className="mb-2">Filter by Laboratory:</h6>
            <div className="d-flex flex-wrap gap-2">
              {laboratories.map((lab, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedLabs.includes(lab)}
                    onChange={() => {
                      setSelectedLabs((prev) =>
                        prev.includes(lab)
                          ? prev.filter((l) => l !== lab)
                          : [...prev, lab]
                      );
                    }}
                  />
                  {lab}
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Assignment Date */}
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <h6 className="mb-2">Filter by Assignment Date:</h6>
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

          {/* Clear Filters */}
          <div className="text-end">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                setSelectedLabs([]);
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
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Username</th>
                <th>Assignment</th>
                <th>Lab</th>
                <th>Assignment Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.designation_id}>
                    <td>{p.user_id}</td>
                    <td>{p.full_name}</td>
                    <td>{p.phone}</td>
                    <td>{p.email}</td>
                    <td>{p.username}</td>
                    <td>{p.assignment_status}</td>
                    <td>
                      {p.lab_name} ({p.lab_number})
                    </td>
                    <td>
                      {p.assignment_date
                        ? new Date(p.assignment_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No personnel data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-3 d-flex gap-2">
          <button
            onClick={exportToExcel}
            className="btn btn-sm btn-success"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Export to Excel"}
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-sm btn-danger"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Export to PDF"}
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="card-wrapper">
        {filtered.map((p) => (
          <div className="personnel-card" key={p.designation_id}>
            <p className="fw-bold mb-2">
              #{p.user_id} - {p.full_name}
            </p>
            <p>
              <span className="label">Phone:</span> {p.phone}
            </p>
            <p>
              <span className="label">Email:</span> {p.email}
            </p>
            <p>
              <span className="label">Username:</span> {p.username}
            </p>
            <p>
              <span className="label">Assignment:</span> {p.assignment_status}
            </p>
            <p>
              <span className="label">Lab:</span> {p.lab_name} ({p.lab_number})
            </p>
            <p>
              <span className="label">Date:</span>{" "}
              {p.assignment_date
                ? new Date(p.assignment_date).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        ))}
        <div className="mb-3 d-flex gap-2">
          <button
            onClick={exportToExcel}
            className="btn btn-sm btn-success"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Export to Excel"}
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-sm btn-danger"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Export to PDF"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .personnel-report-container {
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

        .card-wrapper {
          display: none;
        }

        .personnel-card {
          background: #fff;
          border: 1px solid #ddd;
          border-left: 4px solid #0d6efd;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          font-size: 14px;
        }

        .personnel-card p {
          margin: 4px 0;
        }

        .personnel-card .label {
          font-weight: 600;
          display: inline-block;
          width: 110px;
          color: #374151;
        }

        .personnel-card .fw-bold {
          font-size: 16px;
          color: #0d6efd;
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

export default AdminPersonnelsReportsForm;
