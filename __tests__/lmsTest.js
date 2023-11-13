const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;

function extractCsrfToken(response) {
  const $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let response = await agent.get("/signin/educator");
  let csrfToken = extractCsrfToken(response);
  response = await agent.post("/educator/login").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Learning Management System test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("educator signup", async () => {
    let res = await agent.get("/educator/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/educator/signup").send({
      firstName: "Test",
      lastName: "User",
      email: "user@test.com",
      password: "helloworld1234",
      _csrf: csrfToken,
    });
  });

  test("Sign up as Student", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/student/signup").send({
      firstName: "student",
      lastName: "1",
      email: "student1@test.com",
      password: "password1234",
      role: "Student",
      _csrf: csrfToken,
    });
  });

  test("Creates a Course", async () => {
    const agent = request.agent(server);
    await login(agent, "user@test.com", "helloworld1234");
    const res = await agent.get("/course");
    const csrfToken = extractCsrfToken(res);
    await agent.post("/course").send({
      title: "Web Development",
      userName: "Test",
      userId: 1,
      _csrf: csrfToken,
    });
  });
  test("Build Chpater", async () => {
    const agent = request.agent(server);
    await login(agent, "user@test.com", "helloworld1234");
    const res = await agent.get("/course/1/chapter");
    const csrfToken = extractCsrfToken(res);
    await agent.post("/course/1/chapter").send({
      title: "Chpater 1",
      desc: "@chpater 1",
      courseId: 1,
      _csrf: csrfToken,
    });
  });

  test("Add Pages", async () => {
    const agent = request.agent(server);
    await login(agent, "user@test.com", "helloworld1234");
    const res = await agent.get("/course/1/chapter/1/page");
    const csrfToken = extractCsrfToken(res);
    await agent.post("/course/1/chapter1/page").send({
      title: "page 1",
      content: "@page 1",
      chapterId: 1,
      iscompleted: 0,
      userId: 1,
      _csrf: csrfToken,
    });
  });
});
