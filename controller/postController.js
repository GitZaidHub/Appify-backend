const fs = require("fs");
const Post = require("../model/postModel");
const User = require("../model/userModel");
const path = require("path");
const multer = require("multer");
const HttpError = require("../model/errorModel");
const { v4: uuid } = require("uuid");
const upload = require("../middleware/uploadMiddleware");
const { post } = require("../routes/userRoutes");

// Route to handle post creation with image upload

const createPost = async (req, res, next) => {
  try {
    const { title, category, description, thumbnails } = req.body;

    console.log("Request Body:", req.body);

    // Validate required fields
    if (!title || !category || !description) {
      return next(new HttpError("Please fill all fields", 422));
    }
    if (description.length < 150) {
      return next(
        new HttpError(
          "Description is too short, make it at least 150 characters",
          422
        )
      );
    }

    // Validate thumbnails array
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
      return next(
        new HttpError("Please upload at least one thumbnail for the post", 422)
      );
    }

    // Create the new post with the provided thumbnails
    const newPost = await Post.create({
      title,
      category,
      description,
      thumbnail: thumbnails, // Directly use the thumbnails array
      creator: req.user.id,
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
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return next(new HttpError("There was a problem creating the post", 500));
  }
};

const getPost = async (req, res, next) => {
  try {
    const postID = req.params.id;
    const post = await Post.findById(postID);
    if (!post) {
      return next(new HttpError("no post found", 422));
    }
    res.status(201).json(post);
  } catch (error) {
    return next(new HttpError("unable to find post", 422));
  }
};

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (error) {
    return next(new HttpError("can not fetch posts", 422));
  }
};

const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catpost = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(201).json(catpost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(201).json(post);
  } catch (error) {
    return next(new HttpError("can not get post"));
  }
};

const editPost = async (req, res, next) => {
  try {
    const postID = req.params.id;
    const { title, description, category,thumbnails } = req.body;

    // Validate input fields
    if (!title || !description || !category) {
      return next(new HttpError("Fill in all fields", 422));
    }
    if (description.length < 145) {
      return next(new HttpError("Minimum length of description is 145", 422));
    }

    // Fetch the post to be edited
    const oldpost = await Post.findById(postID);
    if (!oldpost) {
      return next(new HttpError("Post not found", 422));
    }

    // Check if the current user is the creator of the post
    if (oldpost.creator.toString() !== req.user.id) {
      return next(
        new HttpError("You are not authorized to edit this post", 403)
      );
    }

    // Update the post fields
    oldpost.title = title;
    oldpost.description = description;
    oldpost.category = category;
    oldpost.thumbnail = thumbnails;

    // Handle new thumbnail images if uploaded

    if (req.files && req.files.thumbnail) {
        // Delete old images (if any)
        if (oldpost.thumbnail && Array.isArray(oldpost.thumbnail)) {
          oldpost.thumbnail.forEach(image => {
            const imagePath = path.join(__dirname, '..', 'uploads', image);
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
              } catch (err) {
                console.error("Failed to delete old thumbnail:", err);
              }
            }
          });
        }
      
        // Upload new thumbnails to Firebase and get URLs
        const thumbnails = Array.isArray(req.files.thumbnail)
          ? await Promise.all(req.files.thumbnail.map(file => uploadToFirebase(file)))
          : [await uploadToFirebase(req.files.thumbnail)];
      
        // Update post with Firebase URLs
        oldpost.thumbnail = thumbnails;
      }
      
    // Save the updated post
    await oldpost.save();

    // Save the updated post
    const updatedPost = await oldpost.save();

    // Log for debugging
    console.log("Updated Post:", updatedPost);

    // Send success response
    res.status(201).json({
      message: "Post has been edited successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error editing post:", error);
    return next(new HttpError("Error in editing post", 500));
  }
};

/*const likes =  async (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    // Find the post by ID
    const post = await Post.findById(postId);
    
    // Check if the user has already liked the post
    if (post.likedBy.includes(userId)) {
      return res.status(400).json({ message: "You have already liked this post." });
    }

    // Add the user ID to the likedBy array
    post.likedBy.push(userId);
    post.likes += 1; // Increment the likes count

    // Save the updated post
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error updating likes." });
  }
};*/
/*const toggleLike = async (req, res) => {
    const postId = req.params.id; // Post ID
    const userId = req.body.userId; // User ID
  
    try {
      // Find the post by ID
      const post = await Post.findById(postId);
  
      if (!post) {
        return res.status(404).json({ message: "Post not found." });
      }
  
      // Check if the user has already liked the post
      const hasLiked = post.likedBy.includes(userId);
  
      if (hasLiked) {
        // If liked, remove the like
        post.likedBy = post.likedBy.filter((id) => id !== userId);
        post.likes = Math.max(post.likes - 1, 0); // Ensure likes do not go below 0
      } else {
        // If not liked, add the like
        post.likedBy.push(userId);
        post.likes += 1;
      }
  
      // Save the updated post
      await post.save();
  
      // Return the updated like count and user like status
      res.status(200).json({
        likes: post.likes,
        hasLiked: !hasLiked, // Toggle the like state
      });
    } catch (error) {
      res.status(500).json({
        message: "Error toggling like status.",
        error,
      });
    }
  };
  
  */

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
      return next(
        new HttpError("You are not authorized to delete this post", 403)
      );
    }

    // Handle deleting thumbnails (single or multiple)
    const thumbnail = post.thumbnail;
    if (Array.isArray(thumbnail)) {
      thumbnail.forEach((fileName) => {
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
    res
      .status(200)
      .json({ message: `Post ${postID} has been deleted successfully` });
  } catch (error) {
    return next(new HttpError("Cannot delete post", 500));
  }
};

module.exports = {
  createPost,
  getPost,
  getPosts,
  getCatPosts,
  getUserPost,
  editPost,
  deletePost,
};
