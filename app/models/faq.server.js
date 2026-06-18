import db from "../db.server";

export async function getFaqs(shop) {
  return db.fAQ.findMany({
    where: { shop },
    include: { category: true },
    orderBy: { position: "asc" },
  });
}

export async function getFaq(id, shop) {
  return db.fAQ.findFirst({
    where: { id, shop },
  });
}

export async function createFaq(data) {
  return db.fAQ.create({ data });
}

export async function updateFaq(id, shop, data) {
  return db.fAQ.updateMany({
    where: { id, shop },
    data,
  });
}

export async function deleteFaq(id, shop) {
  return db.fAQ.deleteMany({
    where: { id, shop },
  });
}

export async function updateFaqPositions(shop, updates) {
  const transactions = updates.map(({ id, position }) =>
    db.fAQ.updateMany({
      where: { id, shop },
      data: { position },
    })
  );
  return db.$transaction(transactions);
}
