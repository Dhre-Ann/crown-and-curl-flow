export interface Review {
  id: string;
  customerName: string;
  styleName: string;
  styleId: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "approved" | "featured";
}

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Nia Johnson",
    styleName: "Boho Braids",
    styleId: "boho-braids",
    rating: 5,
    text: "Absolutely love my boho braids! The curly ends are everything. She took her time and the result is stunning.",
    date: "2026-03-16",
    status: "featured",
  },
  {
    id: "rev-2",
    customerName: "Amara Williams",
    styleName: "Knotless Braids",
    styleId: "knotless-braids",
    rating: 5,
    text: "Best knotless braids I've ever had. So lightweight and the parts are so clean!",
    date: "2026-03-10",
    status: "approved",
  },
  {
    id: "rev-3",
    customerName: "Zara Thompson",
    styleName: "Fulani Braids",
    styleId: "fulani-braids",
    rating: 4,
    text: "Beautiful work! The beads and accessories really completed the look. Will definitely be back.",
    date: "2026-03-05",
    status: "approved",
  },
  {
    id: "rev-4",
    customerName: "Keisha Brown",
    styleName: "Stitch Braids",
    styleId: "stitch-braids",
    rating: 5,
    text: "Clean, neat, and lasted for weeks. The stitch pattern was so precise. Highly recommend!",
    date: "2026-02-28",
    status: "pending",
  },
];
