import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlus, FaList } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "react-loading";

export default function Laboratories() {
  const [laboratories, setLaboratories] = useState([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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
      console.error("❌ Error fetching laboratories:", err);
      toast.error("Failed to load laboratories.");
      setLaboratories([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddLaboratory = async () => {
    if (!name || !number) {
      toast.warn("⚠️ Both fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/laboratories`, {
        name,
        number,
      });
      toast.success("✅ Laboratory added successfully!");
      setName("");
      setNumber("");
      fetchLaboratories();
    } catch (err) {
      console.error("❌ Error adding laboratory:", err);
      toast.error("❌ Failed to add laboratory.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container mt-3"
      style={{ maxWidth: "900px", margin: "auto" }}
    >
      <ToastContainer />

      <div className="row g-2">
        {/* Left: Add Laboratory Form */}
        <div className="col-12 col-md-5">
          <div className="card p-3 shadow-sm">
            <h6 className="text-primary mb-2">Add New Laboratory</h6>
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Laboratory Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Laboratory Number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
              <div className="col-12">
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
                {Array.isArray(laboratories) &&
                  laboratories.map((lab) => (
                    <li
                      key={lab.lab_id}
                      className="list-group-item d-flex justify-content-between align-items-center p-2"
                    >
                      <span className="fw-bold text-truncate">
                        {lab.lab_name}
                      </span>
                      <span className="text-muted">#{lab.lab_number}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
