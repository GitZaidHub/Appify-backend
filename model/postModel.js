const {Schema , model} = require("mongoose")

const PostSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        enum: {
            values: ["Agriculture", "Business", "Education", "Entertainment", "Art", "Investment", "Uncategorized", "Weather","Politics",
    "Technology",
    "Health",
    "Science",],
            message: "{VALUE} is not supported" 
        }
    },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
    thumbnail: [{ type: String, required: true }],
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }] // Add this line
}, { timestamps: true });


module.exports = model("Post", PostSchema);
