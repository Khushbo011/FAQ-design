import db from "../db.server";

export async function getCategories(shop) {
  return db.category.findMany({
    where: { shop },
    orderBy: { position: "asc" },
  });
}

export async function createCategory(data) {
  return db.category.create({ data });
}

export async function updateCategory(id, shop, data) {
  return db.category.updateMany({
    where: { id, shop },
    data,
  });
}

export async function deleteCategory(id, shop) {
  // First move all FAQs in this category to uncategorized (null)
  await db.fAQ.updateMany({
    where: { categoryId: id, shop },
    data: { categoryId: null },
  });

  return db.category.deleteMany({
    where: { id, shop },
  });
}
