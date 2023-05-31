const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
require("./db/conn");

const User = require("./model/userSchema");
const PORT = process.env.PORT || 7007;

app.use(express.json());
app.get("/", async (req, res) => {
  res.send("<h3>Hello M-Control</h3>");
});

app.post("/register", async (req, res) => {
  try {
    const userName = req.body.userName;
    const password = req.body.password;
    bcrypt.hash(password, 15, async (err, hashed) => {
      if (!err) {
        const hashedPassword = hashed;
        const Data = {
          userName: userName,
          password: hashedPassword,
        };
        const user = new User(Data);
        const userData = await user.save();
        res.status(201).send("Registration Successfull");
      }
    });
  } catch (e) {}
});

app.post("/login", async (req, res) => {
  try {
    const userName = req.body.userName;
    const password = req.body.password;

    const userData = await User.findOne({ userName: userName });
    // res.send(userData);
    if (!userData) return res.status(404).send({ error: "User NOT Found" });
    bcrypt.compare(password, userData.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ data: userData }, process.env.SECRET, {
          expiresIn: 60 * 60 * 1,
        });
        res.status(201).send({ accesToken: token });
      } else
        return res
          .status(403)
          .send({ error: "Unauthorized Login or Invalid Password" });
    });
  } catch (e) {
    res.send(e);
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) res.status(401).send({ error: "AccessToken Needed" });
  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err)
      return res.status(403).send({ error: "Invalid or Expired AccessToken " });
    req.user = user;
    next();
  });
};

app.get("/user", verifyToken, async (req, res) => {
  const user = req.user;
  res.status(200).send(user);
});

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});
