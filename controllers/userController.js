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

module.exports = {
    registerUser
}