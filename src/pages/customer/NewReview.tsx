import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Upload, Check } from "lucide-react";

export default function NewReview() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="section-padding flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h1 className="heading-display text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">Your review has been submitted for approval.</p>
          <button onClick={() => navigate("/customer/dashboard")} className="btn-gold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-lg">
        <h1 className="heading-display text-3xl font-bold mb-2">Leave a Review</h1>
        <p className="text-muted-foreground mb-8">Share your experience with others.</p>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {/* Star rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                >
                  <Star className={`w-8 h-8 transition-colors ${n <= (hover || rating) ? "fill-gold text-gold" : "text-border"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your Review</label>
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              rows={4}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Tell us about your experience..."
            />
          </div>

          {/* Photo upload UI */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Photos (optional)</label>
            <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-muted-foreground/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop photos or click to browse</p>
            </div>
          </div>

          <button
            onClick={() => setSubmitted(true)}
            disabled={rating === 0}
            className="btn-gold w-full text-center disabled:opacity-40 disabled:pointer-events-none"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
