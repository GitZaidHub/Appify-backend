const fs = require("fs")
const Post = require("../model/postModel")
const User = require("../model/userModel")
const path = require("path")
const multer = require("multer")
const HttpError = require("../model/errorModel")
const {v4:uuid} = require("uuid")
const upload = require("../middleware/uploadMiddleware")
const { post } = require("../routes/userRoutes")


// Route to handle post creation with image upload

const createPost = async (req, res, next) => {
    try {
        const { title, category, description } = req.body;

        // Validate required fields
        if (!title || !category || !description) {
            return next(new HttpError("Please fill all fields", 422));
        }
        if(description.length < 150){
            return next(new HttpError("description is too short make it atleast 150words",422))
        }

        // Check if files were uploaded
        if (!req.files || !req.files.thumbnail) {
            return next(new HttpError("Please upload 1 or 2 images for the post", 422));
        }

        // Handling single or multiple image uploads
        let thumbnail = [];
        if (Array.isArray(req.files.thumbnail)) {
            thumbnail = req.files.thumbnail.map(file => file.filename); // Multiple images
        } else {
            thumbnail = [req.files.thumbnail.filename]; // Single image
        }

        // Create the new post
        const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail,
            creator: req.user.id
        });

        if (!newPost) {
            return next(new HttpError("Unable to create post", 422));
        }

        // Update user's post count
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return next(new HttpError("User not found", 404));
        }

        currentUser.posts += 1; // Assuming `posts` is a number representing post count
        await currentUser.save();

        // Return success response
        res.status(201).json({
            message: "Post has been created",
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error); // Log the full error
        return next(new HttpError("There was a problem creating the post", 422));
    }
};


 
const getPost = async(req,res,next)=>{
    try {
        const postID = req.params.id;
        const post = await Post.findById(postID);
        if(!post){
            return next(new HttpError("no post found",422));
        }
        res.status(201).json(post)
    } catch (error) {
        return  next(new HttpError("unable to find post",422))
    }
}

const getPosts= async(req,res,next) =>{
   try {
    const posts = await Post.find().sort({createdAt:-1})
   res.status(201).json(posts)
   } catch (error) {
    return next(new HttpError("can not fetch posts",422))
   }
}

const getCatPosts = async(req,res,next)=>{
    try {
        const {category} =  req.params;
        const catpost = await Post.find({category}).sort({createdAt:-1});
        res.status(201).json(catpost);
    } catch (error) {
        return next(new HttpError(error))
    }
}

const getUserPost = async(req,res,next)=>{
    try {
        const {id} = req.params;
    const post = await Post.find({creator:id}).sort({createdAt:-1})
    res.status(201).json(post)
    } catch (error) {
        return next(new HttpError("can not get post"))
    }
}


const editPost = async (req, res, next) => {
    try {
        const postID = req.params.id;
        const { title, description, category } = req.body;

        // Validate input fields
        if (!title || !description  || !category) {
            return next(new HttpError("Fill in all fields ", 422));
        }
        if(description.length<145){
            return next(new HttpError(" minimum length of description is 145",422))
        }

        // Fetch the post to be edited
        const oldpost = await Post.findById(postID);
        if (!oldpost) {
            return next(new HttpError("Post not found", 422));
        }

        // Check if the current user is the creator of the post
        if (oldpost.creator.toString() !== req.user.id) {
            return next(new HttpError("You are not authorized to edit this post", 403));
        }

        // Update the post fields
        oldpost.title = title;
        oldpost.description = description;
        oldpost.category = category;

        // Handle new thumbnail images if uploaded
        if (req.files && req.files.thumbnail) {
            // Delete old images
            if (Array.isArray(oldpost.thumbnail)) {
                oldpost.thumbnail.forEach(image => {
                    const imagePath = path.join(__dirname, '..', 'uploads', image);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });
            } else {
                const imagePath = path.join(__dirname, '..', 'uploads', oldpost.thumbnail);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Update with new thumbnails
            if (req.files.thumbnail.length === 1) {
                oldpost.thumbnail = req.files.thumbnail[0].filename; // Single image
            } else {
                oldpost.thumbnail = req.files.thumbnail.map(file => file.filename); // Multiple images
            }
        }

        // Save the updated post
        const updatedPost = await oldpost.save();

        // Send success response
        res.status(201).json({
            message: "Post has been edited successfully",
            post: updatedPost
        });

    } catch (error) {
        return next(new HttpError("Error in editing post", 500));
    }
};


const deletePost = async (req, res, next) => {
    try {
        const postID = req.params.id;

        // Find the post by ID
        const post = await Post.findById(postID);
        if (!post) {
            return next(new HttpError("Post not found", 404));
        }

        // Check if the current user is the creator of the post
        if (post.creator.toString() !== req.user.id) {
            return next(new HttpError("You are not authorized to delete this post", 403));
        }

        // Handle deleting thumbnails (single or multiple)
        const thumbnail = post.thumbnail;
        if (Array.isArray(thumbnail)) {
            thumbnail.forEach(fileName => {
                const filePath = path.join(__dirname, "..", "uploads", fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Synchronous deletion
                }
            });
        } else {
            const filePath = path.join(__dirname, "..", "uploads", thumbnail);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Synchronous deletion
            }
        }

        // Delete the post from the database
        await Post.findByIdAndDelete(postID);

        // Update the user's post count
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return next(new HttpError("User not found", 404));
        }

        currentUser.posts = Math.max(currentUser.posts - 1, 0); // Prevent negative post count
        await currentUser.save();

        // Return a success response
        res.status(200).json({ message: `Post ${postID} has been deleted successfully` });
    } catch (error) {
        return next(new HttpError("Cannot delete post", 500));
    }
};


module.exports = {createPost , getPost, getPosts,getCatPosts,getUserPost,editPost,deletePost}