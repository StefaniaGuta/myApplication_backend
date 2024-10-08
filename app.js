const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
require("dotenv").config();


const authRouter = require("./routes/api/auth");
const productsRouter = require('./routes/api/products.js');
const dailyIntakeRouter = require('./routes/api/dailyIntake.js');
const consumedProductsRouter = require('./routes/api/consumedProducts.js');


const connectionString = process.env.MONGO_URI;

mongoose
  .connect(connectionString, {
    dbName: "productsColection",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use(passport.initialize());
require("./config/passport")(passport);

app.use(express.static('public'));


app.use("/api/auth", authRouter);
app.use('/api/products', productsRouter);
app.use('/api/daily-intake', dailyIntakeRouter);
app.use('/api/consumed-products', consumedProductsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not ok" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
