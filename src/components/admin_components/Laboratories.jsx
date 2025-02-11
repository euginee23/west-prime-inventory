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
  const [isFetching, setIsFetching] = useState(true); // Added for data loading state

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      setIsFetching(true); // Start loading
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
      setIsFetching(false); // Stop loading
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
      fetchLaboratories(); // Refresh list after adding
    } catch (err) {
      console.error("❌ Error adding laboratory:", err);
      toast.error("❌ Failed to add laboratory.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <ToastContainer />

      {/* Add Laboratory Form */}
      <div className="card p-4 shadow-sm mt-4">
        <h4 className="mb-3 text-primary">Add New Laboratory</h4>
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Laboratory Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Laboratory Number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2">
            <button
              className="btn btn-success w-100"
              onClick={handleAddLaboratory}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : <>
                <FaPlus /> Add
              </>}
            </button>
          </div>
        </div>
      </div>

      {/* Laboratory List */}
      <div className="card p-4 shadow-sm mt-4">
        <h4 className="mb-3 text-primary">
          <FaList className="me-2" /> List of Laboratories
        </h4>

        {isFetching ? (
          <div className="d-flex justify-content-center">
            <Loading type="spin" color="#28a745" height={50} width={50} />
          </div>
        ) : Array.isArray(laboratories) && laboratories.length === 0 ? (
          <p className="text-muted text-center">
            No laboratories have been added yet.
          </p>
        ) : (
          <ul className="list-group">
            {Array.isArray(laboratories) &&
              laboratories.map((lab) => (
                <li
                  key={lab.lab_id}
                  className="list-group-item d-flex flex-column flex-md-row justify-content-between text-center text-md-start"
                >
                  <strong>{lab.lab_name}</strong> 
                  <span className="text-muted">#{lab.lab_number}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
