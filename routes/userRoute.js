const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models");

const saltRounds = 10;

router.post("/educator/signup", async (req, res) => {
  const Hashed = await bcrypt.hash(req.body.password, saltRounds);
  if (req.body.firstname == "") {
    req.flash("error", "First name is Empty!");
    return res.redirect("/signup/educator");
  }
  if (req.body.email == "") {
    req.flash("error", "Email is Empty!");
    return res.redirect("/signup/educator");
  }
  if (req.body.password == "" || req.body.password.length < 8) {
    req.flash("error", "The password must be at least 8 characters long");
    return res.redirect("/signup/educator");
  }

  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: Hashed,
      role: "Educator",
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/home");
    });
  } catch (error) {
    req.flash("error", "Email already registered!");
    res.redirect("/signup/educator");
    console.log(error);
  }
});

router.post("/student/signup", async (req, res) => {
  const Hashed = await bcrypt.hash(req.body.password, saltRounds);
  if (req.body.firstname == "") {
    req.flash("error", "First name is Empty!");
    return res.redirect("/signup/student");
  }
  if (req.body.email == "") {
    req.flash("error", "Email is Empty!");
    return res.redirect("/signup/student");
  }
  if (req.body.password == "" || req.body.password.length < 8) {
    req.flash("error", "The password must be at least 8 characters long");
    return res.redirect("/signup/student");
  }

  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: Hashed,
      role: "Student",
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/home");
    });
  } catch (error) {
    req.flash("error", "Email already registered");
    res.redirect("/signup/student");
    console.log(error);
  }
});

module.exports = router;
