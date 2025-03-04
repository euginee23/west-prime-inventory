import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { Card, Button } from "react-bootstrap";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import beepSound from "../../assets/beep.mp3";
import ImageViewerModal from "../modals/ImageViewerModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";
import ReturnEquipmentModal from "../modals/ReturnEquipmentModal";

const ScanEquipment = () => {
  const [scanResult, setScanResult] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  const [scannerSize, setScannerSize] = useState({ width: 250, height: 180 });
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const [selectedAction, setSelectedAction] = useState("");
  const [searchNumber, setSearchNumber] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const updateScannerSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 576) {
        setScannerSize({ width: 200, height: 150 });
      } else if (screenWidth < 768) {
        setScannerSize({ width: 230, height: 170 });
      } else {
        setScannerSize({ width: 250, height: 180 });
      }
    };

    updateScannerSize();
    window.addEventListener("resize", updateScannerSize);
    return () => window.removeEventListener("resize", updateScannerSize);
  }, []);

  const equipmentActions = [
    "Classroom Use - Equipment is used in a classroom setting for teaching.",
    "Student Project - Assigned to students for a project or research.",
    "Faculty Use - Used by teachers for lesson planning or instructional activities.",
    "Laboratory Session - Allocated for ICT laboratory use.",
    "Routine Maintenance - Checked or serviced for preventive maintenance.",
    "Software Update - Equipment is updated with the latest software and security patches.",
    "Repair - Sent for repair due to hardware or software issues.",
    "External Training - Borrowed for workshops, training, or seminars.",
    "Borrowed by Faculty - Temporarily taken by a teacher for official use.",
    "Borrowed by Student - Temporarily loaned to a student for academic purposes.",
    "Equipment Return - Returned after use to the storage or lab inventory.",
    "Decommissioning - The equipment is outdated and removed from use.",
    "Disposal/Recycling - The equipment is no longer functional and will be recycled.",
    "Lost/Stolen Report - The equipment is missing or stolen and needs to be reported.",
  ];

  const fetchEquipmentDetails = async (qrData) => {
    if (!qrData || isNaN(qrData)) {
      setError("Invalid QR Code. Please scan a valid equipment QR.");
      setEquipment(null);
      setIsScanning(true);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${qrData}`
      );

      setEquipment(response.data);
      setError("");

      if (response.data.availability_status === "Checked Out") {
        setShowReturnModal(true);
      }
    } catch (err) {
      setError("Equipment not found or invalid QR code.");
      setEquipment(null);
    }

    setLoading(false);

    setTimeout(() => {
      setIsScanning(true);
    }, 1500);
  };

  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      toast.warn("Please enter an equipment number.", {
        position: "top-center",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/search/${searchNumber}`
      );

      if (response.data.found) {
        setEquipment(response.data.equipment);
        setError("");
        setIsScanning(false);
      } else {
        setEquipment(null);
        toast.info("No equipment found with that number.", {
          position: "top-center",
        });
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
      setEquipment(null);
      toast.error("Something went wrong. Please try again.", {
        position: "top-center",
      });
      setIsScanning(true);
    }

    setSearchNumber("");
    setLoading(false);
  };

  const handleScan = (data) => {
    if (data && isScanning) {
      const scannedData = data.text.trim();
      setScanResult(scannedData);
      setIsScanning(false);

      const audio = new Audio(beepSound);
      audio.play().catch((err) => console.log("Playback failed:", err));

      fetchEquipmentDetails(scannedData);
    }
  };

  const handleClear = () => {
    setEquipment(null);
    setError("");
    setScanResult(null);
    setSearchNumber("");
    setSelectedAction("");
    setShowConfirmModal(false);
    setShowReturnModal(false);
    setIsScanning(false);
    toast.info("Scan reset successfully.", { position: "top-center" });
  
    setTimeout(() => {
      setIsScanning(true);
    }, 500); 
  };  

  const handleError = (err) => {
    console.error(err);
    setError("Error accessing camera.");
  };

  return (
    <div
      className="container mt-3"
      style={{ maxWidth: "900px", margin: "auto" }}
    >
      <ToastContainer autoClose={2000} />
      <ImageViewerModal
        show={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={equipment?.images || []}
        currentIndex={selectedImageIndex}
        onNext={() =>
          setSelectedImageIndex((prevIndex) =>
            prevIndex < equipment.images.length - 1 ? prevIndex + 1 : 0
          )
        }
        onPrev={() =>
          setSelectedImageIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : equipment.images.length - 1
          )
        }
      />

      <ReturnEquipmentModal
        show={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        equipment={equipment}
      />

      <ConfirmActionModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        actionReason={actionReason}
        equipment={equipment}
      />

      {/* Search Input */}
      <Card className="p-3 text-center mb-3">
        <div className="d-flex">
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="Enter equipment number"
            value={searchNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setSearchNumber(value);
            }}
            onKeyDown={(e) => {
              if (
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+" ||
                e.key === "-"
              ) {
                e.preventDefault();
              }
            }}
          />
          <Button
            variant="success"
            size="sm"
            className="ms-2"
            onClick={handleSearch}
          >
            GET
          </Button>
        </div>
      </Card>

      <div className="row d-flex flex-column-reverse flex-md-row">
        <div className="col-md-7 mt-2 mt-md-0">
          {/* Equipment Information */}
          <Card className="shadow-sm p-3 bg-light">
            <h6 className="fw-bold">🔧 Equipment Information</h6>
            {loading ? (
              <div className="d-flex justify-content-center py-3">
                <ReactLoading
                  type="spin"
                  color="#007bff"
                  height={40}
                  width={40}
                />
              </div>
            ) : (
              <div className="small">
                {equipment ? (
                  [
                    ["Equipment Name", equipment.name],
                    ["Number", equipment.number],
                    ["Type", equipment.type],
                    ["Brand", equipment.brand],
                    ["Availability Status", equipment.availability_status],
                    ["Operational Status", equipment.operational_status],
                    [
                      "Lab Location",
                      equipment.laboratory
                        ? `${equipment.laboratory.lab_name} (#${equipment.laboratory.lab_number})`
                        : "N/A",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    Please scan an equipment QR code to display details.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Additional Information */}
          <Card className="shadow-sm p-3 mt-3 mb-3">
            <h6 className="fw-bold">📍 Additional Information</h6>
            {loading ? (
              <div className="d-flex justify-content-center py-3">
                <ReactLoading
                  type="spin"
                  color="#007bff"
                  height={40}
                  width={40}
                />
              </div>
            ) : (
              <div className="small">
                {equipment ? (
                  [
                    [
                      "Added By",
                      equipment.user
                        ? `${equipment.user.first_name} ${equipment.user.last_name} (${equipment.user.user_type})`
                        : "N/A",
                    ],
                    [
                      "Date Added",
                      new Date(equipment.created_at).toLocaleDateString(),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between border-bottom py-1 flex-wrap"
                    >
                      <strong>{label}:</strong> <span>{value || "N/A"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    No additional details available.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Equipment Images */}
          <Card className="shadow-sm p-3 text-center">
            <h6 className="fw-bold">📷 Equipment Images</h6>
            {loading ? (
              <div className="d-flex justify-content-center py-3">
                <ReactLoading
                  type="spin"
                  color="#007bff"
                  height={40}
                  width={40}
                />
              </div>
            ) : (
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {equipment &&
                equipment.images &&
                equipment.images.length > 0 ? (
                  equipment.images.map((img, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={
                          img.startsWith("blob:") ||
                          img.startsWith("data:image")
                            ? img
                            : `data:image/jpeg;base64,${img}`
                        }
                        alt="Equipment"
                        className="border rounded shadow-sm"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setShowImageViewer(true);
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted">
                    No images available. Scan to load equipment images.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Scanner Section */}
        <div className="col-md-5">
          <Card
            className="p-3 d-flex flex-column align-items-center border rounded shadow-sm"
            style={{
              background: "rgba(150, 150, 150, 0.3)",
              backdropFilter: "blur(5px)",
            }}
          >
            <h6 className="mb-2 fw-normal">Scan QR Code</h6>
            <div
              style={{
                width: `${scannerSize.width}px`,
                height: `${scannerSize.height}px`,
                border: "2px dashed #6c757d",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "10px",
              }}
            >
              {isScanning && (
                <QrScanner
                  delay={300}
                  onScan={handleScan}
                  onError={handleError}
                  style={{ width: "100%", height: "100%" }}
                  constraints={{
                    video: {
                      facingMode: "environment",
                      width: scannerSize.width,
                      height: scannerSize.height,
                      willReadFrequently: true,
                    },
                  }}
                />
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="mt-2 p-3 text-center">
            <h6 className="fw-bold">🎯 Equipment Actions</h6>

            {equipment ? (
              <>
                {/* Action Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 mt-2"
                    type="button"
                    id="actionDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {selectedAction
                      ? selectedAction.split(" - ")[0]
                      : "Select an Action"}
                  </button>

                  <ul
                    className="dropdown-menu w-100"
                    aria-labelledby="actionDropdown"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    <li>
                      <button className="dropdown-item disabled text-muted">
                        Select an Action
                      </button>
                    </li>
                    {equipmentActions.map((action, index) => (
                      <li key={index}>
                        <button
                          className="dropdown-item"
                          onClick={() => setSelectedAction(action)}
                        >
                          {action.split(" - ")[0]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirm Button */}
                <Button
                  variant="success"
                  size="sm"
                  className="w-100 mt-2"
                  onClick={() => {
                    if (!selectedAction) {
                      toast.warn("Please select an action first.", {
                        position: "top-center",
                      });
                    } else {
                      setActionReason(selectedAction);
                      setShowConfirmModal(true);
                    }
                  }}
                >
                  Confirm Action
                </Button>
              </>
            ) : (
              <p className="text-muted">
                Please scan an equipment QR code to select an action.
              </p>
            )}

            {/* Clear Button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-100 mt-2"
              onClick={handleClear}
            >
              Clear
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScanEquipment;
