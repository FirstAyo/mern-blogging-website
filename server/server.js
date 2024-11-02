import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';


//schema alone
import User from './Schema/User.js';

const server = express();

let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());

// the code below is used to test the connection of the DB from .env file

// console.log('DB_LOCATION:', process.env.DB_LOCATION);

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
});

const formareDataToSend = (user) => {
    return {
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
          
        }
        
    }

const generateUsername = async (email) => {
    let username = email.split("@")[0];

    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result => result))

    isUsernameNotUnique ? username += nanoid().substring(0, 5) : "";

    return username
}

server.post("/signup", (req, res) => {

    let { fullname, email, password } = req.body;

    //validating the data from frontend
    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Fullname nust be at least three letters long" })

    }

    if (!email.length) {
        return res.status(403).json({ "error": "Email is required" })
    }

    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Invalid email" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        
        let username = await generateUsername(email);

        let user = new User({
            personal_info: { fullname, email, password: hashed_password, username }
        })

        user.save().then((u) =>{
            return res.status(200).json(formareDataToSend(u))
        })
        .catch((err) => {

            if (err.code == 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }

            return res.status(500).json({ "error": err.message })
        })

    })

    // return res.status(200).json({ "Status": "Okay" })

})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})