const UserModel = require("../models/user.model");

class UserController {
  static async getAllUser(req, res) {
    try {
      const userList = await UserModel.find().populate({
        path: "roles"
      });
      res.status(200).send(userList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async getUserByID(req, res) {
    try {
      const id = req.params.id;

      const userList = await UserModel.findOne({
        _id: id,
      }).populate({
        path: "roles",
      });
      res.status(200).send(userList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async updateUser(req, res) {
    try {
      const id = req.params.id;
      const body = req.body;

      // Filter out undefined or empty values
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.roles !== undefined) updateData.roles = body.roles;

      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true } // return updated user
      );

      if (!updatedUser) {
        return res.status(404).send({ message: "User not found" });
      }

      res.status(200).send(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send({ err: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const id = req.params.id;
      await UserModel.deleteOne({ _id: id });
      res
        .status(200)
        .send({ message: `${id} has been deleted` });
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }
}

module.exports = UserController;
