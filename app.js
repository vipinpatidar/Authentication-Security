//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const { request } = require("http");

///////////////////////////////////////////////////////////////

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
//////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

// Mongoose Schema support for encrypted connection
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Secret Key or Secret string for encrytion connection ... we can put two keys too READ THE DOCUMENTATION of mongoose encrytion pakage

// const secret = "Thisismysecretdonottellanyone"; SHIT IN TO THE .env file

// console.log(process.env.API_KEY);

// Adding mongoose plugin for encrypted connection

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
}); // or excludeFromEncryption: ["password"]

const userModel = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.listen("8000", () => {
  console.log("listening on port 8000");
});

//creating a route to catch the user registering data so they can access to secrets file

app.post("/register", (req, res) => {
  const newUser = new userModel({
    email: req.body.username,
    password: req.body.password,
  });

  newUser.save((err) => {
    if (err) {
      res.send(err);
    } else {
      res.render("secrets"); // so secrets file is render only if user register successfully
    }
  });
});

//creating a route to catch the user login data so the can access to secrets file

app.post("/login", (req, res) => {
  const userName = req.body.username;
  const passWord = req.body.password;

  userModel.findOne({ email: userName }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === passWord) {
          //   console.log(foundUser.password); // by this any one can see passwards

          res.render("secrets");
        }
      }
    }
  });
});
