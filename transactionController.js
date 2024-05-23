

const Product = require('./productSchema');

async function initializeDatabase() {
  try {
    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const jsonData = response.data;

    // Insert seed data into the MongoDB collection using the Product schema
    await Product.insertMany(jsonData);

    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Error initializing database:', error.message);
    return { success: false, error: error.message };
  }
}

async function getTransactions(page = 1, perPage = 10, month = '', searchTitle = '') {
  try {
    const query = {
      $and: [
        searchTitle
          ? { title: { $regex: new RegExp(searchTitle, 'i') } }
          : {},
        {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
            ],
          },
        },
      ],
    };

    const totalRecords = await Product.countDocuments(query);

    const transactions = await Product.find(query)
      .select('id title price description category image sold dateOfSale') // Select specific fields
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    return {
      success: true,
      transactions,
      totalRecords,
      page,
      perPage,
    };
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    return { success: false, error: error.message };
  }
}


async function getStatistics(month = '') {
  try {
    const totalSaleAmount = await Product.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
            ],
          },
          sold: true,
        },
      },
      { $group: { _id: null, totalAmount: { $sum: '$price' } } },
    ]);

    const totalSoldItems = await Product.countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
        ],
      },
      sold: true,
    });

    const totalNotSoldItems = await Product.countDocuments({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
        ],
      },
      sold: false,
    });

    return {
      success: true,
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    };
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    return { success: false, error: error.message };
  }
}

async function getBarChartData(month = '') {
  try {
    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Number.MAX_SAFE_INTEGER },
    ];

    const barChartData = [];

    for (const range of priceRanges) {
      const count = await Product.countDocuments({
        $expr: {
          $and: [
            { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
            { $gte: ['$price', range.min] },
            { $lt: ['$price', range.max] },
          ],
        },
      });

      barChartData.push({ range, count });
    }

    return { success: true, barChartData };
  } catch (error) {
    console.error('Error fetching bar chart data:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { initializeDatabase, getTransactions, getStatistics, getBarChartData };
