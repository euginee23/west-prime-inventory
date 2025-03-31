export const getFormattedReportFilename = ({
    user_type,
    first_name,
    last_name,
    report_name,
    extension,
  }) => {
    const clean = (str) =>
      String(str)
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .replace(/^./, (c) => c.toUpperCase());
  
    const today = new Date().toISOString().slice(0, 10);
  
    return `${clean(user_type)}_${clean(first_name)}_${clean(
      last_name
    )}_${clean(report_name)}_${today}.${extension}`;
  };