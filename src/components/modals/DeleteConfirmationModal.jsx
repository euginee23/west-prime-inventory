import React from "react";
import { FaTrash } from "react-icons/fa";

const DeleteConfirmationModal = ({ deleteId, confirmText, setConfirmText, onCancel, onConfirm }) => {
  if (!deleteId) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold text-danger">
              Confirm Personnel Removal
            </h6>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted small">
              Are you sure you want to remove this personnel? This action cannot be undone.
              <br />
              <strong>Type: <code>confirm-remove</code> to proceed.</strong>
            </p>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Type: confirm-remove"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={onConfirm}
              disabled={confirmText !== "confirm-remove"}
            >
              <FaTrash /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
