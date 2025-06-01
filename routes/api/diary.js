const express = require('express');
const router = express.Router();
const Diary = require('../../models/diary');
const Product = require('../../models/products');
const authMiddleware= require('../../middlewares/auth');  


router.post('/consumed', authMiddleware, async (req, res) => {
  try {
    const { productId, product_weight, selectedDate } = req.body;
    const userId = req.user._id;

    if (!productId || !product_weight || !selectedDate) {
      return res.status(400).json({ message: "Product ID, weight and selectedDate are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product_Calories = (product.calories * product_weight) / 100;

    const selectedDay = new Date(selectedDate);
    selectedDay.setUTCHours(0, 0, 0, 0);

    let diaryEntry = await Diary.findOne({ userId }).populate({
      path: 'entries.productId',
      select: 'title'
    });

    if (!diaryEntry) {
      diaryEntry = new Diary({ userId, entries: [] });
    }

    const entryIndex = diaryEntry.entries.findIndex(entry =>
      entry.productId.toString() === productId.toString() &&
      new Date(entry.date).toISOString().startsWith(selectedDay.toISOString().split('T')[0])
    );

    if (entryIndex > -1) {
      diaryEntry.entries[entryIndex] = {
        productId,
        product_weight,
        product_Calories,
        date: selectedDay
      };
    } else {
      diaryEntry.entries.push({
        productId,
        product_weight,
        product_Calories,
        date: selectedDay
      });
    }

    await diaryEntry.save();

    return res.status(201).json({
      message: "Consumed product added/updated successfully",
      diaryEntry
    });
  } catch (error) {
    return res.status(500).json({ message: "Error adding/updating consumed product" });
  }
});

router.delete('/remove/:date/:productId', authMiddleware, async (req, res) => {
  try {
    const { date, productId } = req.params;
    const userId = req.user._id;

    const inputDate = new Date(date);
    const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));
    const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate() + 1, 23, 59, 59, 999));

    const diaryEntry = await Diary.findOne({
      userId,
      'entries.date': {
        $gte: startDate,
        $lte: endDate
      }
    }).populate({
      path: 'entries.productId', 
      select: 'title'
    });

    if (!diaryEntry) {
      return res.status(404).json({ message: "Diary entry not found for this date!" });
    }

    const entryIndex = diaryEntry.entries.findIndex(entry =>
      entry._id.toString() === productId.toString()
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: `Product not found in diary for this date!` });
    }

    diaryEntry.entries.splice(entryIndex, 1);
    await diaryEntry.save();

    return res.status(200).json({
      message: "Consumed product removed successfully!",
      diaryEntry
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete product!' });
  }
});

router.get('/consumed/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user._id;

    const inputDate = new Date(date);
    const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));
    const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate() + 1, 23, 59, 59, 999));

    const diaryEntries = await Diary.findOne({
      userId,
      'entries.date': {
        $gte: startDate,
        $lte: endDate
      }
    }).populate({
      path: 'entries.productId', 
      select: 'title' 
    });

    if (!diaryEntries || diaryEntries.entries.length === 0) {
      return res.status(200).json({
        date,
        consumedProducts: []
      });
    }

    const filteredEntries = diaryEntries.entries.filter(entry =>
      new Date(entry.date).toDateString() === new Date(date).toDateString()
    );

    return res.status(200).json({
      date,
      consumedProducts: filteredEntries
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching consumed products" });
  }
});


module.exports = router;