/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const { Course, Chapter, Page } = require("./models");

app.get("/", (req, res) => {
  res.render("course");
});

app.post("/course", async (req, res) => {
  try {
    const { title } = req.body;
    const course = await Course.addcourse({ title });
    res.redirect(`/courseDetails/${course.id}`);

    console.log(course.id, title);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(`/courseDetails/:id`, async (req, res) => {
  const courseId = req.params.id;

  if (!courseId) {
    return res.status(400).json({ error: "Course ID is missing" });
  }

  try {
    const course = await Course.findOne({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.render("courseDetails", { course, courseId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/course/:courseId/chapter", (req, res) => {
  const courseId = req.params.courseId;
  if (!courseId) {
    return res.status(400).json({ error: "Course ID is missing" });
  }

  res.render("chapter", { courseId });
});

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
app.get(`/course/:courseId/chapter/:chapterId`, async (req, res) => {
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

    res.render("chapterDetails", { chapter, courseId, chapterId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/course/:courseId/chapter/:chapterId/page", async (req, res) => {
  const chapterId = req.params.chapterId;
  const courseId = req.params.courseId;
  const chapters = await Chapter.findAll({ where: { courseId: courseId } });
  res.render("page", { chapterId, chapters, courseId });
});

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
app.get("/viewpage/:courseId/:chapterId/:pageId", async (req, res) => {
  const courseId = req.params.courseId;
  const chapterId = req.params.chapterId;
  const pageId = req.params.pageId;

  try {
    // Assuming you have a "Page" model and you want to find the page by its ID
    const page = await Page.findByPk(pageId);

    if (!page) {
      return res.status(404).send("Page not found");
    }

    // Get the title and content from the retrieved page
    const title = page.title;
    const content = page.content;

    res.render("viewPage", { title, content, courseId, chapterId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/display", async (req, res) => {
  try {
    const courses = await Course.findAll();
    const chapters = await Chapter.findAll();
    const pages = await Page.findAll();
    res.render("display", { courses, chapters, pages });
  } catch {
    res.redirect("/");
  }
});

app.get("/viewChapter/:courseId", async (req, res) => {
  const courseId = req.params.courseId;
  const chapters = await Chapter.findAll({
    where: { courseId: courseId },
  });

  if (!chapters) {
    res.status(404).send("Chapter not found");
  }
  res.render("viewChapter", { chapters });
});

app.get("/course/:courseId/:chapterId", async (req, res) => {
  const courseId = req.params.courseId;
  const chapterId = req.params.chapterId;

  try {
    const chapters = await Chapter.findAll({
      where: { courseId: courseId },
    });

    if (!chapters) {
      return res.status(404).send("Chapters not found for the course");
    }

    // Fetch associated pages for each chapter

    const pages = await Page.findAll({ where: { chapterId: chapterId } });

    res.render("viewChapter", { chapters, pages });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
