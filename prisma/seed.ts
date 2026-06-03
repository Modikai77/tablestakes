import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.embedding.deleteMany();
  await prisma.restaurantSource.deleteMany();
  await prisma.restaurantTag.deleteMany();
  await prisma.visitPhoto.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.extractedCandidate.deleteMany();
  await prisma.source.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.restaurantList.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@tablestakes.local",
      name: "Demo User"
    }
  });

  const wineSource = await prisma.source.create({
    data: {
      userId: user.id,
      type: "text",
      sourceLabel: "Wine article notes",
      rawText:
        "Noble Rot in Bloomsbury is still brilliant for wine and a long lunch. Also saved Kolae near Borough Market for Thai food with friends.",
      processingStatus: "processed",
      processedAt: new Date()
    }
  });

  const broadstairsSource = await prisma.source.create({
    data: {
      userId: user.id,
      type: "manual",
      sourceLabel: "Claire's Broadstairs list",
      rawText: "Wyatt & Jones on the seafront is great for seafood and a family lunch. Book ahead.",
      processingStatus: "processed",
      processedAt: new Date()
    }
  });

  await prisma.extractedCandidate.create({
    data: {
      sourceId: wineSource.id,
      name: "Kolae",
      city: "London",
      neighbourhood: "Borough",
      cuisine: "Thai",
      priceLevel: 2,
      tags: ["thai", "friends"],
      occasionTags: ["group", "casual"],
      evidenceSnippet: "saved Kolae near Borough Market for Thai food with friends",
      confidence: 0.86,
      recommendationReason: "Mentioned as a saved place for Thai food with friends."
    }
  });

  const nobleRot = await prisma.restaurant.create({
    data: {
      name: "Noble Rot",
      userId: user.id,
      canonicalName: "Noble Rot Lamb's Conduit",
      address: "51 Lamb's Conduit St, London WC1N 3NB",
      city: "London",
      neighbourhood: "Bloomsbury",
      country: "United Kingdom",
      latitude: 51.5221,
      longitude: -0.1186,
      cuisine: "Modern British",
      priceLevel: 3,
      website: "https://noblerot.co.uk",
      googleMapsUrl: "https://maps.google.com/?q=Noble+Rot+London",
      status: "visited",
      notes: "Excellent wine list. Better for slow lunches than a quick bite.",
      sourceSummary: "Saved from wine article notes.",
      googleRating: 4.6,
      googleReviewCount: 1500,
      tags: {
        create: ["wine", "date night", "lunch"].map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } }
        }))
      },
      restaurantSources: {
        create: [{ sourceId: wineSource.id, evidence: "Noble Rot in Bloomsbury is still brilliant for wine and a long lunch." }]
      },
      visits: {
        create: [
          {
            visitDate: new Date("2026-04-19T12:30:00.000Z"),
            rating: 5,
            companions: "Amit, Sarah",
            notes: "Terrific set lunch. The terrine and Jura by the glass were the winners.",
            dishes: "Terrine, roast chicken, lemon tart",
            wineNotes: "Jura chardonnay by the glass.",
            wouldReturn: true,
            occasion: "long lunch"
          }
        ]
      }
    }
  });

  await prisma.restaurant.create({
    data: {
      name: "Wyatt & Jones",
      userId: user.id,
      canonicalName: "Wyatt & Jones",
      address: "23-27 Harbour St, Broadstairs CT10 1EU",
      city: "Broadstairs",
      neighbourhood: "Harbour",
      country: "United Kingdom",
      latitude: 51.3594,
      longitude: 1.4452,
      cuisine: "Seafood",
      priceLevel: 3,
      website: "https://wyattandjones.co.uk",
      googleMapsUrl: "https://maps.google.com/?q=Wyatt+%26+Jones+Broadstairs",
      status: "want_to_go",
      notes: "Friend recommendation for a good family lunch by the water.",
      sourceSummary: "Claire recommended it for Broadstairs seafood.",
      tags: {
        create: ["seafood", "family", "coastal"].map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } }
        }))
      },
      restaurantSources: {
        create: [{ sourceId: broadstairsSource.id, evidence: "great for seafood and a family lunch" }]
      }
    }
  });

  await prisma.restaurantList.create({
    data: {
      userId: user.id,
      name: "Date nights",
      description: "Places that feel worth booking ahead for a proper evening out.",
      items: {
        create: [{ restaurantId: nobleRot.id }]
      }
    }
  });

  console.log(`Seeded restaurants, including ${nobleRot.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
