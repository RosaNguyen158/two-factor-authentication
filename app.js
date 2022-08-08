import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"; // de su dung cac bien trong .env
import path from "path";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import bycrypt from "bcrypt";
const __dirname = path.resolve();

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const UserList = [
  {
    id: 1,
    username: "John",
    password: 123,
    email: "hongnguyenarmy@gmail.com",
    age: 18,
  },
  {
    id: 2,
    username: "John",
    email: "hongnguyenarmy@gmail.com",
    password: 123,
    age: 18,
  },
];

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "rosa.nguyen.goldenowl@gmail.com", // generated ethereal user
    pass: "pzrogwaolkqbueru", // generated ethereal password
  },
});

app.get("/app", authenToken, (req, res) => {
  res.json({ status: "Success!", data: User });
});

app.get("/login", (req, res, next) => {
  console.log(__dirname);
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", async (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  console.log("username ", username, "pass ", password, " ", req.body);

  let findUser = UserList.find(
    (user) => user.username == username && user.password == password
  );

  console.log("findUser ", findUser);
  if (!findUser) {
    res.json("Fail");
  } else {
    await sendOTPVerificationEmail(findUser.email, res);
    res.json({
      status: "Sending",
    });
  }
});

app.get("/verify", (req, res, next) => {
  res.sendFile(path.join(__dirname, "verify.html"));
});

app.post("/verify", async (req, res, next) => {
  try {
    let otp = req.body.otp;
    console.log(otp);
    console.log(UserList[0].otp);
    if (!otp) {
      res.json("FAIL");
    } else {
      let hashedOTP = `${UserList[0].otp}`;
      console.log("hashedOTP", UserList[0].otp);
      const validOTP = await bycrypt.compare(`${otp}`, hashedOTP);
      if (!validOTP) {
        res.json("FAILED VERIFY OTP");
      } else {
        let username = req.body.username;
        let password = req.body.password;
        console.log("username send to verify", username);
        UserList[0].verify = "true";
        UserList[0].otp = "";
        const accessToken = jwt.sign(
          { username, password },
          process.env.ACCESS_TOKEN_SECRET
        );
        res.json({
          message: "thanh cong",
          token: accessToken,
        });
      }
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

app.get(
  "/home",
  (req, res, next) => {
    try {
      console.log(req.cookies.token);
      let token = req.cookies.token;
      let result = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (result) {
        next();
      }
    } catch (error) {
      return res.redirect("/login");
    }
  },
  (req, res, next) => {
    res.sendFile(path.join(__dirname, "home.html"));
  }
);

app.get(
  "/product",
  (req, res, next) => {
    try {
      console.log("product ", req.cookies.token);
      console.log("product ", req.headers);
      let token = req.cookies.token;
      let result = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (result) {
        next();
      }
    } catch (error) {
      return res.redirect("/login");
    }
  },
  (req, res, next) => {
    res.sendFile(path.join(__dirname, "/product.html"));
  }
);

const sendOTPVerificationEmail = async (email, res) => {
  const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const mailOptions = {
      from: "rosa.nguyen.goldenowl@gmail.com",
      to: "hongnguyenarmy@gmail.com",
      subject: "Verify Your Email",
      html: `Enter ${otp}`,
    };

    const saltRounds = 10;
    let hashedOTP = await bycrypt.hash(otp, saltRounds);
    console.log("hashedOTP", hashedOTP);
    UserList[0].otp = hashedOTP;
    console.log(UserList[0]);
    return transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    return false;
  }
};

function authenToken(req, res, next) {
  const authorizationHeader = req.headers["authorization"];
  console.log("authorizationHeader ", authorizationHeader); // Beaer [token]
  const token = authorizationHeader.split(" ")[1]; // token
  if (!token) res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
    console.log(err, data);
    if (err) res.sendStatus(403); // loi Forbidden khong co quyen truy cap
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
