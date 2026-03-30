export interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  styleName: string;
  styleId: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  totalPrice: number;
  depositPaid: number;
  customizations: {
    partSize: string;
    length: string;
    color: string;
  };
}

export const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    customerName: "Nia Johnson",
    customerEmail: "customer@demo.com",
    styleName: "Knotless Braids",
    styleId: "knotless-braids",
    date: "2026-04-02",
    time: "9:00 AM",
    status: "confirmed",
    totalPrice: 240,
    depositPaid: 72,
    customizations: { partSize: "Medium", length: "Mid Back", color: "1B" },
  },
  {
    id: "apt-2",
    customerName: "Nia Johnson",
    customerEmail: "customer@demo.com",
    styleName: "Boho Braids",
    styleId: "boho-braids",
    date: "2026-03-15",
    time: "1:00 PM",
    status: "completed",
    totalPrice: 280,
    depositPaid: 84,
    customizations: { partSize: "Small", length: "Waist", color: "27" },
  },
  {
    id: "apt-3",
    customerName: "Amara Williams",
    customerEmail: "amara@example.com",
    styleName: "Fulani Braids",
    styleId: "fulani-braids",
    date: "2026-04-03",
    time: "1:00 PM",
    status: "pending",
    totalPrice: 220,
    depositPaid: 66,
    customizations: { partSize: "Medium", length: "Waist", color: "30" },
  },
  {
    id: "apt-4",
    customerName: "Zara Thompson",
    customerEmail: "zara@example.com",
    styleName: "Box Braids",
    styleId: "box-braids",
    date: "2026-04-04",
    time: "9:00 AM",
    status: "pending",
    totalPrice: 210,
    depositPaid: 63,
    customizations: { partSize: "Large", length: "Mid Back", color: "Blonde" },
  },
  {
    id: "apt-5",
    customerName: "Keisha Brown",
    customerEmail: "keisha@example.com",
    styleName: "Stitch Braids",
    styleId: "stitch-braids",
    date: "2026-04-05",
    time: "5:00 PM",
    status: "confirmed",
    totalPrice: 200,
    depositPaid: 60,
    customizations: { partSize: "Small", length: "Shoulder", color: "1B" },
  },
];
