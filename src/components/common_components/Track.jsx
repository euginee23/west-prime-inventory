import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button } from "react-bootstrap";
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
    <div className="container mt-2 px-1" style={{ maxWidth: "1100px", margin: "auto" }}>
      <Card className="shadow-sm p-2">
        
        {/* Search Bar - More Compact */}
        <div className="d-flex flex-column flex-md-row gap-1 mb-2">
          <Form.Control
            type="text"
            placeholder="Enter Tracking Code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow-1"
            size="sm"
          />
          <Button variant="primary" onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>

        {/* Table - More Compact */}
        {loading ? (
          <div className="d-flex justify-content-center py-2">
            <ReactLoading type="spin" color="#007bff" height={25} width={25} />
          </div>
        ) : (
          <Table striped bordered hover responsive size="sm" className="text-center small mb-0">
            <thead className="table-dark">
              <tr>
                <th className="p-1">#</th>
                <th className="p-1 text-nowrap">Tracking Code</th>
                <th className="p-1">Action</th>
                <th className="p-1">Status</th>
                <th className="p-1">View</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((action, index) => (
                  <tr key={action.action_id}>
                    <td className="p-1">{index + 1}</td>
                    <td className="p-1 text-nowrap">{action.tracking_code}</td>
                    <td className="p-1">{action.transaction_type}</td>
                    <td className="p-1">{action.status}</td>
                    <td className="p-1">
                      <Button
                        variant="info"
                        size="sm"
                        className="px-2 py-0"
                        onClick={() => setSelectedAction(action)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted p-2">
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
