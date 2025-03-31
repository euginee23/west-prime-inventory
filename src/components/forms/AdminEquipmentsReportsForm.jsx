import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import uploadReport from "../../utils/uploadReport";

const AdminEquipmentsForm = () => {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState({
    availability_status: [],
    type: [],
    brand: [],
    operational_status: [],
  });

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/reports/equipments`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setEquipments(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching equipments:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...equipments];
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        result = result.filter((item) => values.includes(item[key]));
      }
    });
    setFiltered(result);
  }, [filters, equipments]);

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

  const FilterCheckboxGroup = ({
    label,
    name,
    options,
    selected,
    onChange,
  }) => (
    <div className="filter-container p-3 border rounded bg-light mb-3">
      <h6 className="mb-2">{label}:</h6>
      <div className="d-flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="form-check-label me-3">
            <input
              type="checkbox"
              className="form-check-input me-1"
              value={opt}
              checked={selected.includes(opt)}
              onChange={(e) => {
                const value = e.target.value;
                const isChecked = e.target.checked;
                onChange(
                  name,
                  isChecked
                    ? [...selected, value]
                    : selected.filter((v) => v !== value)
                );
              }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );

  const handleMultiFilterChange = (key, values) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  const resetFilters = () => {
    setFilters({
      availability_status: [],
      type: [],
      brand: [],
      operational_status: [],
    });
  };

  const exportToExcel = async () => {
    try {
      setDownloading(true);

      const formatted = filtered.map((eq, i) => ({
        ID: i + 1,
        Name: eq.name,
        Number: eq.number,
        Type: eq.type,
        Brand: eq.brand,
        "Operational Status": eq.operational_status,
        "Availability Status": eq.availability_status,
        "Date Added": new Date(eq.created_at).toLocaleDateString("en-US"),
        "Laboratory Location": eq.lab_name
          ? `${eq.lab_name} (#${eq.lab_number})`
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      worksheet["!cols"] = Object.keys(formatted[0]).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...formatted.map((row) => row[key]?.toString().length || 0)
          ) + 2,
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Report");

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
        reportName: "Equipment Report",
        reportType: "Equipments Report",
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

      const doc = new jsPDF();
      autoTable(doc, {
        head: [
          [
            "#",
            "Name",
            "Number",
            "Type",
            "Operational",
            "Availability",
            "Brand",
            "Laboratory",
            "Date Added",
          ],
        ],
        body: filtered.map((eq, i) => [
          i + 1,
          eq.name,
          eq.number,
          eq.type,
          eq.operational_status,
          eq.availability_status,
          eq.brand,
          eq.laboratory || "N/A",
          new Date(eq.created_at).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
        ]),
      });

      const pdfBlob = doc.output("blob");

      const filename = await uploadReport({
        buffer: pdfBlob,
        type: "pdf",
        reportName: "Equipment Report",
        reportType: "Equipments Report",
      });

      saveAs(pdfBlob, filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="equipment-report-container">
      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">EQUIPMENTS</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-3">
            <FilterCheckboxGroup
              label="Availability Status"
              name="availability_status"
              options={[
                "In-Use",
                "Available",
                "Maintenance",
                "Being Maintained",
                "Lost",
              ]}
              selected={filters.availability_status}
              onChange={handleMultiFilterChange}
            />
            <FilterCheckboxGroup
              label="Type"
              name="type"
              options={[
                "Computer Accessory",
                "Printer / Scanner",
                "Computer Hardware",
                "Networking Equipment",
                "Laboratory Equipment",
                "Office Equipment",
                "Multimedia Device",
                "Others",
              ]}
              selected={filters.type}
              onChange={handleMultiFilterChange}
            />
            <FilterCheckboxGroup
              label="Brand"
              name="brand"
              options={[
                "Acer",
                "Asus",
                "Dell",
                "Epson",
                "Altos",
                "HP",
                "Lenovo",
                "Apple",
                "Samsung",
                "MSI",
                "Brother",
                "Canon",
                "Logitech",
              ]}
              selected={filters.brand}
              onChange={handleMultiFilterChange}
            />
            <FilterCheckboxGroup
              label="Operational Status"
              name="operational_status"
              options={["Operational", "Defective", "Damaged"]}
              selected={filters.operational_status}
              onChange={handleMultiFilterChange}
            />
            <div className="text-end">
              <button className="btn btn-sm btn-danger" onClick={resetFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table table-bordered table-hover compact-table">
            <thead className="table-light sticky-top">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Number</th>
                <th>Type</th>
                <th>Operational</th>
                <th>Availability</th>
                <th>Brand</th>
                <th>Laboratory</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((eq, index) => (
                  <tr key={eq.equipment_id}>
                    <td>{index + 1}</td>
                    <td>{eq.name}</td>
                    <td>{eq.number}</td>
                    <td>{eq.type}</td>
                    <td>{eq.operational_status}</td>
                    <td>{eq.availability_status}</td>
                    <td>{eq.brand}</td>
                    <td>{eq.laboratory || "N/A"}</td>
                    <td>
                      {new Date(eq.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted">
                    No data found.
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
        {filtered.map((eq, index) => (
          <div className="equipment-card" key={eq.equipment_id}>
            <p className="fw-bold mb-2">
              {index + 1}. {eq.name}
            </p>
            <p>
              <span className="label">Number:</span>{" "}
              <span className="value">{eq.number}</span>
            </p>
            <p>
              <span className="label">Type:</span>{" "}
              <span className="value">{eq.type}</span>
            </p>
            <p>
              <span className="label">Brand:</span>{" "}
              <span className="value">{eq.brand}</span>
            </p>
            <p>
              <span className="label">Status:</span>{" "}
              <span className="value">{eq.operational_status}</span>
            </p>
            <p>
              <span className="label">Availability:</span>{" "}
              <span className="value">{eq.availability_status}</span>
            </p>
            <p>
              <span className="label">Lab:</span>{" "}
              <span className="value">{eq.laboratory || "N/A"}</span>
            </p>
            <p className="text-muted small">
              {new Date(eq.created_at).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
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
        .equipment-report-container {
          padding: 1rem;
          font-size: 14px;
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

        .table-scroll {
          max-height: 550px;
          overflow-y: auto;
        }

        .card-wrapper {
          display: none;
        }

        .equipment-card {
          background: #ffffff;
          border: 1px solid #ddd;
          border-left: 4px solid #007bff;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .filter-group {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 10px;
          font-size: 13px;
        }

        .filter-label {
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 3px;
          font-weight: 400;
        }

        .filters-dropdown {
          position: relative;
          z-index: 10;
          border: 1px solid #dee2e6;
          max-height: 300px;
          overflow-y: auto;
        }

        .filter-group {
          margin-bottom: 1rem;
        }

        .filter-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
          display: block;
        }

        .filter-group label {
          display: block;
          font-size: 13px;
          margin-left: 0.5rem;
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

          .equipment-card {
            font-size: 14px;
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
          }

          .equipment-card p {
            margin: 4px 0;
          }

          .equipment-card .label {
            font-weight: 600;
            margin-right: 4px;
            display: inline-block;
            width: 100px;
            color: #374151;
          }

          .equipment-card .value {
            color: #1f2937;
          }

          .equipment-card .fw-bold {
            font-size: 16px;
            color: #0d6efd;
          }

          .equipment-card .text-muted {
            font-size: 12px;
            margin-top: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminEquipmentsForm;
