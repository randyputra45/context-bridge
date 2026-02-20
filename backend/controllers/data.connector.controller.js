const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const DataConnectorModel = require("../models/data.connector.model");

class DataConnectorController {
  static async postNewDataConnector(req, res) {
    try {
      const newDataConnector = new DataConnectorModel(req.body);
      const saved = await newDataConnector.save();
      res.status(201).json({
        message: "New data connector added",
        context: saved,
      });
      res.status(201).send(saved);
    } catch (error) {
      console.log(error)
      res.status(500).send({ err: error });
    }
  }

  // check this
  static async getAllDataConnector(req, res) {
      try {
        const connectorList = await DataConnectorModel.find();
        res.status(200).send(connectorList);
      } catch (error) {
        console.error("Error fetching data connectors:", error);
        res.status(500).send({ err: error.message });
      }
    }

  static async getDataConnectorByID(req, res) {
    try {
      const id = req.params.id;
      const webinarList = await DataConnectorModel.findOne({
        _id: id,
      })
      res.status(200).send(webinarList);
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }

  static async updateDataConnector(req, res) {
      try {
      const id = req.params.id;
      const body = req.body;

      // Filter out undefined or empty values
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.type !== undefined) updateData.type = body.type;
      if (body.info !== undefined) updateData.info = body.info;

      const updatedContext = await DataConnectorModel.findByIdAndUpdate(
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

  static async deleteDataConnector(req, res) {
    try {
      const id = req.params.id;
      await DataConnectorModel.deleteOne({ _id: id });
      res.status(200).send({ message: `${id} has been deleted` });
    } catch (error) {
      res.status(500).send({ err: error });
    }
  }
}

module.exports = DataConnectorController;
