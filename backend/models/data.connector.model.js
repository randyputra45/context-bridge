const mongoose = require("mongoose");

const dataConnectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    config: {
      type: Object,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DataConnector", dataConnectorSchema);
