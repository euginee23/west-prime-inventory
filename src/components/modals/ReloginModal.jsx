import React from "react";

export default function ReLoginModal({ show, onReLogin }) {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Session Expired</h5>
          </div>
          <div className="modal-body">
            <p>Your session has expired. Please log in again.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onReLogin}>Re-login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
