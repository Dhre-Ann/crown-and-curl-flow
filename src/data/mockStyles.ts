import styleKnotless from "@/assets/style-knotless.jpg";
import styleFulani from "@/assets/style-fulani.jpg";
import styleBoho from "@/assets/style-boho.jpg";
import styleBox from "@/assets/style-box.jpg";
import styleStitch from "@/assets/style-stitch.jpg";

export interface HairStyle {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  duration: string;
  description: string;
  image: string;
  partSizes: { label: string; price: number }[];
  lengths: string[];
  colors: { name: string; hex: string; extraCost: number }[];
}

export const mockStyles: HairStyle[] = [
  {
    id: "knotless-braids",
    name: "Knotless Braids",
    category: "Knotless",
    basePrice: 180,
    duration: "4–6 hrs",
    description: "Lightweight, tension-free braids that start with your natural hair for a seamless, natural-looking finish. Perfect for protective styling with minimal scalp stress.",
    image: styleKnotless,
    partSizes: [
      { label: "Small", price: 60 },
      { label: "Medium", price: 40 },
      { label: "Large", price: 20 },
    ],
    lengths: ["Shoulder", "Mid Back", "Waist", "Butt Length"],
    colors: [
      { name: "1B", hex: "#1a1110", extraCost: 0 },
      { name: "27", hex: "#a67b5b", extraCost: 0 },
      { name: "30", hex: "#8b4513", extraCost: 0 },
      { name: "Blonde", hex: "#daa520", extraCost: 0 },
      { name: "Custom Mix", hex: "linear-gradient(135deg, #1a1110, #daa520)", extraCost: 20 },
    ],
  },
  {
    id: "fulani-braids",
    name: "Fulani Braids",
    category: "Fulani",
    basePrice: 160,
    duration: "3–5 hrs",
    description: "Traditional West African–inspired braids featuring a signature center cornrow with side braids and decorative beads or cuffs.",
    image: styleFulani,
    partSizes: [
      { label: "Small", price: 60 },
      { label: "Medium", price: 40 },
      { label: "Large", price: 20 },
    ],
    lengths: ["Shoulder", "Mid Back", "Waist", "Butt Length"],
    colors: [
      { name: "1B", hex: "#1a1110", extraCost: 0 },
      { name: "27", hex: "#a67b5b", extraCost: 0 },
      { name: "30", hex: "#8b4513", extraCost: 0 },
      { name: "Blonde", hex: "#daa520", extraCost: 0 },
      { name: "Custom Mix", hex: "linear-gradient(135deg, #1a1110, #daa520)", extraCost: 20 },
    ],
  },
  {
    id: "boho-braids",
    name: "Boho Braids",
    category: "Boho",
    basePrice: 200,
    duration: "5–7 hrs",
    description: "Free-spirited braids with curly, textured ends that give a bohemian goddess look. The perfect blend of structure and effortless beauty.",
    image: styleBoho,
    partSizes: [
      { label: "Small", price: 60 },
      { label: "Medium", price: 40 },
      { label: "Large", price: 20 },
    ],
    lengths: ["Shoulder", "Mid Back", "Waist", "Butt Length"],
    colors: [
      { name: "1B", hex: "#1a1110", extraCost: 0 },
      { name: "27", hex: "#a67b5b", extraCost: 0 },
      { name: "30", hex: "#8b4513", extraCost: 0 },
      { name: "Blonde", hex: "#daa520", extraCost: 0 },
      { name: "Custom Mix", hex: "linear-gradient(135deg, #1a1110, #daa520)", extraCost: 20 },
    ],
  },
  {
    id: "box-braids",
    name: "Box Braids",
    category: "Box Braids",
    basePrice: 150,
    duration: "4–6 hrs",
    description: "The timeless classic. Individual plaits sectioned into square-shaped parts for a clean, versatile look that can be styled up or down.",
    image: styleBox,
    partSizes: [
      { label: "Small", price: 60 },
      { label: "Medium", price: 40 },
      { label: "Large", price: 20 },
    ],
    lengths: ["Shoulder", "Mid Back", "Waist", "Butt Length"],
    colors: [
      { name: "1B", hex: "#1a1110", extraCost: 0 },
      { name: "27", hex: "#a67b5b", extraCost: 0 },
      { name: "30", hex: "#8b4513", extraCost: 0 },
      { name: "Blonde", hex: "#daa520", extraCost: 0 },
      { name: "Custom Mix", hex: "linear-gradient(135deg, #1a1110, #daa520)", extraCost: 20 },
    ],
  },
  {
    id: "stitch-braids",
    name: "Stitch Braids",
    category: "Stitch",
    basePrice: 140,
    duration: "2–4 hrs",
    description: "Sleek cornrows with a visible stitch pattern for a clean, detailed finish. A modern take on the classic cornrow that's both stylish and practical.",
    image: styleStitch,
    partSizes: [
      { label: "Small", price: 60 },
      { label: "Medium", price: 40 },
      { label: "Large", price: 20 },
    ],
    lengths: ["Shoulder", "Mid Back", "Waist", "Butt Length"],
    colors: [
      { name: "1B", hex: "#1a1110", extraCost: 0 },
      { name: "27", hex: "#a67b5b", extraCost: 0 },
      { name: "30", hex: "#8b4513", extraCost: 0 },
      { name: "Blonde", hex: "#daa520", extraCost: 0 },
      { name: "Custom Mix", hex: "linear-gradient(135deg, #1a1110, #daa520)", extraCost: 20 },
    ],
  },
];
