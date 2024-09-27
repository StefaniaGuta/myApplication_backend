const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  categories: {
    type: String,
  },
  weight: {
    type: Number,
  },
  title: {
    type: String,
  },
  calories: {
    type: Number,
  },
  groupBloodNotAllowed: {
    type: [Boolean],
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;