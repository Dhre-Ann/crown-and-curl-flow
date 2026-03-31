const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  const shop = await prisma.shop.upsert({
    where: { slug: "kairstyles" },
    update: {
      name: "KairStyles",
      subscriptionStatus: "trial",
      // subscriptionEndsAt intentionally not seeded yet.
    },
    create: {
      name: "KairStyles",
      slug: "kairstyles",
      subscriptionStatus: "trial",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "admin@kairstyles.com" },
    update: {
      name: "Kair Admin",
      role: "shop_admin",
      password: passwordHash,
      shopId: shop.id,
    },
    create: {
      name: "Kair Admin",
      email: "admin@kairstyles.com",
      password: passwordHash,
      role: "shop_admin",
      shopId: shop.id,
    },
  });

  // Ensure the shop's designated owner is the shop_admin user.
  await prisma.shop.update({
    where: { id: shop.id },
    data: { ownerId: owner.id },
  });

  await prisma.user.upsert({
    where: { email: "customer@demo.com" },
    update: {
      name: "Demo Customer",
      role: "customer",
      password: passwordHash,
      shopId: shop.id,
    },
    create: {
      name: "Demo Customer",
      email: "customer@demo.com",
      password: passwordHash,
      role: "customer",
      shopId: shop.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@crownstudio.com" },
    update: {
      name: "Crown Studio",
      role: "super_admin",
      password: passwordHash,
      shopId: null,
    },
    create: {
      name: "Crown Studio",
      email: "admin@crownstudio.com",
      password: passwordHash,
      role: "super_admin",
      shopId: null,
    },
  });

  const workHourCount = await prisma.workHour.count({ where: { shopId: shop.id } });
  if (workHourCount === 0) {
    // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, ... 6=Sat
    const workHours = [2, 3, 4, 5, 6].map((day) => ({
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "18:00",
      isActive: true,
      shopId: shop.id,
    }));

    await prisma.workHour.createMany({ data: workHours });
  }

  const styleCount = await prisma.style.count({ where: { shopId: shop.id } });
  if (styleCount === 0) {
    const styles = [
      {
        name: "Knotless Braids",
        description: "Lightweight knotless braids for a natural-looking finish.",
        basePrice: "180.00",
        durationMin: 4,
        durationMax: 6,
        customizationOptions: [
          { optionType: "size", name: "Small", priceModifier: "0.00" },
          { optionType: "length", name: "Medium (12-14 in)", priceModifier: "0.00" },
          { optionType: "color", name: "1B Natural", priceModifier: "0.00" },
        ],
      },
      {
        name: "Fulani Braids",
        description: "Classic Fulani braids with signature patterns and statement styling.",
        basePrice: "160.00",
        durationMin: 3,
        durationMax: 5,
        customizationOptions: [
          { optionType: "size", name: "Medium", priceModifier: "10.00" },
          { optionType: "length", name: "Medium (12-14 in)", priceModifier: "0.00" },
          { optionType: "color", name: "Honey Blonde", priceModifier: "40.00" },
        ],
      },
      {
        name: "Boho Braids",
        description: "Soft bohemian braids with a voluminous, carefree look.",
        basePrice: "200.00",
        durationMin: 5,
        durationMax: 7,
        customizationOptions: [
          { optionType: "size", name: "Large", priceModifier: "35.00" },
          { optionType: "length", name: "Long (16-18 in)", priceModifier: "25.00" },
          { optionType: "color", name: "Caramel Mix", priceModifier: "55.00" },
        ],
      },
      {
        name: "Box Braids",
        description: "Timeless box braids designed for sleek length and lasting wear.",
        basePrice: "150.00",
        durationMin: 4,
        durationMax: 6,
        customizationOptions: [
          { optionType: "size", name: "Medium", priceModifier: "0.00" },
          { optionType: "length", name: "Short (10-12 in)", priceModifier: "0.00" },
          { optionType: "color", name: "1B/30", priceModifier: "30.00" },
        ],
      },
      {
        name: "Stitch Braids",
        description: "Modern stitch braids with clean parting and smooth placement.",
        basePrice: "140.00",
        durationMin: 2,
        durationMax: 4,
        customizationOptions: [
          { optionType: "size", name: "Small", priceModifier: "0.00" },
          { optionType: "length", name: "Medium (12-14 in)", priceModifier: "10.00" },
          { optionType: "color", name: "Natural Black", priceModifier: "0.00" },
        ],
      },
    ];

    for (const style of styles) {
      await prisma.style.create({
        data: {
          name: style.name,
          description: style.description,
          basePrice: style.basePrice,
          durationMin: style.durationMin,
          durationMax: style.durationMax,
          shopId: shop.id,
          customizationOptions: {
            create: style.customizationOptions.map((opt) => ({
              optionType: opt.optionType,
              name: opt.name,
              priceModifier: opt.priceModifier,
            })),
          },
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

