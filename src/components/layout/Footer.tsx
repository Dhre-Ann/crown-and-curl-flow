import { Link } from "react-router-dom";
import { getShopSlug, withShopSearch } from "@/lib/api";

export default function Footer() {
  const shopSlug = getShopSlug();
  const servicesHref = shopSlug ? withShopSearch("/services") : "/shops";
  const bookHref = shopSlug ? withShopSearch("/book") : "/shops";

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-xl font-bold mb-3">Crown Studio</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Premium braiding & hairstyling, rooted in culture, elevated by craft.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm tracking-wide uppercase opacity-70">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/shops" className="block text-sm opacity-80 hover:opacity-100 transition-opacity">
                Browse shops
              </Link>
              <Link to={servicesHref} className="block text-sm opacity-80 hover:opacity-100 transition-opacity">
                Services
              </Link>
              <Link to={bookHref} className="block text-sm opacity-80 hover:opacity-100 transition-opacity">
                Book now
              </Link>
              <Link to="/login" className="block text-sm opacity-80 hover:opacity-100 transition-opacity">Sign In</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm tracking-wide uppercase opacity-70">Policies</h4>
            <div className="space-y-2 text-sm opacity-80">
              <p>48-hr cancellation notice required</p>
              <p>15-min grace period, then $25 late fee</p>
              <p>No-show = deposit forfeited</p>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs opacity-60">
          © 2026 Crown Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
