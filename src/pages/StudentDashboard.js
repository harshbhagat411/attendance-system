import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import AttendancePage from "./AttendancePage";
import emailjs from "emailjs-com";

const StudentDashboard = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Initialize emailjs with your public key
    emailjs.init("2Tz2HIRHn5-2jaLxY");
    fetchStudentData();
  }, []);

  // Use an effect to watch when percentage drops below 75% and trigger email
  useEffect(() => {
    if (!loading && percentage < 75 && attendance.length > 0 && !emailSent && userName && userEmail) {
      sendAlertEmail(userName, userEmail, percentage);
    }
  }, [percentage, attendance, loading, emailSent, userName, userEmail]);

  const fetchStudentData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (user) {
        setUserEmail(user.email); // Store the student's email for EmailJS
        
        // Fetch user name
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
          
        if (userData) setUserName(userData.name);

        // Fetch attendance records
        const { data: attendanceData, error: dbError } = await supabase
          .from("attendance")
          .select("*")
          .eq("student_id", user.id)
          .order("date", { ascending: false });

        if (dbError) throw dbError;
        
        if (attendanceData) {
          setAttendance(attendanceData);
          calculatePercentage(attendanceData);
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (records) => {
    if (!records || records.length === 0) {
      setPercentage(0);
      return;
    }
    
    const presentCount = records.filter((r) => r.status === "Present").length;
    const total = records.length;
    const calcPercentage = (presentCount / total) * 100;
    
    setPercentage(calcPercentage);
  };

  const sendAlertEmail = async (studentName, studentEmail, currentPercentage) => {
    try {
      // Set to true immediately to prevent duplicate sends during async call
      setEmailSent(true);

      const templateParams = {
        name: studentName,
        email: studentEmail, // This ensures EmailJS knows where to send it!
        attendance: currentPercentage.toFixed(1)
      };

      await emailjs.send(
        "service_5brvsmf",
        "template_k3cncx9",
        templateParams,
        "2Tz2HIRHn5-2jaLxY"
      );
      
      console.log("Alert email sent successfully to", studentEmail);
    } catch (error) {
      // Revert if there was an error so it can be retried if needed
      setEmailSent(false);
      console.error("Alert email failed to send:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading dashboard...</div>;
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <h2>Welcome, {userName || "Student"}</h2>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </header>
      
      <div>
        <div className="card flex flex-between items-center">
          <div>
            <h3 className="section-title">Overall Attendance</h3>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>Total Classes Recorded: {attendance.length}</p>
          </div>
          <div style={{ 
            fontSize: "2rem", 
            fontWeight: "bold",
            color: percentage >= 75 ? "var(--success-color)" : "var(--danger-color)"
          }}>
            {percentage.toFixed(1)}%
          </div>
        </div>

        {percentage < 75 && attendance.length > 0 && (
          <div className="alert alert-danger" style={{ borderLeft: "5px solid var(--danger-color)", textAlign: "left" }}>
            <strong>⚠️ Warning:</strong> Your attendance is below the 75% requirement. Please ensure you attend the upcoming classes.
          </div>
        )}
        
        <div className="card">
          <h3 className="section-title">Attendance History</h3>
          <AttendancePage attendanceData={attendance} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
