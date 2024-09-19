const {Schema , model} = require("mongoose")

const Postschema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        enum: ["Agriculture", "bussiness", "Education", "Entertainment", "Art", "Investment", "Uncategorized", "Weather"],
        message: "{VALUE} is not supported" 
    },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
    thumbnail: [{ type: String, required: true }] // Change to array of strings for multiple images
}, { timestamps: true });

module.exports = model("Post", Postschema);
