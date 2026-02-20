const express = require("express");
const cors = require("cors");

const LlmConnectorController = require("../controllers/llm.connector.controller");

const corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
    exposedHeaders: ["set-cookie"],
};

// creates a new router instance
const router = express.Router();

// router

router.post("/api/llmconnector", cors(), LlmConnectorController.postNewLlmConnector);
router.get("/api/llmconnector", cors(), LlmConnectorController.getAllLlmConnector);
router.get("/api/llmconnector/:id", cors(), LlmConnectorController.getLlmConnectorByID);
router.delete("/api/llmconnector/:id", cors(), LlmConnectorController.deleteLlmConnector);

module.exports = router;
