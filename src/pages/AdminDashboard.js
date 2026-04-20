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

  useEffect(() => {
    // Initialize emailjs with the public key on component mount
    emailjs.init("2Tz2HiRHn5-2jaLxY");
  }, []);

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
    </div>
  );
};

export default AdminDashboard;
