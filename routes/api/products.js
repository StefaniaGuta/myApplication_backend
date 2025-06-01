const express = require('express');
const Product = require('../../models/product');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query; 

    if (!q) {
      return res.status(400).json({ message: "Please enter a search term." });
    }

    const products = await Product.find({
      title: { $regex: q, $options: 'i' }
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found." });
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error searching for products." });
  }
});

module.exports = router;