import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchShopsForBrowseRequest, shopServicesPath, type PublicShopListing } from "@/lib/api";
import { Store } from "lucide-react";

export default function BrowseShops() {
  const [shops, setShops] = useState<PublicShopListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await fetchShopsForBrowseRequest();
        if (!cancelled) setShops(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load shops");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container mx-auto text-center text-muted-foreground">Loading shops…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container mx-auto text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-gold text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-3">
            Browse <span className="text-gold-gradient">shops</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose a stylist to see their services and book. Your account works with every shop on Crown Studio.
          </p>
        </div>

        {shops.length === 0 ? (
          <p className="text-center text-muted-foreground">No shops are available yet. Check back soon.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {shops.map((shop) => (
                <li key={shop.id}>
                  <Link
                    to={shopServicesPath(shop.slug)}
                    className="block bg-card border border-border rounded-xl p-5 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0 text-left">
                        <h2 className="font-display text-lg font-semibold">{shop.name}</h2>
                        {shop.serviceCategory ? (
                          <p className="text-sm text-muted-foreground mt-1">{shop.serviceCategory}</p>
                        ) : null}
                        {shop.description ? (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{shop.description}</p>
                        ) : null}
                        <span className="inline-block mt-3 text-sm text-accent font-medium">
                          View services →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
