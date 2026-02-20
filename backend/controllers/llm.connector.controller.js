const LlmConnectorModel = require("../models/llm.connector.model");

class LlmConnectorController {
  static async postNewLlmConnector(req, res) {
    try {
      const newLlmConnector = new LlmConnectorModel(req.body);
      const saved = await newLlmConnector.save();
      res.status(201).json({
        message: "New llm connector added",
        context: saved,
      });
      res.status(201).send(saved);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async getAllLlmConnector(req, res) {
    try {
      const webinarList = await LlmConnectorModel.find()
      res.status(200).send(webinarList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async getLlmConnectorByID(req, res) {
    try {
      const id = req.params.id;
      const webinarList = await LlmConnectorModel.findOne({
        _id: id,
      })
      res.status(200).send(webinarList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async updateLlmConnector(req, res) {
    try {
        const id = req.params.id;
        const body = req.body;
  
        // Filter out undefined or empty values
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.info !== undefined) updateData.info = body.info;
  
        const updatedContext = await LlmConnectorModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // return updated user
        );
  
        if (!updatedContext) {
            return res.status(404).send({ message: "Data connector not found" });
        }
  
        res.status(200).send(updatedContext);
        } catch (error) {
        console.error("Error updating context:", error);
        res.status(500).send({ err: error.message });
        }
    }
  
  static async deleteLlmConnector(req, res) {
    try {
      const id = req.params.id;
      await LlmConnectorModel.deleteOne({ _id: id });
      res.status(200).send({ message: `${id} has been deleted` });
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }
}

module.exports = LlmConnectorController;
