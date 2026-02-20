const express = require("express");
const cors = require("cors");

const UserController = require("../controllers/user.controller");

// create a new router instance
const router = express.Router();

const corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
    exposedHeaders: ["set-cookie"],
};

// router
router.get("/api/users", cors(), UserController.getAllUser);
router.get("/api/users/:id", cors(), UserController.getUserByID);
router.patch("/api/users/:id", cors(), UserController.updateUser);
router.delete("/api/users/:id", cors(), UserController.deleteUser);

module.exports = router;