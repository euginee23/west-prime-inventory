import React, { useEffect, useState } from "react";
import axios from "axios";
import { getLoggedInUser } from "../../utils/auth";

const AdminReportsLogForm = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personnels, setPersonnels] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, personnelsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/report-files`, {
            headers,
          }),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/personnels-and-admins`,
            { headers }
          ),
        ]);

        setLogs(logsRes.data);
        setFiltered(logsRes.data);
        setPersonnels(personnelsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let updated = [...logs];

    if (selectedPersonnel.length > 0) {
      updated = updated.filter((log) =>
        selectedPersonnel.includes(log.full_name)
      );
    }

    if (selectedTypes.length > 0) {
      updated = updated.filter((log) =>
        selectedTypes.includes(log.type.toLowerCase())
      );
    }

    setFiltered(updated);
  }, [selectedPersonnel, selectedTypes, logs]);

  const handlePersonnelChange = (name) => {
    setSelectedPersonnel((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleFileTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSelectedPersonnel([]);
    setSelectedTypes([]);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/report-files/download/${fileId}`,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
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
    <div className="report-log-container">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">REPORT LOGS</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="mb-3">
          {/* Filter by Personnel */}
          {getLoggedInUser()?.role === "Admin" && (
            <div className="p-3 border rounded bg-light mb-3">
              <strong>Filter by Personnel:</strong>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {personnels.map((person) => (
                  <label key={person.user_id} className="form-check-label me-3">
                    <input
                      type="checkbox"
                      className="form-check-input me-1"
                      checked={selectedPersonnel.includes(person.name)}
                      onChange={() => handlePersonnelChange(person.name)}
                    />
                    {person.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filter by File Type */}
          <div className="p-3 border rounded bg-light mb-3">
            <strong>Filter by File Type:</strong>
            <div className="d-flex flex-wrap gap-3 mt-2">
              {["excel", "pdf"].map((type) => (
                <label key={type} className="form-check-label me-3">
                  <input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleFileTypeChange(type)}
                  />
                  {type.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="text-end">
            <button
              className="btn btn-sm btn-danger"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper d-none d-lg-block">
        <div className="table-scroll">
          <table className="table table-bordered table-hover compact-table">
            <thead className="table-light sticky-top">
              <tr>
                <th>ID</th>
                <th>File Name</th>
                <th>Generated By</th>
                <th>Report Type</th>
                <th>File Type</th>
                <th>Date Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.file_id}>
                    <td>{log.file_id}</td>
                    <td>{log.file_name}</td>
                    <td>{log.full_name}</td>
                    <td>{log.report_type}</td>
                    <td className="text-uppercase">{log.type}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() =>
                          handleDownload(log.file_id, log.file_name)
                        }
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No report logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="d-lg-none">
        {filtered.length > 0 ? (
          filtered.map((log) => (
            <div
              key={log.file_id}
              className="card mb-3 shadow-sm border rounded"
            >
              <div className="card-body p-3">
                <p className="mb-1">
                  <strong>ID:</strong> {log.file_id}
                </p>
                <p className="mb-1">
                  <strong>File Name:</strong> {log.file_name}
                </p>
                <p className="mb-1">
                  <strong>Generated By:</strong> {log.full_name}
                </p>
                <p className="mb-1">
                  <strong>Report Type:</strong> {log.report_type}
                </p>
                <p className="mb-1">
                  <strong>File Type:</strong> {log.type.toUpperCase()}
                </p>
                <p className="mb-2">
                  <strong>Date Created:</strong>{" "}
                  {new Date(log.created_at).toLocaleString()}
                </p>
                <div className="text-end">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleDownload(log.file_id, log.file_name)}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted text-center">No report logs found.</div>
        )}
      </div>

      <style jsx>{`
        .report-log-container {
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

        .compact-table td:last-child,
        .compact-table th:last-child {
          text-align: center;
        }

        @media (max-width: 991px) {
          .report-log-container {
            padding: 0.5rem;
          }

          .card {
            font-size: 13px;
          }

          .card-body p {
            margin-bottom: 6px;
          }

          .card .btn {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminReportsLogForm;
