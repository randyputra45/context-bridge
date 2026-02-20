const express = require("express");
const cors = require("cors");

const AuthController = require("../controllers/auth.controller");

// creates a new router instance
const router = express.Router();

// important to set cookie 
const corsOptions = {
    origin: ["http://localhost:3000"],
    credentials: true, //included credentials as true
    exposedHeaders: ["set-cookie"],
};


// router
router.post('/api/register', cors(corsOptions), AuthController.postRegister);
router.post('/api/login', cors(corsOptions), AuthController.postLogin);
router.get('/api/user', cors(corsOptions), AuthController.getCurrentUser);
router.get('/api/logout', cors(corsOptions), AuthController.getLogout);

module.exports = router;