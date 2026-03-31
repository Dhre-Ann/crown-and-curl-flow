import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await login({ email, password });
      if (result.user.role === "shop_admin" || result.user.role === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password.";
      setError(message);
    } finally {
      setSubmitting(false);
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
          <button type="submit" className="btn-gold w-full text-center" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In"}
          </button>
          <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
            <p>
              No account yet?{" "}
              <Link to="/register" className="text-accent underline">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
