const { Router } = require("express");
const router = Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createPost,
  getPost,
  getPosts,
  getCatPosts,
  getUserPost,
  editPost,
  deletePost,
} = require("../controller/postController");

router.post("/create", authMiddleware, upload, createPost);
router.get("/:id", getPost), router.get("/", getPosts);
router.get("/category/:category", getCatPosts),
  router.get("/users/:id", getUserPost);
router.patch("/:id/edit", authMiddleware, upload, editPost);
router.delete("/:id/delete", authMiddleware, deletePost);
module.exports = router;
