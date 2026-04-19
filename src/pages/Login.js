import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Login = ({ session, role }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If user is already logged in (e.g., page refresh), redirect them
  useEffect(() => {
    if (session && role) {
      if (role === "admin") navigate("/admin");
      else if (role === "faculty") navigate("/faculty");
      else if (role === "student") navigate("/student");
    }
  }, [session, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Login with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;

    // 2. Fetch role from users table using email and maybeSingle
    if (user && user.email) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (userError) {
        setError(`Database Error: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!userData) {
        setError("User not found in the database. Please contact an admin.");
        setLoading(false);
        return;
      }

      if (!userData.role) {
        setError("Role missing for this user.");
        setLoading(false);
        return;
      }

      // 3. Redirect based on role
      const userRole = userData.role;
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "faculty") navigate("/faculty");
      else if (userRole === "student") navigate("/student");
      else setError("Found invalid role in database.");
      
      // Note: We don't necessarily need to set loading to false here
      // because the component will be unmounted upon successful navigation.
    } else {
      setError("Login succeeded but user data is missing.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto", marginTop: "10vh" }}>
      <h2 style={{ textAlign: "center" }}>Attendance System Login</h2>
      
      {error && (
        <div style={{ background: "#ffcccc", color: "red", padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "0.8rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: "0.8rem", 
            cursor: loading ? "not-allowed" : "pointer", 
            background: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
