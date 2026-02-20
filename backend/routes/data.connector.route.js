const express = require("express");
const cors = require("cors");

const DataConnectorController = require("../controllers/data.connector.controller");

const corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
    exposedHeaders: ["set-cookie"],
};

// creates a new router instance
const router = express.Router();

// router

router.post("/api/dataconnector", cors(), DataConnectorController.postNewDataConnector);
router.get("/api/dataconnector", cors(), DataConnectorController.getAllDataConnector);
router.get("/api/dataconnector/:id", cors(), DataConnectorController.getDataConnectorByID);
router.patch("/api/dataconnector/:id", cors(), DataConnectorController.updateDataConnector);
router.delete("/api/dataconnector/:id", cors(), DataConnectorController.deleteDataConnector);

module.exports = router;
