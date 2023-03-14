const express = require('express');
const app = express();
const userRouter = require("./user");
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());
app.use('/', userRouter)

app.listen((3000), () => {
  console.log('server is running');
})