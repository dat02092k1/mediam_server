const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc registration for a user
// @route POST /api/users
// @access Public
// @required fields {email, username, password}
// @return User
const registerUser = asyncHandler(async (req, res) => {
    const { user } = req.body;
    console.log(user);
    if (!user || !user.email || !user.username || !user.password) {
        return res.status(400).json({message: "All fields are required"});
    }

     // hash password
     const hashedPwd = await bcrypt.hash(user.password, 10); // salt rounds

    const createdUser = await User.create({
        "username": user.username,
        "password": hashedPwd,
        "email": user.email
    });

    if (!createdUser) {
        res.status(422).json({
            errors: {
                body: "Unable to register a user"
            }
        });
    }
    else {
        res.status(201).json({
            user: createdUser.toUserResponse()
        })
    }
})

// @desc user login
// @route POST /api/users/login
// @access Public
// @required fields [email, password]
// @return User
const loginUser = asyncHandler(async (req, res) => {
    const { user } = req.body;

    if (!user || !user.email || !user.password) {
        return res.status(400).json({message: "All fields are required"});
    }

    const existedUser = await User.findOne({ email: user.email }).exec();

    if (!existedUser) {
        return res.status(404).json({message: "User Not Found"});
    }

    const pw = await bcrypt.compare(user.password, existedUser.password);

    if (!pw) {
        return res.status(401).json({ message: 'Unauthorized: Wrong password' });
    }

    res.status(200).json({
        user: existedUser.toUserResponse()
    })

}) 

// @desc update currently logged-in user
// Warning: if password or email is updated, client-side must update the token
// @route PUT /api/user
// @access Private
// @return User
const updateUser = asyncHandler(async (req, res) => {
    const { user } = req.body;

    if (!user) {
        return res.status(400).json({message: "Required a User object"});
    }

    const email = req.userEmail;

    const target = await User.findOne({ email }).exec();
 
    
})

module.exports = {
    registerUser, loginUser
}