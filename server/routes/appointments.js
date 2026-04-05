const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, loadCurrentUser } = require("../middleware/auth");

const router = express.Router();

function serializeMineAppointment(row) {
  const d = row.date;
  const dateStr = d instanceof Date ? d.toISOString().slice(0, 10) : String(d);

  return {
    id: row.id,
    date: dateStr,
    time: row.time,
    status: row.status,
    depositAmount: Number(row.depositAmount),
    totalPrice: Number(row.totalPrice),
    shop: {
      name: row.shop.name,
      slug: row.shop.slug,
    },
    style: {
      name: row.style.name,
    },
  };
}

/**
 * Customer-global: all appointments for the authenticated user across every shop (no shop filter).
 */
router.get("/mine", requireAuth, loadCurrentUser, async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const rows = await prisma.appointment.findMany({
      where: { userId },
      include: {
        shop: { select: { name: true, slug: true } },
        style: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });

    return res.status(200).json({
      success: true,
      data: { appointments: rows.map(serializeMineAppointment) },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load appointments" });
  }
});

module.exports = router;
