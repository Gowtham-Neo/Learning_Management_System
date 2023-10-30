const port = 7000;
const app = require("./app");
app.listen(port, function () {
  console.log("server is running on port " + port);
});
