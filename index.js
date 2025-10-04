let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");
let app = express();
let dbcon = require("./database");
let ticApp = require("./ticketapi");
let path = require("path");
let UserApp = require("./userapi");
let ImageApp = require("./imageapi");
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/image-uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
app.use("/ticapi", ticApp);
app.use("/usapi", UserApp);
app.use("/imageapi", ImageApp);
