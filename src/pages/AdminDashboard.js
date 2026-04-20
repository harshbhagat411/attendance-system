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
              onClick={() => setFacultyEditModes(prev => ({ ...prev, [facultyId]: true }))}
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
              onChange={(e) => markFacultyAttendance(facultyId, e.target.value)}
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
          onClick={() => markFacultyAttendance(facultyId, "Present")}
          className="btn btn-success"
          style={{ flex: 1 }}
        >
          Present
        </button>
        <button
          onClick={() => markFacultyAttendance(facultyId, "Absent")}
          className="btn btn-danger"
          style={{ flex: 1 }}
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
    <div className="app-container">
      <header className="navbar">
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </header>
      
      <div className="card">
        <h3 className="section-title">Create New User</h3>
        <p className="section-subtitle">Add new students or faculty to the system.</p>
        
        {message && (
          <div className={message.includes("Error") ? "alert alert-danger" : "alert alert-success"}>
            {message}
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="input-field"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          {/* Password field is removed since it's generated dynamically */}
          
          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="input-field"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Standard</label>
            <select 
              value={standard} 
              onChange={(e) => setStandard(e.target.value)} 
              required
              className="input-field"
            >
              <option value="" disabled>Select Standard</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-success w-full"
            disabled={loading}
          >
            {loading ? "Creating User & Sending Email..." : "Create User"}
          </button>
        </form>
      </div>

      <hr className="divider" />

      <div className="card">
        <h3 className="section-title">Faculty Attendance</h3>
        <p className="section-subtitle">Mark and view attendance for all faculty members.</p>

        <div className="form-group flex items-center">
          <label className="form-label" style={{ marginBottom: 0, marginRight: "1rem" }}>
            Select Date:
          </label>
          <input
            type="date"
            className="input-field"
            style={{ width: "auto" }}
            value={facultyDate}
            onChange={handleFacultyDateChange}
            max={today}
          />
        </div>

        {facLoading ? (
          <p>Loading faculties...</p>
        ) : faculties.length > 0 ? (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th className="text-center">Mark Attendance</th>
                  <th className="text-center">Summary (Current Month)</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => {
                  const presentDays = facultySummary[faculty.id] || 0;

                  return (
                    <tr key={faculty.id}>
                      <td className="font-bold" data-label="Faculty Name">{faculty.name}</td>
                      <td className="text-center" data-label="Mark Attendance">
                        {renderFacultyAction(faculty.id)}
                      </td>
                      <td className="text-center font-bold" data-label="Summary (Current Month)">
                        {presentDays} / {daysInCurrentMonthPassed}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            No faculty found in the database.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
