import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      if (email === "admin@demo.com") navigate("/admin");
      else navigate("/customer/dashboard");
    } else {
      setError("Invalid email or password. Try customer@demo.com or admin@demo.com with password 'password'.");
    }
  };

  return (
    <div className="section-padding flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="heading-display text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to manage your appointments</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="customer@demo.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="password"
            />
          </div>
          <button type="submit" className="btn-gold w-full text-center">Sign In</button>
          <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
            <p><strong>Demo accounts:</strong></p>
            <p>customer@demo.com / password</p>
            <p>admin@demo.com / password</p>
          </div>
        </form>
      </div>
    </div>
  );
}
