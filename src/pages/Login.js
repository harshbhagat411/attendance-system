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
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      padding: '2rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h2 className="section-title text-center" style={{ marginBottom: "2rem" }}>Cloud based Attendance System</h2>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ padding: "0.8rem", marginTop: "0.5rem" }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
