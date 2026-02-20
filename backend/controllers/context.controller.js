const ContextModel = require("../models/context.model");

class ContextController {
  static async postNewContext(req, res) {
    try {
      const newContext = new ContextModel(req.body);
      const saved = await newContext.save();
      res.status(201).json({
        message: "New context added",
        context: saved,
      });
      res.status(201).send(saved);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async getAllContext(req, res) {
    try {
      const allContext = await ContextModel.find().populate({
        path: "data_connector",
      })
      console.log("allContext: ", allContext)
      res.status(200).send(allContext);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async getContextByID(req, res) {
    try {
      const id = req.params.id;
      const webinarList = await ContextModel.findOne({
        _id: id,
      }).populate({
        path: "data_connector",
      })
      res.status(200).send(webinarList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

    static async updateContext(req, res) {
        try {
        const id = req.params.id;
        const body = req.body;

        // Filter out undefined or empty values
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.data_connector !== undefined) updateData.data_connector = body.data_connector;

        const updatedContext = await ContextModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // return updated user
        );

        if (!updatedContext) {
            return res.status(404).send({ message: "Context not found" });
        }

        res.status(200).send(updatedContext);
        } catch (error) {
        console.error("Error updating context:", error);
        res.status(500).send({ err: error.message });
        }
    }

  static async deleteContext(req, res) {
    try {
      const id = req.params.id;
      await ContextModel.deleteOne({ _id: id });
      res.status(200).send({ message: `${id} has been deleted` });
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }
}

module.exports = ContextController;
