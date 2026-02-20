const express = require("express");
const cors = require("cors");

const QueryController = require("../controllers/query.controller");

// creates a new router instance
const router = express.Router();

// router

router.post("/api/query", QueryController.postQuery);
router.get("/api/traces", QueryController.getTraces);

module.exports = router;
