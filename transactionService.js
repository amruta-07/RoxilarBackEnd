const { ObjectId } = require('mongodb');

async function getTransactions(db, page = 1, perPage = 10, search = '') {
  const collection = db.collection('products');

  const query = search
    ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } },
      ],
    }
    : {};

  const totalRecords = await collection.countDocuments(query);

  const transactions = await collection
    .find(query)
    .skip((page - 1) * perPage)
    .limit(perPage)
    .toArray();

  return { transactions, totalRecords };
}

module.exports = { getTransactions };


