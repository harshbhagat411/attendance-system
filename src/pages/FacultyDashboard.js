import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const FacultyDashboard = () => {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      // Upsert: updating attendance if already marked for that day
      // Note: for a simple insert without checking duplicates:
      const { error } = await supabase.from("attendance").insert([
        {
          student_id: studentId,
          date: date,
          status: status,
        },
      ]);

      if (error) throw error;
      
      setMessage(`Marked ${status} successfully!`);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading students...</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <h2>Faculty Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#f44336", color: "white", border: "none", borderRadius: "4px" }}>
          Logout
        </button>
      </header>
      
      <div style={{ marginTop: "2rem" }}>
        <h3>Mark Attendance</h3>
        <div style={{ marginBottom: "1.5rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
          <label style={{ fontWeight: "bold" }}>
            Select Date:{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: "0.5rem", marginLeft: "1rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>
        </div>
        
        {message && (
          <div style={{ 
            padding: "1rem", 
            marginBottom: "1rem", 
            borderRadius: "4px",
            background: message.includes("Error") ? "#ffcccc" : "#d4edda",
            color: message.includes("Error") ? "red" : "green",
            textAlign: "center",
            fontWeight: "bold"
          }}>
            {message}
          </div>
        )}

        {students.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ background: "#4CAF50", color: "white", textAlign: "left" }}>
                <th style={{ padding: "1rem", border: "1px solid #ddd" }}>Student Name</th>
                <th style={{ padding: "1rem", border: "1px solid #ddd" }}>Email</th>
                <th style={{ padding: "1rem", border: "1px solid #ddd", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "1rem" }}>{student.name}</td>
                  <td style={{ padding: "1rem" }}>{student.email}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <button
                      onClick={() => markAttendance(student.id, "Present")}
                      style={{ 
                        marginRight: "0.5rem", 
                        padding: "0.5rem 1rem", 
                        background: "#4CAF50", 
                        color: "white", 
                        cursor: "pointer",
                        border: "none",
                        borderRadius: "4px"
                      }}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, "Absent")}
                      style={{ 
                        padding: "0.5rem 1rem", 
                        background: "#f44336", 
                        color: "white", 
                        cursor: "pointer",
                        border: "none",
                        borderRadius: "4px"
                      }}
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center", color: "#666", padding: "2rem", background: "#f9f9f9", borderRadius: "8px" }}>
            No students found in the database.
          </p>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
