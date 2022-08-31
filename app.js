//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// don't need to require the passport-local
const { request } = require("http");

///////////////////////////////////////////////////////////////

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//setUp session
app.use(
  session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

//  passport initialization
app.use(passport.initialize());

// setup passport to manage our session
app.use(passport.session());
//////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

// Mongoose Schema support for encrypted connection
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// set up passport-local-mongoose
userSchema.plugin(passportLocalMongoose);

const userModel = new mongoose.model("User", userSchema);

// passport-local configuration

passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// creating secrets.ejs route for authenticate user
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
//  setting up logout route for logout users
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
//creating a route to catch the user registering data so they can access to secrets file

app.post("/register", (req, res) => {
  // registertion and use in passport to authenticate and save data and passward by hashing and salting

  userModel.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        // authenticate start from here
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

//creating a route to catch the user login data so the can access to secrets file

app.post("/login", (req, res) => {
  const user = new userModel({
    username: req.body.username,
    password: req.body.password,
  });
  //  login methos for chaking login details with database connection
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      //  puting authenticate
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen("8000", () => {
  console.log("listening on port 8000");
});
