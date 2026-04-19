import React from "react";

const AttendancePage = ({ attendanceData }) => {
  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div style={{ padding: "2rem", background: "#f9f9f9", borderRadius: "8px", textAlign: "center", color: "#666" }}>
        <p>No attendance records found.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#4285F4", color: "white", textAlign: "left" }}>
            <th style={{ padding: "1rem", border: "1px solid #ddd", width: "50%" }}>Date</th>
            <th style={{ padding: "1rem", border: "1px solid #ddd", width: "50%" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((record, index) => (
            <tr key={record.id || index} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "1rem" }}>
                {new Date(record.date).toLocaleDateString(undefined, { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </td>
              <td style={{ padding: "1rem" }}>
                <span style={{ 
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "16px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  background: record.status === "Present" ? "#e8f5e9" : "#ffebee",
                  color: record.status === "Present" ? "#2e7d32" : "#c62828"
                }}>
                  {record.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendancePage;
