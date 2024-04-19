const express = require("express");
const weatherRoutes = require("./routes/weatherRoutes.js");
const solarRoutes = require("./routes/solarRoutes.js");
const cors = require("cors"); // Import cors

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/weather", cors(), weatherRoutes);

app.use("/api/solar", cors(), solarRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
