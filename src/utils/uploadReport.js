import axios from "axios";
import { getLoggedInUser } from "./auth";
import { getFormattedReportFilename } from "./fileNameFormat";

const uploadReport = async ({ buffer, type, reportName, reportType }) => {
  try {
    const user = getLoggedInUser();
    if (!user) throw new Error("User not authenticated");

    const filename = getFormattedReportFilename({
      user_type: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      report_name: reportName,
      extension: type === "excel" ? "xlsx" : "pdf",
    });

    const base64Data = await blobToBase64(buffer);

    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/report-files`, {
      user_id: user.user_id,
      file_name: filename,
      file_data: base64Data,
      type,
      report_type: reportType,
    });

    return filename;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default uploadReport;
