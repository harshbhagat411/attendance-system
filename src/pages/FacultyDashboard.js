import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ViewAttendance from "../components/ViewAttendance";

const FacultyDashboard = () => {
  const [students, setStudents] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [attendanceData, setAttendanceData] = useState({});
  const [editModes, setEditModes] = useState({});
  const [facultyStandard, setFacultyStandard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mark");
  const [message, setMessage] = useState("");

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate > today) {
      alert("You cannot mark attendance for future dates");
    } else {
      setDate(selectedDate);
    }
  };

  useEffect(() => {
    fetchFacultyDetails();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [date, students]);

  const fetchFacultyDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("standard")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        setFacultyStandard(data.standard);
        
        if (data.standard) {
          fetchStudents(data.standard);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching faculty details:", error.message);
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date);
      
      if (error) throw error;
      
      const attendanceMap = {};
      if (data) {
        data.forEach(record => {
          attendanceMap[record.student_id] = record;
        });
      }
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error("Error fetching attendance:", error.message);
    }
  };

  const fetchStudents = async (standard) => {
    if (!standard) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .eq("standard", standard)
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
    if (date > today) {
      alert("You cannot mark attendance for future dates");
      return;
    }

    try {
      const existingRecord = attendanceData[studentId];
      
      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("attendance")
          .update({ status: status })
          .eq("id", existingRecord.id);
          
        if (error) throw error;
        
        setAttendanceData(prev => ({
          ...prev,
          [studentId]: { ...existingRecord, status: status }
        }));
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("attendance")
          .insert([
            {
              student_id: studentId,
              date: date,
              status: status,
            },
          ])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setAttendanceData(prev => ({
            ...prev,
            [studentId]: data[0]
          }));
        } else {
          fetchAttendance(); // Fallback if no data returned
        }
      }
      
      setEditModes(prev => ({ ...prev, [studentId]: false }));
      
      setMessage(`Marked ${status} successfully!`);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const renderAction = (studentId) => {
    const record = attendanceData[studentId];
    const isEditing = editModes[studentId];
    
    const actionAreaWidth = "180px";
    
    if (record) {
      if (!isEditing) {
        const isPresent = record.status === "Present";
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <div style={{ 
              width: actionAreaWidth,
              padding: "0.5rem 0", 
              borderRadius: "4px", 
              color: "white", 
              fontWeight: "bold",
              textAlign: "center",
              background: isPresent ? "#4CAF50" : "#f44336" 
            }}>
              {record.status}
            </div>
            <button
              onClick={() => setEditModes(prev => ({ ...prev, [studentId]: true }))}
              style={{ 
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Edit Attendance"
            >
              🖋️
            </button>
          </div>
        );
      } else {
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: actionAreaWidth, margin: "auto" }}>
            <select
              value={record.status}
              onChange={(e) => markAttendance(studentId, e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                outline: "none",
                cursor: "pointer",
                fontSize: "1rem",
                textAlign: "center"
              }}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        );
      }
    }

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: actionAreaWidth, margin: "auto" }}>
        <button
          onClick={() => markAttendance(studentId, "Present")}
          style={{ 
            flex: 1,
            padding: "0.5rem 0", 
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
          onClick={() => markAttendance(studentId, "Absent")}
          style={{ 
            flex: 1,
            padding: "0.5rem 0", 
            background: "#f44336", 
            color: "white", 
            cursor: "pointer",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Absent
        </button>
      </div>
    );
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
        <div>
          <button 
            onClick={() => setActiveTab(activeTab === "mark" ? "view" : "mark")} 
            style={{ padding: "0.5rem 1rem", cursor: "pointer", background: activeTab === "mark" ? "#2196F3" : "#4CAF50", color: "white", border: "none", borderRadius: "4px", marginRight: "1rem" }}
          >
            {activeTab === "mark" ? "View Attendance Records" : "Mark Attendance"}
          </button>
          <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#f44336", color: "white", border: "none", borderRadius: "4px" }}>
            Logout
          </button>
        </div>
      </header>
      
      <div style={{ marginTop: "2rem" }}>
        {activeTab === "view" ? (
          <ViewAttendance students={students} />
        ) : (
          <>
            <h3>Mark Attendance</h3>
            <div style={{ marginBottom: "1.5rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
              <label style={{ fontWeight: "bold" }}>
                Select Date:{" "}
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  max={today}
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
                        {renderAction(student.id)}
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
          </>
        )}
      </div>

    </div>
  );
};

export default FacultyDashboard;
