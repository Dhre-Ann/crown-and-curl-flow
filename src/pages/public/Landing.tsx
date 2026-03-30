import { Link } from "react-router-dom";
import { mockStyles } from "@/data/mockStyles";
import { mockReviews } from "@/data/mockReviews";
import { Star, ArrowRight, Clock, Sparkles, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-braids.jpg";

export default function Landing() {
  const featuredStyles = mockStyles.slice(0, 4);
  const featuredReviews = mockReviews.filter(r => r.status === "featured" || r.status === "approved").slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Beautiful braided hairstyle" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-xl animate-fade-in">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream leading-[1.1] mb-6">
              Your Crown, <br /><span className="text-gold-gradient">Our Craft</span>
            </h1>
            <p className="text-cream/80 text-lg sm:text-xl mb-8 leading-relaxed font-body">
              Premium braiding & protective styling, rooted in culture and elevated by expert craftsmanship.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/services" className="btn-gold inline-flex items-center gap-2">
                Book Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/services" className="btn-outline-warm !border-cream !text-cream hover:!bg-cream/10">
                View Styles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <h2 className="heading-display text-3xl sm:text-4xl font-bold text-center mb-12">
            How It <span className="text-gold-gradient">Works</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Sparkles, title: "Browse", desc: "Explore our curated collection of braiding styles" },
              { icon: Clock, title: "Customize", desc: "Choose your size, length, and color for a perfect look" },
              { icon: Calendar, title: "Book", desc: "Pick your date, pay a deposit, and you're all set" },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Styles */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="heading-display text-3xl sm:text-4xl font-bold">
              Featured <span className="text-gold-gradient">Styles</span>
            </h2>
            <Link to="/services" className="text-accent font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredStyles.map((style) => (
              <Link key={style.id} to={`/services/${style.id}`} className="card-warm group">
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={style.image} alt={style.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={1024} />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold">{style.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-accent font-bold">${style.basePrice}+</span>
                    <span className="text-xs text-muted-foreground">{style.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <h2 className="heading-display text-3xl sm:text-4xl font-bold text-center mb-12">
            What Our Clients Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {featuredReviews.map((review) => (
              <div key={review.id} className="bg-primary-foreground/10 backdrop-blur rounded-xl p-6 border border-primary-foreground/10">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm opacity-90 mb-4 leading-relaxed italic">"{review.text}"</p>
                <div className="text-xs opacity-70">
                  <span className="font-semibold">{review.customerName}</span> — {review.styleName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
