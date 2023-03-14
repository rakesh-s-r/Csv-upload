const express = require("express");
const router = express.Router();
const fs = require("fs");
const { parse } = require("csv-parse");
const client = require("./database");

router.get("/upload-csv", async (req, res) => {
  try {
    const list = [];
    const ageGroups = {
      20: 0,
      "20-40": 0,
      "40-60": 0,
      60: 0,
    };
    fs.createReadStream(process.env.file)
      .pipe(parse({ columns: true }))
      .on("data", function (row) {
        list.push(row);
        const age = row.age;
        if (age < 20) {
          ageGroups["20"] += 1;
        } else if (age < 40 && age > 20) {
          ageGroups["20-40"] += 1;
        } else if (age < 60 && age >= 40) {
          ageGroups["40-60"] += 1;
        } else {
          ageGroups["60"] += 1;
        }
      })
      .on("end", async function () {
        if (list.length > 5000) {
          res.status(400).send({
            message: "File not exceed 5000 records",
          });
        } else {
          await client.query("BEGIN");
          list.forEach(async (item) => {
            const { firstName, lastName, age, line1, line2, city, state } =
              item;
            const name = `${firstName} ${lastName}`;
            const addressInfo = { line1, line2, city, state };
            const moreInfo = (({
              firstName,
              lastName,
              age,
              line1,
              line2,
              city,
              state,
              ...items
            }) => items)(item);
            await client.query(
              `insert into users(name, age, address, additional_info) values ($1, $2, $3, $4) RETURNING *`,
              [name, age, addressInfo, moreInfo]
            );
          });
          await client.query("COMMIT");
          console.table({
            "Age-Group": "% Distribution",
            "< 20": ageGroups["20"],
            "20 to 40": ageGroups["20-40"],
            "40 to 60": ageGroups["40-60"],
            "> 60": ageGroups["60"],
          });
          res.send(list);
        }
      })
      .on("error", async function (error) {
        await client.query("ROLLBACK");
        res.status(400).send(error.message);
      });
  } catch (e) {
    res.status(400).send("Rows missing required fields");
  }
});

module.exports = router;
