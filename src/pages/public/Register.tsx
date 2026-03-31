import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type AccountType = "customer" | "shop_admin";

export default function Register() {
  const navigate = useNavigate();
  const { registerCustomer, registerShop } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (accountType === "shop_admin") {
        await registerShop({ name, email, password, shopName, shopSlug });
        navigate("/admin");
      } else {
        await registerCustomer({ name, email, password });
        navigate("/customer/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-padding flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="heading-display text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm">Start booking or manage your shop</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</p>}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="customer">Customer</option>
              <option value="shop_admin">Shop Owner</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          {accountType === "shop_admin" && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Shop Slug</label>
                <input
                  type="text"
                  value={shopSlug}
                  onChange={(e) => setShopSlug(e.target.value)}
                  placeholder="my-shop-slug"
                  className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-gold w-full text-center" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-xs text-muted-foreground text-center pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-accent underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
