const express = require('express');
const router = express.Router();
const Product = require('../../models/product');
const Calculator = require('../../models/calculator');

const authMiddleware= require('../../middlewares/auth');

function getBloodTypeIndex(bloodType) {
  const bloodTypes = ['0(I)', 'A(II)', 'B(III)', 'AB(IV)'];
  return bloodTypes.indexOf(bloodType);
};

router.post('/public-recommendations', async (req, res, next) => {
  try {
    const { height, age, current_weight, desired_weight, blood_type } = req.body;

    if (!height || !age || !current_weight || !desired_weight || !blood_type) {
      return res.status(400).json({ message: "All fields are required!".red });
    }

    const bloodTypeIndex = getBloodTypeIndex(blood_type);
    if (bloodTypeIndex === -1) {
      return res.status(400).json({ message: "Invalid blood type!".red });
    }

    const products = await Product.find({});

    let forbiddenProducts_public = products.filter(product => product.groupBloodNotAllowed[bloodTypeIndex] === true);
    forbiddenProducts_public = forbiddenProducts_public.slice(0, 4);
    forbiddenProducts_public.sort((a, b) => a.title.localeCompare(b.title));

    const length = forbiddenProducts_public.length
    
    const dailyCalories = 2800;

    return res.status(200).json({
      dailyCalories,
      forbiddenProducts_public,
      length
    });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while fetching recommendations.".red });
  }
});


router.post('/private-recommendations', authMiddleware, async (req, res) => {
  try {
    const { height, age, current_weight, desired_weight, blood_type } = req.body;
    const userId = req.user._id;

    if (!height || !age || !current_weight || !desired_weight || !blood_type) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const bloodTypeIndex = getBloodTypeIndex(blood_type);
    if (bloodTypeIndex === -1) {
      return res.status(400).json({ message: "Invalid blood type!" });
    }

    const existingData = await Calculator.findOne({ userId });

    if (existingData) {
      existingData.data = [{
        height,
        age,
        current_weight,
        desired_weight,
        blood_type
      }];
      await existingData.save();
    } else {
      const newCalculatorData = new Calculator({
        userId,
        data: [{
          height,
          age,
          current_weight,
          desired_weight,
          blood_type
        }]
      });
      await newCalculatorData.save();
    }

    const products = await Product.find({});
    let forbiddenProducts_private = products.filter(product => product.groupBloodNotAllowed[bloodTypeIndex] === true);
    forbiddenProducts_private = forbiddenProducts_private.slice(0, 4);
    forbiddenProducts_private.sort((a, b) => a.title.localeCompare(b.title));

    const length = forbiddenProducts_private.length
    const dailyCalories = 2800; 

    return res.status(200).json({
      dailyCalories,
      forbiddenProducts_private,
      length
    });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while processing your request." });
  }
});


module.exports = router;