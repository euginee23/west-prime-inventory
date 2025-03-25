import React, { useState } from "react";
import axios from "axios";
import { Modal, Button, Card } from "react-bootstrap";
import ReactLoading from "react-loading";
import { toast } from "react-toastify";
import MaintenanceForRepairForm from "../forms/MaintenanceForRepairForm";
import TechnicianConfirmModal from "./TechnicianConfirmModal";
import { getLoggedInUser } from "../../utils/auth";

const MaintenanceActionModal = ({
  show,
  onClose,
  actionReason,
  equipment,
  setEquipment,
  handleClear,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [matchedTechnician, setMatchedTechnician] = useState(null);
  const [showTechConfirm, setShowTechConfirm] = useState(false);
  const [resolveTechConfirm, setResolveTechConfirm] = useState(null);

  const [repairInfo, setRepairInfo] = useState({
    technician_id: null,
    technician_name: "",
    contact_number: "",
    shop_name: "",
    shop_address: "",
  });

  const user = getLoggedInUser();
  if (!user) {
    toast.error("User not authenticated.");
    return;
  }

  const handleSelectTechnician = (tech) => {
    setRepairInfo({
      technician_id: tech.technician_id,
      technician_name: tech.name,
      contact_number: tech.contact_number,
      shop_name: tech.shop_name,
      shop_address: tech.shop_address,
    });
    setSearchQuery(`${tech.name}`);
    setShowDropdown(false);
  };

  const handleTechnicianSearch = async () => {
    if (searchQuery.length < 2) {
      toast.warn("Enter at least 2 characters to search.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/technicians/search`,
        {
          params: { query: searchQuery },
        }
      );

      const technicians = res.data.technicians || [];
      setFilteredTechnicians(technicians);

      setShowDropdown(true);
    } catch (err) {
      console.error("Technician search error:", err);
      toast.error("Failed to search technicians.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepairInfoChange = (e) => {
    setRepairInfo({ ...repairInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!equipment || !actionReason) {
      toast.error("Missing equipment or reason.");
      return;
    }

    if (
      actionReason === "For Repair" ||
      actionReason === "Software Update" ||
      actionReason === "Reformat & Reinstall" ||
      actionReason === "Cleaning & Dusting"
    ) {
      const { technician_name, contact_number, shop_name, shop_address } =
        repairInfo;

      if (!technician_name || !contact_number || !shop_name || !shop_address) {
        toast.warn("Please fill in all repair details.");
        return;
      }

      const user = getLoggedInUser();
      if (!user) {
        toast.error("User not authenticated.");
        return;
      }

      try {
        setLoading(true);

        const payload = {
          equipment_id: equipment.equipment_id,
          lab_id: equipment.laboratory.lab_id,
          user_id: user.user_id,
          reason: actionReason,
          technician: {
            technician_name,
            contact_number,
            shop_name,
            shop_address,
          },
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/maintenance/release`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        toast.success(response.data.message || "Maintenance released!");

        setEquipment((prev) => ({
          ...prev,
          availability_status: "Maintenance",
        }));

        setTimeout(() => {
          setLoading(false);
          onClose();
          handleClear();
        }, 500);
      } catch (error) {
        console.error("Maintenance release error:", error);
        toast.error("Failed to record maintenance action.");
        setLoading(false);
      }
    } else {
      toast.info("This maintenance action is not yet implemented.");
    }
  };

  return (
    <>
      <TechnicianConfirmModal
        show={showTechConfirm}
        technician={matchedTechnician}
        onCancel={() => {
          setShowTechConfirm(false);
          if (resolveTechConfirm) {
            resolveTechConfirm(undefined);
            setResolveTechConfirm(null);
          }
        }}
        onConfirm={() => {
          setRepairInfo({
            ...repairInfo,
            technician_id: matchedTechnician.technician_id,
            technician_name: matchedTechnician.name,
            contact_number: matchedTechnician.contact_number,
            shop_name: matchedTechnician.shop_name,
            shop_address: matchedTechnician.shop_address,
          });
          setShowTechConfirm(false);
          if (resolveTechConfirm) {
            resolveTechConfirm(matchedTechnician.technician_id);
            setResolveTechConfirm(null);
          }
        }}
      />

      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header className="bg-secondary text-white py-2 px-3">
          <Modal.Title className="fs-6">{actionReason}</Modal.Title>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
          ></button>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="d-flex justify-content-center py-4">
              <ReactLoading
                type="spin"
                color="#007bff"
                height={50}
                width={50}
              />
            </div>
          ) : (
            <>
              {[
                "For Repair",
                "Software Update",
                "Reformat & Reinstall",
                "Cleaning & Dusting",
              ].includes(actionReason) ? (
                <MaintenanceForRepairForm
                  actionReason={actionReason}
                  equipment={equipment}
                  repairInfo={repairInfo}
                  handleRepairInfoChange={handleRepairInfoChange}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleTechnicianSearch={handleTechnicianSearch}
                  filteredTechnicians={filteredTechnicians}
                  showDropdown={showDropdown}
                  setShowDropdown={setShowDropdown}
                  handleSelectTechnician={handleSelectTechnician}
                />
              ) : (
                <Card className="p-4 text-center bg-light shadow-sm">
                  <h6 className="text-muted mb-0">
                    🚧 This action is not yet implemented.
                  </h6>
                </Card>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ReactLoading type="spin" color="#fff" height={20} width={20} />
            ) : (
              "Confirm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MaintenanceActionModal;
