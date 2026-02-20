const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
dotenv.config();

const errorHandler = require("./middleware/error");
const db = require("./helpers/db");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const contextRoutes = require("./routes/context.connector.route");
const llmConnectorRoutes = require("./routes/llm.connector.route");
const dataConnectorRoutes = require("./routes/data.connector.route");
const queryRoutes = require("./routes/query.route");

const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

const corsOptions = {
  origin: "http://localhost:3000", //included origin as true
  credentials: true, //included credentials as true
};

async function main() {
  try {
    // memastikan database connect baru jalankan app
    await db.openDBConnection(uri);
    const app = express();

    app.use(cookieParser());
    app.use(cors(corsOptions));
    app.use(express.json()); // agar kita bisa ambil request body json

    app.use(userRoutes);
    app.use(authRoutes);
    app.use(contextRoutes);
    app.use(llmConnectorRoutes);
    app.use(dataConnectorRoutes);
    app.use(queryRoutes);

    app.use(errorHandler);

    app.listen(port, () => {
      console.log("Server is running on port", port);
    });
  } catch (error) {
    console.log("main", error);
  }
}

main();
