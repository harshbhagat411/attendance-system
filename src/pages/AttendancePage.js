import React from "react";

const AttendancePage = ({ attendanceData }) => {
  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="empty-state">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th style={{ width: "50%" }}>Date</th>
            <th style={{ width: "50%" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((record, index) => (
            <tr key={record.id || index}>
              <td className="font-bold">
                {new Date(record.date).toLocaleDateString(undefined, { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </td>
              <td>
                <span className={`badge ${record.status === "Present" ? "badge-success" : "badge-danger"}`}>
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
