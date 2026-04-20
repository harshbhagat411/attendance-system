import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const ViewAttendance = ({ students }) => {
  const today = new Date().toISOString().split("T")[0];
  const [viewDate, setViewDate] = useState(today);
  const [viewRecords, setViewRecords] = useState([]);

  const handleViewAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", viewDate);

      if (error) throw error;

      const records = [];
      data.forEach(record => {
        const student = students.find(s => s.id === record.student_id);
        if (student) {
          records.push({
            id: record.id,
            studentName: student.name,
            status: record.status
          });
        }
      });
      
      setViewRecords(records);
    } catch (error) {
      console.error("Error fetching view attendance:", error.message);
      alert("Error fetching records: " + error.message);
    }
  };

  return (
    <div>
      <h3>View Attendance Records</h3>
      <div style={{ marginBottom: "1.5rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontWeight: "bold" }}>
          Select Date:{" "}
          <input
            type="date"
            value={viewDate}
            onChange={(e) => setViewDate(e.target.value)}
            max={today}
            style={{ padding: "0.5rem", marginLeft: "1rem", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </label>
        <button
          onClick={handleViewAttendance}
          style={{ padding: "0.5rem 1rem", background: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          View Attendance
        </button>
      </div>

      {viewRecords.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ background: "#2196F3", color: "white", textAlign: "left" }}>
              <th style={{ padding: "1rem", border: "1px solid #ddd" }}>Student Name</th>
              <th style={{ padding: "1rem", border: "1px solid #ddd", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {viewRecords.map((record) => (
              <tr key={record.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "1rem" }}>{record.studentName}</td>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "12px", 
                    color: "white", 
                    fontWeight: "bold",
                    background: record.status === "Present" ? "#4CAF50" : "#f44336" 
                  }}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: "center", color: "#666", padding: "2rem", background: "#f9f9f9", borderRadius: "8px" }}>
          No records found. Select a date and click "View Attendance".
        </p>
      )}
    </div>
  );
};

export default ViewAttendance;
