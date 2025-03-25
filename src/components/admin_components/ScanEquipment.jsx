import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { Card, Button, Dropdown, DropdownButton } from "react-bootstrap";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import beepSound from "../../assets/beep.mp3";
import ImageViewerModal from "../modals/ImageViewerModal";
import CheckOutActionModal from "../modals/CheckOutActionModal";
import ReturnEquipmentModal from "../modals/ReturnEquipmentModal";
import MaintenanceActionModal from "../modals/MaintenanceActionModal";
import MaintenanceAcceptedModal from "../modals/MaintenanceAcceptedModal";

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

  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const [showMaintenanceAcceptedModal, setShowMaintenanceAcceptedModal] =
    useState(false);

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
    "External Training - Borrowed for workshops, training, or seminars.",
    "Borrowed by Faculty - Temporarily taken by a teacher for official use.",
    "Borrowed by Student - Temporarily loaned to a student for academic purposes.",
  ];

  const maintenanceActions = [
    "For Repair - Equipment needs immediate fixing or parts replacement.",
    "Software Update - Updating system software or firmware.",
    "Reformat & Reinstall - Reinstalling OS or applications.",
    "Cleaning & Dusting - General maintenance for longevity.",
  ];

  const handleActionClick = (action) => {
    if (selectedAction === action) {
      setSelectedAction(null);
    } else {
      setSelectedAction(action);
      setShowCheckOutModal(false);
      setShowMaintenanceModal(false);
    }
  };

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

      if (response.data.availability_status === "In-Use") {
        toast.info("Equipment is currently In-Use. Choose an action.", {
          position: "top-center",
        });
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
    setShowCheckOutModal(false);
    setShowReturnModal(false);
    setIsScanning(false);

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
        handleClear={handleClear}
      />

      <CheckOutActionModal
        show={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        actionReason={actionReason}
        equipment={equipment}
        handleClear={handleClear}
      />

      <MaintenanceActionModal
        show={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        actionReason={actionReason}
        equipment={equipment}
        setEquipment={setEquipment}
        handleClear={handleClear}
      />

      <MaintenanceAcceptedModal
        show={showMaintenanceAcceptedModal}
        onClose={() => setShowMaintenanceAcceptedModal(false)}
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
            <h6 className="fw-bold mb-3">EQUIPMENT INFORMATION:</h6>
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
            <h6 className="fw-bold mb-3">ADDITIONAL INFORMATION:</h6>
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
            <h6 className="fw-bold">EQUIPMENT IMAGES:</h6>
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
            {/* Clear Button */}
            <Button
              variant="danger"
              size="sm"
              className="w-100 mt-2"
              onClick={handleClear}
            >
              Clear
            </Button>
          </Card>

          {/* Actions Section */}
          <Card className="mt-2 p-3 text-center">
            <h6 className="fw-bold">Equipment Actions</h6>

            {equipment ? (
              equipment.availability_status === "In-Use" ? (
                <div className="d-flex flex-column gap-2 mt-2">
                  {/* Return Equipment Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-white"
                    onClick={() => setShowReturnModal(true)}
                  >
                    Return Equipment
                  </Button>

                  {/* Mark as Lost Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-white"
                    onClick={() => {
                      toast.warn("Mark as Lost clicked!", {
                        position: "top-center",
                      });
                    }}
                  >
                    Mark as Lost
                  </Button>
                </div>
              ) : equipment.availability_status === "Maintenance" ? (
                <div className="d-flex flex-column gap-2 mt-2">
                  {/* Repair Accepted Button */}
                  <Button
                    variant="warning"
                    size="sm"
                    className="text-white"
                    onClick={() => setShowMaintenanceAcceptedModal(true)}
                  >
                    Maintenance Accepted
                  </Button>

                  {/* Cancel Repair & Return Equipment Button */}
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-white"
                    onClick={() =>
                      toast.error("Maintenance Cancelled & Return clicked!", {
                        position: "top-center",
                      })
                    }
                  >
                    Maintenance Cancelled & Return
                  </Button>
                </div>
              ) : equipment.availability_status === "Maintenance" ? (
                <div className="d-flex flex-column gap-2 mt-2">
                  <Button
                    variant="warning"
                    size="sm"
                    className="text-white"
                    onClick={() =>
                      toast.success("Repair process accepted by technician!", {
                        position: "top-center",
                      })
                    }
                  >
                    Accept Repair
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-white"
                    onClick={() =>
                      toast.error("Cancel Repair & Return Equipment clicked!", {
                        position: "top-center",
                      })
                    }
                  >
                    Cancel Repair & Return Equipment
                  </Button>
                </div>
              ) : equipment.availability_status === "Being Repaired" ? (
                <div className="d-flex flex-column gap-2 mt-2">
                  <Button
                    variant="success"
                    size="sm"
                    className="text-white"
                    onClick={() =>
                      toast.success(
                        "Repair finished! Equipment returned successfully.",
                        {
                          position: "top-center",
                        }
                      )
                    }
                  >
                    Repair Finished & Return
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-white"
                    onClick={() =>
                      toast.error("Repair failed! Equipment returned.", {
                        position: "top-center",
                      })
                    }
                  >
                    Repair Failed & Return
                  </Button>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-column gap-2 mt-2">
                    {/* Check Out Button */}
                    <Button
                      variant="success"
                      size="sm"
                      className="text-white"
                      onClick={() => handleActionClick("Check Out")}
                    >
                      Check Out
                    </Button>

                    {/* Maintenance Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-white"
                      onClick={() => handleActionClick("Maintenance")}
                    >
                      Maintenance
                    </Button>
                  </div>

                  {/* Action Dropdowns (Only One Visible at a Time) */}
                  {selectedAction && (
                    <div className="mt-3 p-3 border rounded bg-light">
                      <DropdownButton
                        id="actionDropdown"
                        title={`Select ${selectedAction || "Action"}`}
                        variant="secondary"
                        className="w-100"
                      >
                        <Dropdown.Item disabled className="text-muted">
                          Select an Action
                        </Dropdown.Item>

                        {/* Check Out - Open Modal */}
                        {selectedAction === "Check Out" &&
                          equipmentActions.map((action, index) => (
                            <Dropdown.Item
                              key={index}
                              onClick={() => {
                                setSelectedAction(null);
                                setActionReason(action);
                                setShowCheckOutModal(true);
                              }}
                            >
                              {action.split(" - ")[0]}
                            </Dropdown.Item>
                          ))}

                        {/* Mark Equipment - Show Toast Message */}
                        {selectedAction === "Mark Equipment" &&
                          markEquipmentActions.map((action, index) => (
                            <Dropdown.Item
                              key={index}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAction(null);
                                toast.info(
                                  `Action Selected: ${action.split(" - ")[0]}`,
                                  {
                                    position: "top-center",
                                  }
                                );
                              }}
                            >
                              {action.split(" - ")[0]}
                            </Dropdown.Item>
                          ))}

                        {/* Maintenance - Show Modal */}
                        {selectedAction === "Maintenance" &&
                          maintenanceActions.map((action, index) => (
                            <Dropdown.Item
                              key={index}
                              onClick={() => {
                                setActionReason(action.split(" - ")[0]);
                                setSelectedAction(null);
                                setShowMaintenanceModal(true);
                              }}
                            >
                              {action.split(" - ")[0]}
                            </Dropdown.Item>
                          ))}
                      </DropdownButton>

                      {/* Cancel Button */}
                      <Button
                        variant="dark"
                        size="sm"
                        className="mt-2 w-100 text-white"
                        onClick={() => setSelectedAction(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              <p className="text-muted">
                Please scan an equipment QR code to select an action.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScanEquipment;
