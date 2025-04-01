import React from "react";
import { Modal, Table, Button } from "react-bootstrap";

const DashboardEquipmentListModal = ({ show, onHide, title, equipments }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header className="py-2 bg-secondary text-white">
        <Modal.Title className="fs-6">{title}</Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onHide}
        ></button>
      </Modal.Header>

      <Modal.Body className="p-3">
        {equipments.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div
              className="d-none d-md-block"
              style={{
                maxHeight: equipments.length > 20 ? "720px" : "none",
                overflowY: equipments.length > 20 ? "auto" : "visible",
              }}
            >
              <Table
                striped
                bordered
                hover
                responsive
                size="sm"
                className="mb-0"
                style={{ fontSize: "0.78rem" }}
              >
                <thead className="table-dark text-center">
                  <tr>
                    <th style={{ padding: "6px" }}>#</th>
                    <th style={{ padding: "6px" }}>Equipment</th>
                    <th style={{ padding: "6px" }}>Type</th>
                    <th style={{ padding: "6px" }}>Brand</th>
                    <th style={{ padding: "6px" }}>Lab</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((eq, index) => (
                    <tr
                      key={eq.id || index}
                      className="text-center align-middle"
                    >
                      <td style={{ padding: "6px" }}>{index + 1}</td>
                      <td style={{ padding: "6px" }}>{eq.name}</td>
                      <td style={{ padding: "6px" }}>{eq.type}</td>
                      <td style={{ padding: "6px" }}>{eq.brand}</td>
                      <td style={{ padding: "6px" }}>{eq.lab}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Mobile Card List */}
            <div className="d-block d-md-none">
              {equipments.map((eq, index) => (
                <div
                  key={eq.id || index}
                  className="border rounded p-2 mb-2 shadow-sm bg-light"
                  style={{ fontSize: "0.85rem" }}
                >
                  <div className="fw-bold mb-1">
                    #{index + 1} - {eq.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {eq.type}
                  </div>
                  <div>
                    <strong>Brand:</strong> {eq.brand}
                  </div>
                  <div>
                    <strong>Lab:</strong> {eq.lab}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted mt-3 mb-3">
            No equipment data found.
          </p>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2 bg-light">
        <Button variant="secondary" onClick={onHide} size="sm">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DashboardEquipmentListModal;
