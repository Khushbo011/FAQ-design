import prisma from "../db.server";

export async function getStoreSettings(shop) {
  let settings = await prisma.storeSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: { shop },
    });
  }

  return settings;
}

export async function updateStoreSettings(shop, data) {
  return prisma.storeSettings.update({
    where: { shop },
    data,
  });
}
