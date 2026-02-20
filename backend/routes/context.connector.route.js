const express = require("express");
const cors = require("cors");

const ContextConnectorController = require("../controllers/context.controller");

const corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
    exposedHeaders: ["set-cookie"],
};

// creates a new router instance
const router = express.Router();

// router

router.post("/api/context", cors(), ContextConnectorController.postNewContext);
router.get("/api/context", cors(), ContextConnectorController.getAllContext);
router.get("/api/context/:id", cors(), ContextConnectorController.getAllContext);
router.patch("/api/context/:id", cors(), ContextConnectorController.updateContext);
router.delete("/api/context/:id", cors(), ContextConnectorController.deleteContext);

module.exports = router;
