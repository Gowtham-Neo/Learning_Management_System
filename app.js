/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const path = require("path");
var bcrypt = require("bcrypt");
var session = require("express-session");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const passport = require("passport");
const connectEnsurelogin = require("connect-ensure-login");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-54862547158632541257",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account is not exist for this mail",
          });
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session: ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { Course, Chapter, Page, User } = require("./models");
const { rmSync } = require("fs");

const saltRounds = 10;

app.get("/login", (req, res) => {
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.render("index", {
    title: "Learning Management System",
    csrfToken: req.csrfToken(),
  });
});
app.get("/signin/educator", (req, res) => {
  res.render("educatorSignin", {
    title: "Sign In Educator",
    csrfToken: req.csrfToken(),
  });
});
app.get("/signup/educator", (req, res) => {
  res.render("educatorSignup", {
    title: "Sign UP Educator",
    csrfToken: req.csrfToken(),
  });
});

app.post("/educator/signup", async (req, res) => {
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
    req.flash("error", "The password must be atleast 8 characters long");
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
      const userRole = user.role;
      res.redirect("/home");
    });
  } catch (error) {
    req.flash("error", "Email already registered!");
    res.redirect("/signup/educator");
    console.log(error);
  }
});

app.get("/signin/student", (req, res) => {
  res.render("studentSignin", {
    title: "Sign In Student",
    csrfToken: req.csrfToken(),
  });
});
app.get("/signup/student", (req, res) => {
  res.render("studentSignup", {
    title: "Sign Up Student",
    csrfToken: req.csrfToken(),
  });
});

app.post("/student/signup", async (req, res) => {
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
    req.flash("error", "The password must be atleast 8 characters long");
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
app.post("/educatorlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      req.flash("error", "Please provide a valid email...!");
      return res.redirect("/signin/educator");
    }
    if (!password) {
      req.flash("error", "Please provide the password...!");
      return res.redirect("/signin/educator");
    }
    const user = await User.findOne({
      where: { email },
    });
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      req.flash("error", "Incorrect password. Please try again.");
      return res.redirect("/signin/educator");
    }

    req.flash("success", "Logged in successfully...!");
    return res.redirect("/home");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/signin/educator");
  }
});

app.post(
  "/educator/login",
  passport.authenticate("local", {
    failureRedirect: "/signin/educator",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.user);
    res.redirect("/home");
  },
);
app.post("/studentlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      req.flash("error", "Please provide a valid email...!");
      return res.redirect("/sign/student");
    }

    if (!password) {
      req.flash("error", "Please provide the password...!");
      return res.redirect("/sign/student");
    }

    const user = await User.findOne({
      where: { email },
    });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      req.flash("error", "Incorrect password. Please try again.");
      return res.redirect("/signin/student");
    }

    req.flash("success", "Logged in successfully...!");
    return res.redirect("/home");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/student/login");
  }
});

app.post(
  "/student/login",
  passport.authenticate("local", {
    failureRedirect: "/signin/student",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.user);
    res.redirect("/home");
  },
);
app.get("/complete/course", connectEnsurelogin.ensureLoggedIn(), (req, res) => {
  console.log(req.user);
  res.redirect("/home");
});

app.get("/home", connectEnsurelogin.ensureLoggedIn(), async (req, res) => {
  console.log(req.user.firstname);
  const userRole = req.user.role;
  const firstname = req.user.firstname;
  const lastname = req.user.lastname;
  const user = await User.findOne({ where: { id: req.user.id } });
  const courses = await Course.findAll();
  res.render("home", {
    userRole,
    firstname,
    lastname,
    user,
    courses,
    csrfToken: req.csrfToken(),
  });
});

app.get("/changePassword", connectEnsurelogin.ensureLoggedIn(), (req, res) => {
  res.render("changePassword", {
    title: "Change Password",
    csrfToken: req.csrfToken(),
  });
});

app.post(
  "/changepassword",
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const id = req.user.id;
    const user = await User.findOne({ where: id });
    const Hashed = await bcrypt.hash(req.body.newpassword, saltRounds);

    if (req.body.newpassword == req.body.retyped) {
      await user.update({ password: Hashed });
      req.flash("error", "Your password has changed");
      return res.redirect("/home");
    } else {
      req.flash("error", "Passwords do not match");
      res.redirect("/changePassword");
    }
  },
);

app.get("/signout", connectEnsurelogin.ensureLoggedIn(), (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/course", connectEnsurelogin.ensureLoggedIn(), (req, res) => {
  res.render("course", { csrfToken: req.csrfToken() });
});

