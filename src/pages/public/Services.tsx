import { useState } from "react";
import { Link } from "react-router-dom";
import { mockStyles } from "@/data/mockStyles";
import { Clock, DollarSign } from "lucide-react";

const categories = ["All", ...Array.from(new Set(mockStyles.map(s => s.category)))];

export default function Services() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? mockStyles : mockStyles.filter(s => s.category === active);

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

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                active === cat
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(style => (
            <div key={style.id} className="card-warm group">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={style.image} alt={style.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={1024} />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold mb-1">{style.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{style.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <DollarSign className="w-4 h-4" />{style.basePrice}+
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />{style.duration}
                  </span>
                </div>
                <Link to={`/services/${style.id}`} className="btn-gold w-full text-center block text-sm !py-2.5">
                  Customize & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
