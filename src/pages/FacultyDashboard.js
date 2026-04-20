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
    const actionAreaWidth = "200px";
    
    if (record) {
      if (!isEditing) {
        const isPresent = record.status === "Present";
        return (
          <div className="flex items-center gap-05" style={{ justifyContent: "center" }}>
            <div className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`} style={{ width: "120px" }}>
              {record.status}
            </div>
            <button
              onClick={() => setEditModes(prev => ({ ...prev, [studentId]: true }))}
              className="btn-icon"
              title="Edit Attendance"
            >
              ✏️
            </button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center" style={{ justifyContent: "center", width: actionAreaWidth, margin: "auto" }}>
            <select
              value={record.status}
              onChange={(e) => markAttendance(studentId, e.target.value)}
              className="input-field text-center"
              style={{ padding: "0.4rem" }}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-05" style={{ justifyContent: "center", width: actionAreaWidth, margin: "auto" }}>
        <button
          onClick={() => markAttendance(studentId, "Present")}
          className="btn btn-success"
          style={{ flex: 1 }}
        >
          Present
        </button>
        <button
          onClick={() => markAttendance(studentId, "Absent")}
          className="btn btn-danger"
          style={{ flex: 1 }}
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
    <div className="app-container">
      <header className="navbar">
        <h2>Faculty Dashboard</h2>
        <div className="nav-actions">
          <button 
            onClick={() => setActiveTab(activeTab === "mark" ? "view" : "mark")} 
            className={`btn ${activeTab === "mark" ? "btn-primary" : "btn-success"}`}
          >
            {activeTab === "mark" ? "View Attendance Records" : "Mark Attendance"}
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </header>
      
      <div>
        {activeTab === "view" ? (
          <ViewAttendance students={students} />
        ) : (
          <div className="card">
            <h3 className="section-title">Mark Attendance</h3>
            <div className="form-group flex items-center" style={{ marginTop: "1.5rem" }}>
              <label className="form-label" style={{ marginBottom: 0, marginRight: "1rem" }}>
                Select Date:
              </label>
              <input
                type="date"
                className="input-field"
                style={{ width: "auto" }}
                value={date}
                onChange={handleDateChange}
                max={today}
              />
            </div>
            
            {message && (
              <div className={message.includes("Error") ? "alert alert-danger" : "alert alert-success"}>
                {message}
              </div>
            )}

            {students.length > 0 ? (
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="font-bold">{student.name}</td>
                        <td className="text-muted">{student.email}</td>
                        <td className="text-center">
                          {renderAction(student.id)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                No students found in the database.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default FacultyDashboard;
