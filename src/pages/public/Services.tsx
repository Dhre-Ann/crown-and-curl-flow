import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStylesCatalog } from "@/lib/api";
import type { CatalogStyle } from "@/types/style";
import { formatStyleDuration, stylePrimaryImageUrl } from "@/lib/styleDisplay";
import { Clock, DollarSign } from "lucide-react";

export default function Services() {
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await fetchStylesCatalog({ auth: false });
        if (!cancelled) setStyles(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load styles");
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
        <div className="container mx-auto text-center text-muted-foreground">Loading styles…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container mx-auto text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-gold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="heading-display text-4xl sm:text-5xl font-bold mb-4">
            Our <span className="text-gold-gradient">Styles</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse our curated collection and find your next look.
          </p>
        </div>

        {styles.length === 0 ? (
          <p className="text-center text-muted-foreground">No styles available yet. Check back soon.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {styles.map((style) => (
            <div key={style.id} className="card-warm group">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={stylePrimaryImageUrl(style)}
                  alt={style.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={800}
                  height={1024}
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold mb-1">{style.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {style.description ?? ""}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <DollarSign className="w-4 h-4" />
                    {style.basePrice}+
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    {formatStyleDuration(style)}
                  </span>
                </div>
                <Link
                  to={`/services/${style.id}`}
                  className="btn-gold w-full text-center block text-sm !py-2.5"
                >
                  Customize & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