app.post("/course", connectEnsurelogin.ensureLoggedIn(), async (req, res) => {
  try {
    const title = req.body.title;
    const educatorName = req.user.firstname;
    const educatorId = req.user.id;
    const course = await Course.addcourse({ title, educatorName, educatorId });
    console.log(educatorName);
    res.redirect(`/courseDetails/${course.id}`);
    console.log(educatorName);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/mycourse", connectEnsurelogin.ensureLoggedIn(), async (req, res) => {
  const courses = await Course.findAll({
    where: { educatorName: req.user.firstname },
  });
  res.render("myCourse", { courses, csrfToken: req.csrfToken() });
});

app.get(
  `/courseDetails/:id`,
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.id;
    const chapters = await Chapter.findAll({ where: { courseId: courseId } });
    const user = await User.findOne({ where: req.user.id });

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is missing" });
    }

    try {
      const course = await Course.findOne({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.render("courseDetails", {
        course,
        user,
        courseId,
        chapters,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get(
  "/course/:courseId/chapter",
  connectEnsurelogin.ensureLoggedIn(),
  (req, res) => {
    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ error: "Course ID is missing" });
    }

    res.render("chapter", { courseId, csrfToken: req.csrfToken() });
  },
);

app.post("/course/:courseId/chapter", async (req, res) => {
  try {
    const { title, desc, courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ error: "Course ID is missing" });
    }
    const chapter = await Chapter.addchapter({
      title: title,
      desc: desc,
      courseId: courseId,
    });
    console.log(courseId);

    res.redirect(`/course/${courseId}/chapter/${chapter.id}`);
    console.log(chapter.id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get(
  `/course/:courseId/chapter/:chapterId`,
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const chapterId = req.params.chapterId;
    if (!chapterId) {
      return res.status(400).json({ error: "Chapter ID is missing" });
    }
    const courseId = req.params.courseId;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is missing" });
    }
    try {
      const chapter = await Chapter.findOne({ where: { id: chapterId } });
      if (!chapter) {
        return res.status(404).json({ error: "chapter not found" });
      }
      const pages = await Page.findAll({ where: { chapterId: chapterId } });

      res.render("chapterDetails", {
        chapter,
        courseId,
        chapterId,
        pages,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get(
  "/course/:courseId/chapter/:chapterId/page",
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const chapterId = req.params.chapterId;
    const courseId = req.params.courseId;
    const chapters = await Chapter.findAll({ where: { courseId: courseId } });
    res.render("page", {
      chapterId,
      chapters,
      courseId,
      csrfToken: req.csrfToken(),
    });
  },
);

app.post("/course/:courseId/chapter/:chapterId/page", async (req, res) => {
  try {
    const { title, content, chapterId } = req.body;
    if (!chapterId) {
      return res.status(400).json({ error: "Chapter ID is missing" });
    }
    const page = await Page.addpage({
      title: title,
      content: content,
      chapterId: chapterId,
    });
    const courseId = req.params.courseId;
    const pageId = page.id;
    res.redirect(`/viewpage/${courseId}/${chapterId}/${pageId}`);

    console.log(pageId);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get(
  "/viewpage/:courseId/:chapterId/:pageId",
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    const pageId = req.params.pageId;

    try {
      const page = await Page.findByPk(pageId);

      if (!page) {
        return res.status(404).send("Page not found");
      }
      const title = page.title;
      const content = page.content;

      res.render("viewPage", {
        title,
        content,
        courseId,
        chapterId,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.get(
  "/viewChapter/:courseId",
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.courseId;
    const chapters = await Chapter.findAll({
      where: { courseId: courseId },
    });

    if (!chapters) {
      res.status(404).send("Chapter not found");
    }
    res.render("viewChapter", { chapters, csrfToken: req.csrfToken() });
  },
);

app.get(
  "/course/:courseId/:chapterId",
  connectEnsurelogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;
    try {
      const chapters = await Chapter.findAll({
        where: { courseId: courseId },
      });
      const course = await Course.findOne({
        where: { id: courseId },
      });

      if (!chapters) {
        return res.status(404).send("Chapters not found for the course");
      }
      if (!course) {
        return res.status(404).send("Course not found");
      }

      for (const chapter of chapters) {
        const pages = await Page.findAll({ where: { chapterId: chapter.id } });
        chapter.pages = pages;
      }
      res.render("courseView", {
        chapters,
        course,
        chapterId,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
);

module.exports = app;
