require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT || 4000;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const corOptions = require('./config/corsOptions');
const connectDb = require('./config/dbConnect');
const mongoose = require('mongoose');

connectDb();
app.use(cors(corOptions));
app.use(express.json()); 
app.use(cookieParser());

app.use('/api', require('./routes/user'));

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

mongoose.connection.on('error', err => {
    console.log(err);
})
