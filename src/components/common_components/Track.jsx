import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import ReactLoading from "react-loading";
import ViewTrackedEquipmentModal from "../modals/ViewTrackedEquipmentModal";

const Track = () => {
  const [loading, setLoading] = useState(false);
  const [scannedActions, setScannedActions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    fetchScannedActions();
  }, []);

  const fetchScannedActions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/scanned-equipment-actions`
      );
      setScannedActions(response.data);
      setFilteredResults(response.data);
    } catch (error) {
      console.error("Error fetching scanned actions:", error);
      toast.error("Failed to load scanned actions.");
    } finally {
      setLoading(false);
    }
  };

  // Handle search by tracking code
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResults(scannedActions);
      return;
    }
    const filtered = scannedActions.filter((action) =>
      action.tracking_code.includes(searchQuery.trim())
    );
    setFilteredResults(filtered);
  };

  return (
    <div className="container mt-3">
      <Card className="shadow-sm p-3">

        {/* Search Bar */}
        <div className="d-flex mb-2">
          <Form.Control
            type="text"
            placeholder="Enter Tracking Code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="me-2"
          />
          <Button variant="primary" onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="d-flex justify-content-center py-3">
            <ReactLoading type="spin" color="#007bff" height={40} width={40} />
          </div>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead className="table-dark text-center">
              <tr>
                <th>#</th>
                <th>Tracking Code</th>
                <th>Action</th>
                <th>Status</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((action, index) => (
                  <tr key={action.action_id} className="text-center">
                    <td>{index + 1}</td>
                    <td>{action.tracking_code}</td>
                    <td>{action.transaction_type}</td>
                    <td>{action.status}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => setSelectedAction(action)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* View Equipment Modal */}
      {selectedAction && (
        <ViewTrackedEquipmentModal
        show={!!selectedAction}
        onClose={() => setSelectedAction(null)}
        trackingCode={selectedAction?.tracking_code}
      />      
      )}
    </div>
  );
};

export default Track;
