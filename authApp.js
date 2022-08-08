import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"; // de su dung cac bien trong .env

dotenv.config();
const app = express();
const PORT = 5000;

app.use(express.json());

let refreshTokens = [];

app.post("/refreshToken", (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) res.send("fail");

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
    console.log(err, data);
    if (err) res.sendStatus(403);
    const accessToken = jwt.sign(
      { username: data.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "60s" }
    );
    res.json({ accessToken });
  });
});

app.post("/loginApp", (req, res) => {
  const data = req.body;
  console.log({ data });
  const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "60s",
  }); // Creat New Token
  const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET);
  refreshTokens.push(refreshToken);
  res.json({ accessToken, refreshToken });
});

app.post("/logout", (req, res) => {
  const refreshToken = req.body.token;
  //   refreshTokens = refreshTokens.filter((refToken) => refToken !== refreshToken);
  refreshTokens = [];
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
