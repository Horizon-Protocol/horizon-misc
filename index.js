const cron = require("node-cron");
const express = require("express");

const { manageSecondaryPerps } = require('./interval');

const app = express();

cron.schedule("*/2 * * * *", function () {
  console.log("---------------------");
  manageSecondaryPerps();
  console.log("Managing secondary perps keeper every 2 minutes");
});

app.listen(2200, () => {
  console.log("application listening on port 2200.....");
});