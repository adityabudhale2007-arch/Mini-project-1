require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./server/db");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

app.use("/api/auth", require("./server/routes/auth"));

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
