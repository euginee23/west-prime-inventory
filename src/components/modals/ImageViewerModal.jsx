import React from "react";
import { Modal, Button, Image } from "react-bootstrap";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ImageViewerModal = ({ show, onClose, images, currentIndex, onNext, onPrev }) => {
  if (!images || images.length === 0 || currentIndex === null) return null;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Body className="p-2 text-center position-relative">
        <Image
          src={
            images[currentIndex].startsWith("blob:") ||
            images[currentIndex].startsWith("data:image")
              ? images[currentIndex]
              : `data:image/jpeg;base64,${images[currentIndex]}`
          }
          alt="Large Preview"
          fluid
          className="border rounded shadow-sm"
        />

        {/* Previous & Next Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="dark"
              className="position-absolute top-50 start-0 translate-middle-y"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              onClick={onPrev}
            >
              <FaChevronLeft />
            </Button>

            <Button
              variant="dark"
              className="position-absolute top-50 end-0 translate-middle-y"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              onClick={onNext}
            >
              <FaChevronRight />
            </Button>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2">
        <Button size="sm" variant="secondary" onClick={onClose}>
          <FaTimes className="me-1" /> Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageViewerModal;
