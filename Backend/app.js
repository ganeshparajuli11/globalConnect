const express = require('express');
const app = express();
const mongoose = require("mongoose");
const port = 3000;
const userRoutes = require("./routes/userAuthenticationRoute");
require('dotenv').config();


app.use(express.json());
app.use("/api/users", userRoutes);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/GlobalConnect")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
