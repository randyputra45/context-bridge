const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contextSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    data_connector: [{
      type: Schema.Types.ObjectId,
      ref: "DataConnector",
      default: []
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Context", contextSchema);
