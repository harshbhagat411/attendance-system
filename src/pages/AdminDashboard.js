import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import emailjs from "emailjs-com";

const AdminDashboard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [standard, setStandard] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Faculty Attendance State
  const todayDateObj = new Date();
  const offset = todayDateObj.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(todayDateObj.getTime() - offset)).toISOString().slice(0, 10);
  const today = localISOTime;
  const firstDayOfMonth = today.substring(0, 8) + '01';
  const daysInCurrentMonthPassed = parseInt(today.substring(8, 10), 10);

  const [faculties, setFaculties] = useState([]);
  const [facultyDate, setFacultyDate] = useState(today);
  const [facultyAttendanceData, setFacultyAttendanceData] = useState({});
  const [facultyEditModes, setFacultyEditModes] = useState({});
  const [facultySummary, setFacultySummary] = useState({});
  const [facLoading, setFacLoading] = useState(true);

  useEffect(() => {
    // Initialize emailjs with the public key on component mount
    emailjs.init("2Tz2HiRHn5-2jaLxY");
  }, []);
  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (faculties.length > 0) {
      fetchFacultyAttendance();
      fetchFacultySummary();
    }
  }, [facultyDate, faculties]);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "faculty")
        .order("name");

      if (error) throw error;
      setFaculties(data || []);
    } catch (error) {
      console.error("Error fetching faculties:", error.message);
    } finally {
      setFacLoading(false);
    }
  };

  const fetchFacultyAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_attendance")
        .select("*")
        .eq("date", facultyDate);
      
      if (error) throw error;
      
      const attendanceMap = {};
      if (data) {
        data.forEach(record => {
          attendanceMap[record.faculty_id] = record;
        });
      }
      setFacultyAttendanceData(attendanceMap);
    } catch (error) {
      console.error("Error fetching faculty attendance:", error.message);
    }
  };

  const fetchFacultySummary = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_attendance")
        .select("*")
        .gte("date", firstDayOfMonth)
        .lte("date", today)
        .eq("status", "Present");

      if (error) throw error;

      const summaryMap = {};
      if (data) {
        data.forEach(record => {
          summaryMap[record.faculty_id] = (summaryMap[record.faculty_id] || 0) + 1;
        });
      }
      setFacultySummary(summaryMap);
    } catch (error) {
      console.error("Error fetching faculty summary:", error.message);
    }
  };

  const handleFacultyDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate > today) {
      alert("You cannot mark attendance for future dates");
    } else {
      setFacultyDate(selectedDate);
    }
  };

  const markFacultyAttendance = async (facultyId, status) => {
    if (facultyDate > today) {
      alert("You cannot mark attendance for future dates");
      return;
    }

    try {
      const existingRecord = facultyAttendanceData[facultyId];
      
      if (existingRecord) {
        const { error } = await supabase
          .from("faculty_attendance")
          .update({ status: status })
          .eq("id", existingRecord.id);
          
        if (error) throw error;
        
        setFacultyAttendanceData(prev => ({
          ...prev,
          [facultyId]: { ...existingRecord, status: status }
        }));
      } else {
        const { data, error } = await supabase
          .from("faculty_attendance")
          .insert([{ faculty_id: facultyId, date: facultyDate, status: status }])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFacultyAttendanceData(prev => ({
            ...prev,
            [facultyId]: data[0]
          }));
        } else {
          fetchFacultyAttendance();
        }
      }
      
      setFacultyEditModes(prev => ({ ...prev, [facultyId]: false }));
      fetchFacultySummary(); // Refresh summary
    } catch (error) {
      console.error("Error marking faculty attendance:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const renderFacultyAction = (facultyId) => {
    const record = facultyAttendanceData[facultyId];
    const isEditing = facultyEditModes[facultyId];
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
              onClick={() => setFacultyEditModes(prev => ({ ...prev, [facultyId]: true }))}
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
              ✏️
            </button>
          </div>
        );
      } else {
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: actionAreaWidth, margin: "auto" }}>
            <select
              value={record.status}
              onChange={(e) => markFacultyAttendance(facultyId, e.target.value)}
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
          onClick={() => markFacultyAttendance(facultyId, "Present")}
          style={{ flex: 1, padding: "0.5rem 0", background: "#4CAF50", color: "white", cursor: "pointer", border: "none", borderRadius: "4px" }}
        >
          Present
        </button>
        <button
          onClick={() => markFacultyAttendance(facultyId, "Absent")}
          style={{ flex: 1, padding: "0.5rem 0", background: "#f44336", color: "white", cursor: "pointer", border: "none", borderRadius: "4px" }}
        >
          Absent
        </button>
      </div>
    );
  };

  const generateRandomPassword = () => {
    // Generates a random 8-character string for the temporary password
    return Math.random().toString(36).slice(-8);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const generatedPassword = generateRandomPassword();

    try {
      // 0. Save current admin session
      const { data: { session: adminSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(`Session Error: ${sessionError.message}`);

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: generatedPassword,
      });

      // 1.5 Restore admin session immediately after signup
      if (adminSession) {
        const { error: restoreError } = await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
        if (restoreError) {
          console.error("Error restoring admin session:", restoreError.message);
        }
      }

      if (authError) {
        throw new Error(`Supabase Auth Error: ${authError.message}`);
      }

      if (authData?.user) {
        // 2. Insert into custom "users" table
        const { error: dbError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            name,
            email,
            role,
            standard: standard || null,
          },
        ]);

        if (dbError) {
          throw new Error(`Supabase DB Error: ${dbError.message}`);
        }

        // 3. Send email using EmailJS
        const templateParams = {
          name: name,
          email: email,
          password: generatedPassword,
          role: role,
        };

        try {
          await emailjs.send(
            "service_5brvsmf",
            "template_y15zbhn",
            templateParams
          );
          
          setMessage("User created and email sent successfully");
          
          // Clear form after success
          setName("");
          setEmail("");
          setRole("student");
          setStandard("");
          
        } catch (emailError) {
          // If email fails but user was created
          throw new Error(`EmailJS Error: Could not send email. (${emailError.text || emailError.message})`);
        }
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#f44336", color: "white", border: "none", borderRadius: "4px" }}>
          Logout
        </button>
      </header>
      
      <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "2rem", borderRadius: "8px" }}>
        <h3>Create New User</h3>
        <p>Add new students or faculty to the system.</p>
        
        {message && (
          <div style={{ 
            padding: "1rem", 
            marginBottom: "1rem", 
            borderRadius: "4px",
            background: message.includes("Error") ? "#ffcccc" : "#d4edda",
            color: message.includes("Error") ? "red" : "green"
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }} 
            />
          </div>
          
          {/* Password field is removed since it's generated dynamically */}
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Standard</label>
            <select 
              value={standard} 
              onChange={(e) => setStandard(e.target.value)} 
              required
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            >
              <option value="" disabled>Select Standard</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: "1rem", 
              cursor: loading ? "not-allowed" : "pointer", 
              background: "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              fontWeight: "bold",
              marginTop: "1rem"
            }}
          >
            {loading ? "Creating User & Sending Email..." : "Create User"}
          </button>
        </form>
      </div>

      <hr style={{ margin: "3rem 0", border: "none", borderTop: "1px solid #eee" }} />

      <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "2rem", borderRadius: "8px" }}>
        <h3>Faculty Attendance</h3>
        <p>Mark and view attendance for all faculty members.</p>

        <div style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
          <label style={{ fontWeight: "bold" }}>
            Select Date:{" "}
            <input
              type="date"
              value={facultyDate}
              onChange={handleFacultyDateChange}
              max={today}
              style={{ padding: "0.5rem", marginLeft: "1rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>
        </div>

        {facLoading ? (
          <p>Loading faculties...</p>
        ) : faculties.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", background: "white", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#2196F3", color: "white", textAlign: "left" }}>
                <th style={{ padding: "1rem", border: "1px solid #ddd" }}>Faculty Name</th>
                <th style={{ padding: "1rem", border: "1px solid #ddd", textAlign: "center" }}>Mark Attendance</th>
                <th style={{ padding: "1rem", border: "1px solid #ddd", textAlign: "center" }}>Summary (Current Month)</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((faculty) => {
                const presentDays = facultySummary[faculty.id] || 0;

                return (
                  <tr key={faculty.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "1rem", fontWeight: "bold", color: "#333" }}>{faculty.name}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {renderFacultyAction(faculty.id)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold" }}>
                      {presentDays} / {daysInCurrentMonthPassed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center", color: "#666", padding: "2rem", background: "white", borderRadius: "8px" }}>
            No faculty found in the database.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
