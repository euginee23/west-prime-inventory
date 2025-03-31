import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import uploadReport from "../../utils/uploadReport";

const AdminTransactionReportsForm = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personnels, setPersonnels] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [laboratories, setLaboratories] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [statusTypes, setStatusTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [returnStartDate, setReturnStartDate] = useState("");
  const [returnEndDate, setReturnEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnRes, usersRes, labsRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/reports/transactions`
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/personnels-and-admins`
          ),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/laboratories`),
        ]);
        const uniqueTypes = [
          ...new Set(txnRes.data.map((t) => t.transaction_type)),
        ];
        const uniqueStatuses = [
          ...new Set(txnRes.data.map((t) => t.status).filter(Boolean)),
        ];

        setStatusTypes(uniqueStatuses);
        setTransactionTypes(uniqueTypes);
        setTransactions(txnRes.data);
        setFiltered(txnRes.data);
        setPersonnels(usersRes.data);

        const formattedLabs = labsRes.data.data.map(
          (lab) => `${lab.lab_name} (#${lab.lab_number})`
        );
        setLaboratories(formattedLabs);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filteredData = transactions;

    if (selectedPersonnel.length > 0) {
      filteredData = filteredData.filter((t) =>
        selectedPersonnel.includes(t.handled_by)
      );
    }

    if (selectedLabs.length > 0) {
      filteredData = filteredData.filter((t) =>
        selectedLabs.includes(t.laboratory_location)
      );
    }

    if (selectedTypes.length > 0) {
      filteredData = filteredData.filter((t) =>
        selectedTypes.includes(t.transaction_type)
      );
    }

    if (selectedStatuses.length > 0) {
      filteredData = filteredData.filter((t) =>
        selectedStatuses.includes(t.status)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(
        (t) => t.date && new Date(t.date) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter((t) => new Date(t.date) <= end);
    }

    if (returnStartDate) {
      const returnStart = new Date(returnStartDate);
      returnStart.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(
        (t) => t.return_datetime && new Date(t.return_datetime) >= returnStart
      );
    }

    if (returnEndDate) {
      const returnEnd = new Date(returnEndDate);
      returnEnd.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(
        (t) => t.return_datetime && new Date(t.return_datetime) <= returnEnd
      );
    }

    setFiltered(filteredData);
  }, [
    selectedPersonnel,
    selectedLabs,
    selectedTypes,
    selectedStatuses,
    startDate,
    endDate,
    returnStartDate,
    returnEndDate,
    transactions,
  ]);

  const handleCheckboxChange = (name) => {
    setSelectedPersonnel((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleStatusChange = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const exportToExcel = async () => {
    try {
      setDownloading(true);

      const formatted = filtered.map((t, i) => ({
        "#": i + 1,
        Equipment: t.equipment,
        "Lab Location": t.laboratory_location,
        "Handled By": t.handled_by,
        Client: t.client,
        "Tracking Code": t.tracking_code,
        Reason: t.reason,
        "Transaction Type": t.transaction_type,
        Date: new Date(t.date).toLocaleDateString(),
        Time: t.time,
        "Return Date & Time": t.return_datetime
          ? new Date(t.return_datetime).toLocaleString()
          : "N/A",
        Status: t.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);

      // 👇 Auto-fit column widths based on content length
      const maxColWidths = Object.keys(formatted[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...formatted.map((row) => (row[key] ? row[key].toString().length : 0))
        );
        return { wch: maxLength + 2 }; // +2 for padding
      });
      worksheet["!cols"] = maxColWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction Report");

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
        reportName: "Transaction Report",
        reportType: "Transactions Report",
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
            "Client",
            "Code",
            "Reason",
            "Type",
            "Date",
            "Time",
            "Returned",
            "Status",
          ],
        ],
        body: filtered.map((t, i) => [
          i + 1,
          t.equipment,
          t.laboratory_location,
          t.handled_by,
          t.client,
          t.tracking_code,
          t.reason,
          t.transaction_type,
          new Date(t.date).toLocaleDateString(),
          t.time,
          t.return_datetime
            ? new Date(t.return_datetime).toLocaleString()
            : "N/A",
          t.status,
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
          3: { cellWidth: 1.1 },
          4: { cellWidth: 1.0 },
          5: { cellWidth: 1.5 },
          6: { cellWidth: 2.1 },
          7: { cellWidth: 0.9 },
          8: { cellWidth: 0.8 },
          9: { cellWidth: 0.6 },
          10: { cellWidth: 1.3 },
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
        reportName: "Transaction Report",
        reportType: "Transactions Report",
      });

      saveAs(pdfBlob, filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

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

  return (
    <div className="transaction-report-container">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">TRANSACTIONS</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      {showFilters && (
        <div className="mb-3">
          <div className="filter-container p-3 border rounded bg-light">
            <div className="d-flex flex-wrap gap-2">
              {personnels.map((person) => (
                <label key={person.user_id} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedPersonnel.includes(person.name)}
                    onChange={() => handleCheckboxChange(person.name)}
                  />
                  {person.name}
                </label>
              ))}
            </div>
          </div>
          <h6 className="mt-2">Filter by Laboratory Location:</h6>
          <div className="filter-container p-3 border rounded bg-light mb-3">
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
          <h6 className="mb-2">Filter by Transaction Type:</h6>
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <div className="d-flex flex-wrap gap-2">
              {transactionTypes.map((type, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedTypes.includes(type)}
                    onChange={() => {
                      setSelectedTypes((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type]
                      );
                    }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          <h6 className="mb-2">Filter by Status:</h6>
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <div className="d-flex flex-wrap gap-2">
              {statusTypes.map((status, index) => (
                <label key={index} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusChange(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
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
          <h6 className="mb-2">Filter by Return Date:</h6>
          <div className="filter-container p-3 border rounded bg-light mb-3">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Start Return Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={returnStartDate}
                  onChange={(e) => setReturnStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">End Return Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={returnEndDate}
                  onChange={(e) => setReturnEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

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
                setReturnStartDate("");
                setReturnEndDate("");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table table-bordered table-hover compact-table">
            <thead className="table-light sticky-top">
              <tr>
                <th>ID</th>
                <th>Equipment</th>
                <th>Laboratory Location</th>
                <th>Handled By</th>
                <th>Client</th>
                <th>Tracking Code</th>
                <th>Reason</th>
                <th>Transaction Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Return Date & Time</th>
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
                    <td>{row.client}</td>
                    <td>{row.tracking_code}</td>
                    <td>{row.reason}</td>
                    <td>{row.transaction_type}</td>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>{row.time}</td>
                    <td>
                      {row.return_datetime
                        ? new Date(row.return_datetime).toLocaleString()
                        : "N/A"}
                    </td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-center text-muted">
                    No transaction data found.
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
        {filtered.map((row) => (
          <div className="transaction-card" key={row.id}>
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
              <span className="label">Client:</span> {row.client}
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
              {new Date(row.date).toLocaleDateString()}
            </p>
            <p>
              <span className="label">Time:</span> {row.time}
            </p>
            <p>
              <span className="label">Returned:</span>{" "}
              {row.return_datetime
                ? new Date(row.return_datetime).toLocaleString()
                : "N/A"}
            </p>
            <p>
              <span className="label">Status:</span> {row.status}
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
        .transaction-report-container {
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

        .transaction-card {
          background: #fff;
          border: 1px solid #ddd;
          border-left: 4px solid #007bff;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          font-size: 14px;
        }

        .transaction-card p {
          margin: 4px 0;
        }

        .transaction-card .label {
          font-weight: 600;
          display: inline-block;
          width: 120px;
          color: #374151;
        }

        .transaction-card .fw-bold {
          font-size: 16px;
          color: #0d6efd;
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

export default AdminTransactionReportsForm;
