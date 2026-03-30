import { useState } from "react";
import { mockReviews, Review } from "@/data/mockReviews";
import { Star, Check, Award, Trash2 } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  const updateStatus = (id: string, status: Review["status"]) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-gold-light/20 text-warm-brown-light",
    approved: "bg-accent/20 text-accent",
    featured: "bg-accent text-accent-foreground",
  };

  return (
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Reviews</h1>
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className={`bg-card border rounded-xl p-5 ${review.status === "featured" ? "border-accent" : "border-border"}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold">{review.customerName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[review.status]}`}>
                    {review.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{review.styleName} · {new Date(review.date).toLocaleDateString()}</p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">"{review.text}"</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {review.status === "pending" && (
                  <button onClick={() => updateStatus(review.id, "approved")} className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors" title="Approve">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {review.status !== "featured" && (
                  <button onClick={() => updateStatus(review.id, "featured")} className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors" title="Feature">
                    <Award className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteReview(review.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
