const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const { promisify } = require('util');

class AuthController {
  static async postRegister(req, res, next) {
    // get `email, password` from req body
    // hash password
    // create a new user object
    // save to db
    const { email } = req.body
    try {
      const existingUser = await UserModel.findOne({email});
      if (existingUser) {
        return res.status(409).send({ 
          message: "Email is already in use."
        });
      }

      const user = await UserModel.create(req.body);
      return res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, email: user.email }
      });
    } catch (error) {
      next(error)
    }
  }

  static async postLogin(req, res, next) {
    // get `email, password` from req body
    // search email in db
    // if find compare the password
    // if matched user logged in
    const { email, password } = req.body;

    if(!email || !password) {
      if(!email) {
        return next(new ErrorResponse("Please provide an email", 400))
      } else {
        return next(new ErrorResponse("Please provide an password", 400))
      }
    }

    try {
      const user = await UserModel.findOne({ email }).populate("roles");
      if (!user) return next(new ErrorResponse("Incorrect Email", 401));

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return next(new ErrorResponse("Incorrect Password", 401));

      const roles = user.roles.map((role) => role.name);
      const token = user.getSignedJwtToken();

      const userData = {
        _id: user._id,
        email: user.email,
        name: user.name,
        roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        success: true,
        token,
        data: {
          user: userData,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      return next(new ErrorResponse("Account doesn't exist", 401));
    }
  }

  static async getCurrentUser(req, res, next) {
    let currentUser;
    try {
      // check if there is an jwt that stored at client cookie
      if(req.cookies.jwt){
        const token = req.cookies.jwt;
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        // @TODO
        // currentUser = await UserModel.findById(decoded.id).populate({
        //   path: "liked_blog",
        //   model: "Blog"
        // });;
        currentUser = await UserModel.findById(decoded.id)
      } else {
        currentUser = null;
      }
    } catch (error) {
      next(error);
    }
    // send logged user data
    res.status(200).send({ currentUser });
  }

  static async getLogout(req, res, next) {
    try {
      res.cookie("jwt", "loggedOut", {
        expires: new Date(Date.now() + 1 * 1000),
        httpOnly: true
      })
      res.status(200).json({
        success: true,
        message: "User is logged out"
      })
    } catch (error) {
      next(error)
    }
  }
}

const sendToken = (user, statusCode, req, res) => {
  const token = user.getSignedJwtToken();

  //set token expiry to 1 month 
  let date = new Date();
  date.setDate(date.getDate() + 30)

  // cookie settings
  try {
    res.cookie('jwt', token, {
      expires: date,
      sameSite: 'strict'
      // httpOnly: true,
    });
  } catch (error) {
    console.log("cookie error")
  }

  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  })
};

module.exports = AuthController;
