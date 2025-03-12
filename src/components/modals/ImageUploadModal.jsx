import React from "react";
import { createPortal } from "react-dom";

export default function ImageUploadModal({ onClose, onOpenCamera, onUploadImage }) {
  return createPortal(
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        zIndex: 1070, 
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.6)", 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        style={{ zIndex: 1080 }} 
      >
        <div className="modal-content p-4 text-center">
          <h5 className="modal-title mb-3">Select an Option</h5>

          <button className="btn btn-primary w-100 mb-2" onClick={onOpenCamera}>
            📷 Open Camera
          </button>

          <input
            type="file"
            accept="image/*"
            onChange={onUploadImage}
            id="fileUpload"
            className="d-none"
          />
          <label htmlFor="fileUpload" className="btn btn-secondary w-100 mb-2">
            📁 Upload Image
          </label>

          <button className="btn btn-danger w-100 mt-2" onClick={onClose}>
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
