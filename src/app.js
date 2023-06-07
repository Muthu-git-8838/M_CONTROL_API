const express = require("express");
const app = express();
require("./db/conn");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const cors = require("cors");
const nodemailer = require("nodemailer");
const generator = require("otp-generator");
const User = require("./model/userSchema");
const http = require("http");
const socketIO = require("socket.io");
const PORT = process.env.PORT || 7007;
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});
app.get("/", async (req, res) => {
  res.send("<h3>Hello M-Control</h3>");
});

let RegisterOTP = null;
let hashedPassword = null;
app.post("/register", async (req, res) => {
  try {
    // const userName = req.body.userName;
    // const password = req.body.password;
    // let Data = {
    //   userName: req.body.userName,
    //   email: req.body.email,
    //   mobile: req.body.mobile,
    // };
    bcrypt.hash(req.body.password, 15, async (err, hashed) => {
      if (!err) {
        hashedPassword = hashed;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const OTP_R = await generator.generate(6, {
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });
        RegisterOTP = OTP_R;
        const mailOptions = {
          from: '"ELON NATIVE SYSTEMS" <elonnativesystems@gmail.com> ',
          to: req.body.email,
          subject: "WELCOME TO ELON NATIVE SYSTEMS",
          text: `Hello ${req.body.email}, The OTP for creating Your account is ${OTP_R}`,
        };
        // const currentEmail = await User.findOne({
        //   userName: req.body.userName,
        // });

        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            // console.error(error);
            res.status(500).send("Error sending email");
          } else {
            // console.log("Email sent: " + info.response);
            res.status(200).send("Email sent successfully");
          }
        });
        // Data = { ...Data, password: hashedPassword };
        // const user = new User(Data);
        // await user
        //   .save()
        //   .then(() => {
        //     res.status(201).send({
        //       message: "Registeration Successfull",
        //     });
        //   })
        //   .catch((e) => {
        //     res.status(500).send(e);
        //   });
      }
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/verify-register", async (req, res) => {
  try {
    if (RegisterOTP == req.body.otp) {
      let Data = {
        userName: req.body.userName,
        email: req.body.email,
        mobile: req.body.mobile,
        password: hashedPassword,
      };
      const user = new User(Data);
      await user
        .save()
        .then(() => {
          res.status(201).send({
            message: "Registeration Successfull",
          });
        })
        .catch((e) => {
          res.status(500).send(e);
        });
    } else res.status(401).send({ error_message: "Something went wrong" });
  } catch (e) {
    res.status(500).send(e);
  }
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

let generatedOtp = null;
let currentUser = null;
app.post("/forget-password", async (req, res) => {
  try {
    const currentEmail = await User.findOne({ userName: req.body.userName });
    currentUser = await currentEmail;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const OTP = await generator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    generatedOtp = OTP;

    const mailOptions = {
      from: '"ELON NATIVE SYSTEMS" <noreply@elonnativesystems.com> ',
      to: currentEmail.email,
      subject: "PassWord Recovery",
      text: `Hello ${currentEmail.email}, The OTP for changing You password is ${OTP}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        // console.error(error);
        res.status(500).send("Error sending email");
      } else {
        // console.log("Email sent: " + info.response);
        res.send("Email sent successfully" + info.response);
      }
    });
  } catch (e) {
    res.status(500).send("Something went wrong");
  }
});

app.post("/verify-otp", async (req, res) => {
  const userOTP = req.body.otp;
  try {
    if (userOTP == generatedOtp) {
      // OTP is correct
      // res.send("OTP verified successfully");
      bcrypt.hash(req.body.password, 15, async (err, hashed) => {
        if (!err) {
          currentUser.password = hashed;
          await currentUser
            .save()
            .then(() => {
              res.send({ message: "OTP VERIFIED AND PASSWORD CHANGED" });
            })
            .catch(() => {
              res.send({ error_message: "FAILED TO VERIFY" });
            });
        } else res.status(500).send({ error_message: "Something went wrong" });
      });
    } else {
      // OTP is incorrect
      res.status(400).send("Invalid OTP");
    }
  } catch (e) {
    res.send("Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});

//Socket.io Code

io.on("connection", (socket) => {
  console.log("Socket is active");

  socket.on("chat", (data) => {
    console.log("The payload data is:", data);
    io.emit("chat", data);
  });
});

server.listen(7007, () => {
  console.log("Server is active on http://localhost:7007 ....");
});
