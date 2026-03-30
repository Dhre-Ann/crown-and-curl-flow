import { useParams, useNavigate } from "react-router-dom";
import { mockStyles } from "@/data/mockStyles";
import { usePriceCalculator } from "@/hooks/usePriceCalculator";
import { Clock, Check } from "lucide-react";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const style = mockStyles.find(s => s.id === id);

  if (!style) {
    return (
      <div className="section-padding text-center">
        <h1 className="heading-display text-3xl font-bold mb-4">Style Not Found</h1>
        <button onClick={() => navigate("/services")} className="btn-gold">Browse Styles</button>
      </div>
    );
  }

  const { partSize, setPartSize, length, setLength, color, setColor, totalPrice } = usePriceCalculator(style);

  const handleProceed = () => {
    const params = new URLSearchParams({
      style: style.id,
      partSize,
      length,
      color,
      total: totalPrice.toString(),
    });
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="section-padding">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left — Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden">
              <img src={style.image} alt={style.name} className="w-full h-full object-cover" width={800} height={1024} />
            </div>
          </div>

          {/* Right — Customization */}
          <div className="animate-slide-in-right">
            <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-2">{style.name}</h1>
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <Clock className="w-4 h-4" /> {style.duration}
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">{style.description}</p>

            <div className="space-y-8">
              {/* Part Size */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Part Size</h3>
                <div className="grid grid-cols-3 gap-3">
                  {style.partSizes.map(ps => (
                    <button
                      key={ps.label}
                      onClick={() => setPartSize(ps.label)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        partSize === ps.label
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div>{ps.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">+${ps.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Length</h3>
                <div className="grid grid-cols-2 gap-3">
                  {style.lengths.map(l => (
                    <button
                      key={l}
                      onClick={() => setLength(l)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                        length === l
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {length === l && <Check className="w-4 h-4 text-accent" />}
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Hair Color</h3>
                <div className="flex flex-wrap gap-3">
                  {style.colors.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className={`flex items-center gap-2 p-2.5 pr-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        color === c.name
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ background: c.hex }}
                      />
                      <span>{c.name}</span>
                      {c.extraCost > 0 && <span className="text-xs text-muted-foreground">+${c.extraCost}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="mt-10 p-6 rounded-xl bg-secondary border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Base price</span>
                <span>${style.basePrice}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Part size ({partSize})</span>
                <span>+${style.partSizes.find(p => p.label === partSize)?.price}</span>
              </div>
              {style.colors.find(c => c.name === color)?.extraCost! > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Color ({color})</span>
                  <span>+${style.colors.find(c => c.name === color)?.extraCost}</span>
                </div>
              )}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="font-display text-lg font-bold">Total</span>
                <span className="font-display text-2xl font-bold text-accent">${totalPrice}</span>
              </div>
              <button onClick={handleProceed} className="btn-gold w-full mt-6 text-center">
                Proceed to Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
