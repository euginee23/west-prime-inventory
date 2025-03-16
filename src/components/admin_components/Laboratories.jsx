import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlus, FaList, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "react-loading";
import ViewLaboratoryModal from "../modals/ViewLaboratoryModal";
import LaboratoryDeleteConfirmationModal from "../modals/LaboratoryDeleteConfirmationModal";

export default function Laboratories({ setActiveSection }) {
  const [laboratories, setLaboratories] = useState([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [selectedLab, setSelectedLab] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      setIsFetching(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/laboratories`
      );

      if (Array.isArray(response.data)) {
        setLaboratories(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setLaboratories(response.data.data);
      } else {
        setLaboratories([]);
      }
    } catch (err) {
      console.error("Error fetching laboratories:", err);
      toast.error("Failed to load laboratories.");
      setLaboratories([]);
    } finally {
      setIsFetching(false);
    }
  };

  const filteredLaboratories = laboratories.filter((lab) => {
    const query = searchQuery.toLowerCase().trim();
    const labName = lab.lab_name.toLowerCase().trim();
    const labNumber = String(lab.lab_number).toLowerCase().trim();
    const combinedName = `${lab.lab_name} - ${lab.lab_number}`
      .toLowerCase()
      .trim();
    const altCombinedName = `${lab.lab_name} ${lab.lab_number}`
      .toLowerCase()
      .trim();
    const onlyNumber = labNumber.replace(/\D/g, "");

    return (
      query === "" ||
      labName.includes(query) ||
      labNumber.includes(query) ||
      combinedName.includes(query) ||
      altCombinedName.includes(query) ||
      onlyNumber.includes(query) 
    );
  });

  const handleDeleteLaboratory = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/laboratories/${deleteId}`
      );
      toast.success("Laboratory deleted successfully!");
      fetchLaboratories();
    } catch (err) {
      console.error("Error deleting laboratory:", err);
      toast.error("Failed to delete laboratory.");
    } finally {
      setDeleteId(null);
      setConfirmText("");
    }
  };

  const handleAddLaboratory = async () => {
    if (!name || !number) {
      toast.warn("Both fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/laboratories`, {
        name,
        number,
      });
      toast.success("Laboratory added successfully!");
      setName("");
      setNumber("");
      fetchLaboratories();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(
          "Laboratory number already exists. Please use a unique number."
        );
      } else {
        toast.error("Failed to add laboratory.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLaboratory = (lab) => {
    setSelectedLab(lab);
    setShowViewModal(true);
  };

  return (
    <div
      className="container-fluid px-2"
      style={{ maxWidth: "1100px", margin: "auto" }}
    >
      <ToastContainer />

      <ViewLaboratoryModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        laboratory={selectedLab}
        setActiveSection={setActiveSection}
      />

      <LaboratoryDeleteConfirmationModal
        deleteId={deleteId}
        confirmText={confirmText}
        setConfirmText={setConfirmText}
        onCancel={() => {
          setDeleteId(null);
          setConfirmText("");
        }}
        onConfirm={handleDeleteLaboratory}
      />

      {/* Top: Search */}
      <div className="card p-2 shadow-sm mb-2">
        <div className="row g-2">
          <div className="col-12">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search by Laboratory Name or Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row g-2">
        {/* Left: Add Laboratory Form */}
        <div className="col-12 col-md-5">
          <div className="card p-3 shadow-sm">
            <h6 className="text-primary mb-2">Add New Laboratory</h6>

            <div className="mb-2">
              <label className="fw-bold small">Laboratory Name</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Enter Laboratory Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="fw-bold small">Laboratory Number</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Enter Laboratory Number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>

            <button
              className="btn btn-success btn-sm w-100"
              onClick={handleAddLaboratory}
              disabled={isLoading}
            >
              {isLoading ? (
                "Adding..."
              ) : (
                <>
                  <FaPlus /> Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Laboratory List */}
        <div className="col-12 col-md-7">
          <div className="card p-3 shadow-sm">
            <h6 className="text-primary mb-2">
              <FaList className="me-2" /> List of Laboratories
            </h6>

            {isFetching ? (
              <div className="d-flex justify-content-center">
                <Loading type="spin" color="#28a745" height={40} width={40} />
              </div>
            ) : Array.isArray(laboratories) && laboratories.length === 0 ? (
              <p className="text-muted text-center small">
                No laboratories have been added yet.
              </p>
            ) : (
              <ul className="list-group list-group-flush small">
                {filteredLaboratories.length === 0 ? (
                  <p className="text-muted text-center small">
                    No matching laboratories found.
                  </p>
                ) : (
                  filteredLaboratories.map((lab) => (
                    <li
                      key={lab.lab_id}
                      className="list-group-item d-flex justify-content-between align-items-center p-2"
                    >
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-truncate">
                          {lab.lab_name.trim()}{" "}
                          <span className="text-muted">
                            - {" "} {String(lab.lab_number).trim()}
                          </span>
                        </span>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewLaboratory(lab)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteId(lab.lab_id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
