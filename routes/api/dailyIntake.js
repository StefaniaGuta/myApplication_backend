const express = require('express');
const Product = require('../../models/ProductValidation.js');
const UserInfo = require('../../models/UserInfoValidation.js');
const  authMiddleware = require('../../middlewares/authMiddleware.js'); 

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    
    const { height, age, currentWeight, desiredWeight, bloodType } = req.body;

    if (!height || !age || !currentWeight || !desiredWeight || !bloodType) {
      return res.status(400).json({ message: "Toate câmpurile sunt necesare." });
    }

    const bloodTypeIndexMap = {
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4
    };

    const bloodTypeIndex = bloodTypeIndexMap[bloodType];
    if (bloodTypeIndex === undefined) {
      return res.status(400).json({ message: "Grupa de sânge invalidă." });
    }

    const products = await Product.find({
      [`groupBloodNotAllowed.${bloodTypeIndex}`]: true
    })
    .limit(5)
    .select('title'); 

    const notRecommendedProducts = products.map(product => product.title);

    const calorieIntake = 2800;

    const userInfo = new UserInfo({
      userId: req.user._id, 
      height,
      age,
      currentWeight,
      desiredWeight,
      bloodType,
      calorieIntake,
      notRecommendedProducts
    });

    await userInfo.save(); 
    
    return res.status(200).json({
      message: 'Informațiile au fost salvate cu succes!',
      calorieIntake,
      notRecommendedProducts
    });

  } catch (err) {
    console.error('Error saving user info:', err);
    res.status(500).json({ message: "Eroare la salvarea informațiilor." });
  }
});

module.exports = router;