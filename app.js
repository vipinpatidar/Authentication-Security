//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
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
  // Store hash in your password DB.
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new userModel({
      email: req.body.username,
      password: hash,
    });

    newUser.save((err) => {
      if (err) {
        res.send(err);
      } else {
        res.render("secrets"); // so secrets file is render only if user register successfully
      }
    });
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
        // if (foundUser.password === passWord) {  // passWord is veriable and pasword is database keyword

        // Load hash from your password DB. login
        bcrypt.compare(passWord, foundUser.password, function (err, result) {
          if (result === true) {
            res.render("secrets");
          }
          // result == true
        });
        //   console.log(foundUser.password); // by this any one can not see passwards in encrypted mode

        // }
      }
    }
  });
});
