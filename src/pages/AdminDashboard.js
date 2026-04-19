import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const AdminDashboard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Insert into custom "users" table
        const { error: dbError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            name,
            email,
            role,
          },
        ]);

        if (dbError) throw dbError;

        setMessage("User created successfully!");
        setName("");
        setEmail("");
        setPassword("");
        setRole("student");
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
        <p>Add new students, faculty, or admins to the system.</p>
        
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
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Temporary Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength="6" 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              style={{ width: "100%", padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
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
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
