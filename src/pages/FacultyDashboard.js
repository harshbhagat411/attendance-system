import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ViewAttendance from "../components/ViewAttendance";
import emailjs from "emailjs-com";

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

      if (status === "Absent") {
        checkAndSendLowAttendanceEmail(studentId);
      }

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const checkAndSendLowAttendanceEmail = async (studentId) => {
    try {
      console.log(`Checking attendance for studentId: ${studentId}`);
      // Fetch all attendance for this student
      const { data: records, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);
        
      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }
      
      console.log(`Fetched ${records?.length} attendance records for student ${studentId}`);
      
      if (records && records.length > 0) {
        const presentCount = records.filter(r => r.status === "Present").length;
        const total = records.length;
        const percentage = (presentCount / total) * 100;
        
        console.log(`Present: ${presentCount}, Total: ${total}, Percentage: ${percentage}%`);
        
        if (percentage < 75) {
          const student = students.find(s => s.id === studentId);
          console.log(`Found student:`, student ? student.name : "Not found");
          
          if (student && student.email) {
            console.log(`Initializing EmailJS and sending to ${student.email}...`);
            emailjs.init("2Tz2HIRHn5-2jaLxY");
            
            const templateParams = {
              name: student.name,
              email: student.email,
              attendance: percentage.toFixed(1)
            };
            
            try {
              const result = await emailjs.send(
                "service_5brvsmf",
                "template_k3cncx9",
                templateParams,
                "2Tz2HIRHn5-2jaLxY"
              );
              console.log(`EmailJS Success:`, result.text);
              alert(`Low attendance alert sent to ${student.email}!`);
            } catch (emailErr) {
              console.error("EmailJS Send Error:", emailErr);
              alert(`Failed to send email to ${student.email}. Check console.`);
            }
          } else {
            console.log("Student object or email is missing");
          }
        } else {
          console.log("Percentage is >= 75%, skipping email.");
        }
      }
    } catch (err) {
      console.error("Error checking/sending low attendance email:", err);
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
        <h2>Teacher's Dashboard</h2>
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
                        <td className="font-bold" data-label="Student Name">{student.name}</td>
                        <td className="text-muted" data-label="Email">{student.email}</td>
                        <td className="text-center" data-label="Action">
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
