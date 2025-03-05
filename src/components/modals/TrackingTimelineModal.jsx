import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

const TrackingTimelineModal = ({ trackingCode }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trackingCode) {
      fetchTrackingHistory();
    }
  }, [trackingCode]);

  const fetchTrackingHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/scanned-equipment-actions/history/${trackingCode}`
      );
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching tracking history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.timelineContainer}>
      {loading ? (
        <p style={styles.loadingText}>Loading tracking history...</p>
      ) : history.length > 0 ? (
        <ul style={styles.timeline}>
          {history.map((action, index) => (
            <li key={index} style={styles.timelineItem}>
              {/* Vertical Line (Extends only when it's not the last item) */}
              {index !== history.length - 1 && (
                <div style={styles.timelineLine} />
              )}

              {/* Event Icon */}
              <div style={styles.timelineIconWrapper}>
                <span style={styles.timelineIcon}>
                  {index === history.length - 1 ? (
                    <FaCheckCircle />
                  ) : (
                    <FaCircle />
                  )}
                </span>
              </div>

              {/* Date & Content Box */}
              <div style={styles.timelineContent}>
                <div style={styles.timelineDate}>
                  {new Date(action.date).toLocaleDateString()}
                </div>
                <div style={styles.timelineText}>
                  <strong>{action.event}</strong> - {action.details}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.loadingText}>No tracking history available.</p>
      )}
    </div>
  );
};

const styles = {
  timelineContainer: {
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    marginTop: "10px",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  loadingText: {
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "bold",
  },
  timeline: {
    listStyleType: "none",
    padding: "0",
    margin: "0",
    position: "relative",
  },
  timelineItem: {
    display: "flex",
    alignItems: "flex-start",
    position: "relative",
    paddingBottom: "25px",
    minHeight: "70px",
  },
  timelineLine: {
    position: "absolute",
    left: "18px", 
    top: "25px",
    width: "3px",
    backgroundColor: "#007bff",
    height: "90%",
    zIndex: 1,
  },
  timelineIconWrapper: {
    width: "40px",
    minWidth: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  timelineIcon: {
    color: "#007bff",
    fontSize: "1.2rem",
    display: "inline-block",
  },
  timelineContent: {
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #dee2e6",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    flex: "1",
    minWidth: "60%",
    maxWidth: "85%",
    wordBreak: "break-word",
  },
  timelineDate: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#6c757d",
    marginBottom: "5px",
  },
  timelineText: {
    margin: "0",
    fontSize: "14px",
    wordWrap: "break-word",
    flex: 1,
  },
};

export default TrackingTimelineModal;
