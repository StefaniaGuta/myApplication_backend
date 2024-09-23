const app = require("./app");

app.get("/", (req, res) => {
    res.json({fruits: ["banana", "oranges"]})
})

app.listen(3000, () => {
  console.log("Server is running. Use our API on port: 3000");
});