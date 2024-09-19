const Joi = require('joi');

// Joi Schema for validating user input
const userValidationSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters',
        'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Confirm Password is required'
    }),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(250).optional().messages({
        'string.max': 'Bio cannot be more than 250 characters'
    }), // Adding bio field
    posts: Joi.number().optional()
});

// Function to validate user input using Joi
const validateUserInput = (data) => {
    return userValidationSchema.validate(data, { abortEarly: false });
};

module.exports = { validateUserInput };
