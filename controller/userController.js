const HttpError = require("../model/errorModel");
const upload = require("../middleware/uploadMiddleware")
const multer = require("multer")
const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateUserInput } = require("../model/userJoiModel");
const fs = require("fs")
const path = require("path")
const { v4: uuid } = require("uuid");
const { sendVerificationEmail } = require("../utils/emailService");

// const verifyEmail = async (req, res, next) => {
//   const { token } = req.query;
//   if (!token) {
//     return next(new HttpError("No token provided", 400));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);
    
//     if (!user) {
//       return next(new HttpError("Invalid token", 400));
//     }

//     // Update user's email verification status
//     user.isVerified = true;
//     await user.save();

//     // If FRONTEND_URL is configured, redirect the user to the frontend verification/success page.
//     // This avoids hard-coded localhost links in the static HTML and works when frontend is hosted elsewhere.
//     if (process.env.FRONTEND_URL) {
//       // Example: https://app.example.com/verified or /login with a query flag
//       const redirectTo = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/verified?verified=true`;
//       return res.redirect(redirectTo);
//     }

//     // Fallback for local/dev when FRONTEND_URL is not set: serve the static verified page
//     return res.sendFile(path.join(__dirname, "../public/verified.html"));

//   } catch (error) {
//     return next(new HttpError("Failed to verify email", 400));
//   }
// };
// userController.js - MODIFIED CODE for verifyEmail

const verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return next(new HttpError("No token provided", 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new HttpError("Invalid token", 400));
    }

    // Update user's email verification status
    user.isVerified = true;
    await user.save();
    
    // --- DYNAMIC REDIRECTION LOGIC START ---
    
    // 1. Determine the Base URL to use for the response
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // 2. If FRONTEND_URL is set (production/staging), redirect the browser to the login page.
    if (process.env.FRONTEND_URL) {
      // Redirect to the frontend login page with a success flag
      const redirectTo = `${frontendBaseUrl.replace(/\/$/, '')}/login?verified=true`;
      return res.redirect(redirectTo);
    }

    // 3. Fallback for local development (FRONTEND_URL is not set): Serve the templated static HTML
    const htmlPath = path.join(__dirname, '..', 'public', 'verified.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Dynamically replace the FRONTEND_URL placeholder in the static file
    htmlContent = htmlContent.replace(/<%= FRONTEND_URL %>/g, frontendBaseUrl);

    // Serve the modified HTML
    return res.send(htmlContent);

  } catch (error) {
    // Handle JWT errors or database errors
    return next(new HttpError("Verification failed or link expired", 400));
  }
};
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword,bio } = req.body;

    // Validate the input using Joi
    const { error } = validateUserInput({ name, email, password, confirmPassword });
    if (error) {
      return next(new HttpError(error.details[0].message, 422));
    }

    const newEmail = email.toLowerCase();

    // Check if the email already exists in the database
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email already exists", 422));
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user but set the "isVerified" flag to false
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
      bio,
      isVerified: false, // Email verification status
    });

    // Generate a verification token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    

    // Send verification email
    await sendVerificationEmail(newUser.email, token, newUser.name);

    setTimeout(async () => {
      const user = await User.findById(newUser._id);
      if (user && !user.isVerified) {
        await User.findByIdAndDelete(newUser._id);
        console.log(`Unverified user with ID ${newUser._id} has been deleted.`);
      }
    }, 900000); // 1 hour = 3600000 ms

    
    res.status(201).json({ message: `New user ${newUser.name} registered. Please verify your email!`, user: newUser });
  } catch (error) {
    console.error("Error during registration:", error); // Log the error for debugging
    return next(new HttpError("User not registered due to an error", 500));
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all fields", 422));
    }

    const newEmail = email.toLowerCase();
    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("Email not found", 422));
    }

    if (!user.isVerified) {
      return next(new HttpError("Please verify your email first", 403)); // Error if email is not verified
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Wrong password!", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id,email, name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({ token, id,email, name });
  } catch (error) {
    return next(new HttpError("An error occurred, cannot login", 500));
  }
};

const getAuthors = async(req, res, next) => {
  try {
    const auhtors = await User.find().select("-password");
  res.status(200).json(auhtors)
  } catch (error) {
    return next(new HttpError("facing an issue in fetching authors",404))
  }
};
const getUser = async(req, res, next) => {
 try {
     const {id} = req.params;
     const user = await User.findById(id).select("-password");
     if(!user){
        return next(new HttpError("User not found",404))
     }
     res.status(200).json(user);
 } catch (error) {
    return next(new HttpError("Error in finding User",422))
 }
};

const changeAvatar = async (req, res, next) => {
  const { avatarURL } = req.body;
  console.log(req.body);
  const userId = req.user.id; // assuming userId is coming from JWT

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.avatar = avatarURL; // Save Firebase URL
    await user.save();
    res.json({ avatar: avatarURL });
  } catch (error) {
    res.status(500).json({ message: "Error updating avatar" });
  }

};

const editUser = async(req, res, next) => {
  try {
    const {name , email , currentPassword , newPassword ,bio }= req.body;
    if(!name  || !email || !currentPassword || !newPassword || !bio ){
        return next(new HttpError("fill in all fields",422))
    }
    const user = await User.findById(req.user.id);
    if(!user){
        return next(new HttpError("user does not found",404));
    }
    
    const newEmail = email.toLowerCase();
    if(newEmail!=user.email){
        return next(new HttpError("you can not change your email",422));
    }
    const validatePass = await bcrypt.compare(currentPassword,user.password)
    if(!validatePass){
        return next(new HttpError("Invalid User password",422));
    }
    
    const salt = await bcrypt.genSalt(10);
    const hassPass = await bcrypt.hash(newPassword,salt);

    
    user.name = name;
    user.password=hassPass;
    user.bio = bio || user.bio; 
    const edited = await user.save()
    
    res.status(200).json(edited)

  } catch (error) {
    console.log(error)
    return next(new HttpError("user can not be edited",500))
  }
};

module.exports = {
  registerUser,
  getAuthors,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  verifyEmail,
};
