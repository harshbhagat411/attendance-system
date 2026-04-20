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
    <div className="card">
      <h3 className="section-title">View Attendance Records</h3>
      <div className="form-group flex items-center gap-1" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          Select Date:
        </label>
        <input
          type="date"
          className="input-field"
          style={{ width: "auto" }}
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          max={today}
        />
        <button
          onClick={handleViewAttendance}
          className="btn btn-primary"
        >
          View Attendance
        </button>
      </div>

      {viewRecords.length > 0 ? (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {viewRecords.map((record) => (
                <tr key={record.id}>
                  <td className="font-bold" data-label="Student Name">{record.studentName}</td>
                  <td className="text-center" data-label="Status">
                    <span className={`badge ${record.status === "Present" ? "badge-success" : "badge-danger"}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          No records found. Select a date and click "View Attendance".
        </div>
      )}
    </div>
  );
};

export default ViewAttendance;
