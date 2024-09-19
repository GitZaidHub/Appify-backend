const {Router} = require("express")
const router = Router()
const authMiddleware = require("../middleware/authMiddleware")
const {registerUser,getAuthors,loginUser,getUser,changeAvatar,editUser,verifyEmail} = require("../controller/userController")


router.post("/register",registerUser)
router.post("/login",loginUser)
router.get('/',getAuthors)
router.get("/verify-email", verifyEmail);
router.get("/:id",getUser)
router.post("/change-avatar",authMiddleware,changeAvatar)
router.patch("/edit-user",authMiddleware,editUser)


module.exports= router