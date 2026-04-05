import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { appendActiveShopSlugToParams, fetchStyleById, withShopSearch } from "@/lib/api";
import type { CatalogStyle } from "@/types/style";
import { usePriceCalculator } from "@/hooks/usePriceCalculator";
import { formatStyleDuration, stylePrimaryImageUrl } from "@/lib/styleDisplay";
import { Clock, Check } from "lucide-react";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [style, setStyle] = useState<CatalogStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setStyle(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const row = await fetchStyleById(id);
        if (!cancelled) setStyle(row);
      } catch (e) {
        if (!cancelled) {
          setStyle(null);
          setError(e instanceof Error ? e.message : "Style not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, location.search]);

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container mx-auto text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!style || error) {
    return (
      <div className="section-padding text-center">
        <h1 className="heading-display text-3xl font-bold mb-4">Style Not Found</h1>
        <button type="button" onClick={() => navigate(withShopSearch("/services"))} className="btn-gold">
          Browse Styles
        </button>
      </div>
    );
  }

  return <ServiceDetailLoaded style={style} navigate={navigate} />;
}

function ServiceDetailLoaded({
  style,
  navigate,
}: {
  style: CatalogStyle;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const {
    types,
    grouped,
    humanizeOptionType,
    selectedIdByType,
    setSelectedForType,
    totalPrice,
    partSize,
    length,
    color,
  } = usePriceCalculator(style);

  const handleProceed = () => {
    const params = new URLSearchParams({
      style: style.id,
      partSize,
      length,
      color,
      total: String(Math.round(totalPrice * 100) / 100),
    });
    appendActiveShopSlugToParams(params);
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="section-padding">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden">
              <img
                src={stylePrimaryImageUrl(style)}
                alt={style.name}
                className="w-full h-full object-cover"
                width={800}
                height={1024}
              />
            </div>
          </div>

          <div className="animate-slide-in-right">
            <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-2">{style.name}</h1>
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <Clock className="w-4 h-4" /> {formatStyleDuration(style)}
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">{style.description ?? ""}</p>

            <div className="space-y-8">
              {types.map((optionType) => {
                const opts = grouped[optionType] ?? [];
                if (!opts.length) return null;
                return (
                  <div key={optionType}>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                      {humanizeOptionType(optionType)}
                    </h3>
                    <div
                      className={
                        optionType === "color"
                          ? "flex flex-wrap gap-3"
                          : "grid grid-cols-2 sm:grid-cols-3 gap-3"
                      }
                    >
                      {opts.map((opt) => {
                        const selected = selectedIdByType[optionType] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedForType(optionType, opt.id)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                              optionType === "color" ? "pr-4" : "flex-col sm:flex-row justify-center"
                            } ${
                              selected
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            {optionType === "color" && selected && (
                              <Check className="w-4 h-4 text-accent shrink-0" />
                            )}
                            {optionType === "color" && (
                              <span
                                className="w-6 h-6 rounded-full border border-border shrink-0 bg-muted"
                                aria-hidden
                              />
                            )}
                            <span>{opt.name}</span>
                            {opt.priceModifier > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +${opt.priceModifier}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 p-6 rounded-xl bg-secondary border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Base price</span>
                <span>${style.basePrice}</span>
              </div>
              {types.map((optionType) => {
                const id = selectedIdByType[optionType];
                const opt = style.customizationOptions.find((o) => o.id === id);
                if (!opt || opt.priceModifier <= 0) return null;
                return (
                  <div
                    key={`line-${optionType}`}
                    className="flex items-center justify-between mb-4"
                  >
                    <span className="text-muted-foreground">
                      {humanizeOptionType(optionType)} ({opt.name})
                    </span>
                    <span>+${opt.priceModifier}</span>
                  </div>
                );
              })}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="font-display text-lg font-bold">Total</span>
                <span className="font-display text-2xl font-bold text-accent">
                  ${Number(totalPrice.toFixed(2))}
                </span>
              </div>
              <button type="button" onClick={handleProceed} className="btn-gold w-full mt-6 text-center">
                Proceed to Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
