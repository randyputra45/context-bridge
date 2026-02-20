const axios = require("axios");
const UserModel = require("../models/user.model");

class QueryController {  
  static async postQuery(req, res) {
    let model_payload = {}; // declare before try

    try {
        const { id, query } = req.body;

      const user = await UserModel.findById(id)
        .populate({
          path: "roles",
          populate: {
            path: "data_connector",
            model: "DataConnector"
          }
        });
      
        const user2 = await UserModel.findById(id).populate("roles")

        console.log("user", user2)

        // Collect all data_connectors from all roles
        const data_connectors = user.roles.flatMap(role => role.data_connector);

        // Remove _id and __v from each connector
        const clean_connectors = data_connectors.map(connector => {
          const { _id, __v, ...rest } = connector.toObject ? connector.toObject() : connector;
          return rest;
        });

        // Extract role names
        const profile = user.roles.map(role => role.name);

        model_payload = {
            connectors: clean_connectors,
            query,
            profile,
        };

        console.log("user.roles", user.roles)
        console.log("data_connectors", clean_connectors)
        // res.status(200).send(model_payload);

        // Call the model API
        const llm_response = await axios.post(
            `${process.env.MODEL_URL}/query`,
            model_payload
        );
        res.status(200).send(llm_response.data);
    } catch (error) {
        console.log(error)
        res.status(500).send({model_payload});
    }
  }

  static async getTraces(req, res) {
    try {
      // Call the model API
      const response = await axios.get(
        `${process.env.MODEL_URL}/traces`
      );

      res.status(200).send(response.data);
    } catch (error) {
      console.error("Error fetching traces:", error.message);
      res.status(500).send({ err: error.message });
    }
  }
}

module.exports = QueryController;
