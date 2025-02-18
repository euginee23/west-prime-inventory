import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { Card, Button } from "react-bootstrap";
import beepSound from "../../assets/beep.mp3";

const ScanEquipment = () => {
  const [scanResult, setScanResult] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  const [scannerSize, setScannerSize] = useState({ width: 250, height: 180 });
  const [isScanning, setIsScanning] = useState(true);

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

  const fetchEquipmentDetails = async (qrData) => {
    if (!qrData || isNaN(qrData)) {
      setError("Invalid QR Code. Please scan a valid equipment QR.");
      setEquipment(null);
      setIsScanning(true);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/equipments/${qrData}`
      );
      setEquipment(response.data);
      setError("");

      const audio = new Audio(beepSound);
      audio.play().catch(() => {}); 
    } catch (err) {
      setError("Equipment not found or invalid QR code.");
      setEquipment(null);
    }

    setTimeout(() => {
      setIsScanning(true);
    }, 1500);
  };

  const handleScan = (data) => {
    if (data && isScanning) {
      const scannedData = data.text.trim(); 
      setScanResult(scannedData);
      setIsScanning(false); 
      fetchEquipmentDetails(scannedData);
    }
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
      <div className="row d-flex flex-column-reverse flex-md-row">
        {/* Equipment Info Section */}
        <div className="col-md-7 mt-2 mt-md-0">
          <Card className="p-2">
            <h6 className="mb-2">Equipment Information</h6>
            {equipment ? (
              <div style={{ fontSize: "0.85rem" }}>
                <p>
                  <strong>Name:</strong> {equipment.name}
                </p>
                <p>
                  <strong>Number:</strong> {equipment.number}
                </p>
                <p>
                  <strong>Type:</strong> {equipment.type}
                </p>
                <p>
                  <strong>Status:</strong> {equipment.status}
                </p>
                <p>
                  <strong>Brand:</strong> {equipment.brand}
                </p>
                <p>
                  <strong>Lab ID:</strong> {equipment.laboratory_id}
                </p>
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                Scan a QR code to view equipment details.
              </p>
            )}
            {error && (
              <p className="text-danger" style={{ fontSize: "0.85rem" }}>
                {error}
              </p>
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

          {/* Action Buttons */}
          <Card className="mt-2 p-2">
            <h6 className="mb-2">Actions</h6>
            <Button variant="primary" size="sm" className="w-100 mb-1">
              Reserve
            </Button>
            <Button variant="danger" size="sm" className="w-100 mb-1">
              Report Issue
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-100"
              onClick={() => setEquipment(null)}
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
