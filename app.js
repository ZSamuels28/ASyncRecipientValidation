const recipvalidate = require("./scripts/recipvalidate")
const checkemail = require("./scripts/checkemail")
const csv = require("fast-csv");
const fs = require("fs");

const { exit } = require("process");
const { extname } = require("path");
const myArgs = process.argv.slice(2);

let GoodEmailList = [];
let BadEmailList = [];
let BadEmailCount = 0;
let GoodEmailCount = 0;

if (
  myArgs[0] == "-i" &&
  myArgs[1] != null &&
  myArgs[2] == "-o" &&
  myArgs[3] != null
) {
  if (extname(myArgs[1]).toLowerCase() == ".csv" && extname(myArgs[3]).toLowerCase() == ".csv") {
    fs.createReadStream(myArgs[1])
      .pipe(csv.parse({ headers: false }))
      .on("data", (row) => {
        if (checkemail.validateEmail(row) == true) {
          GoodEmailList.push(row);
          GoodEmailCount++;
        } else {
          BadEmailList.push({ error_row: row });
          BadEmailCount++;
        }
      })
      .on("end", () => {
        console.log(
          GoodEmailCount +
            " Valid Emails\n" +
            BadEmailCount +
            " Invalid Emails\n...Validating...\n"
        );
        recipvalidate.getRecipientValidation(
          GoodEmailList,
          BadEmailList,
          BadEmailCount,
          GoodEmailCount
        );
      });
  } else {
    console.log(
      "\x1b[31mInvalid input or output file. Please ensure these files are in .csv format"
    );
  }
} else if (myArgs[0] == "-h") {
  console.log(
    "\x1b[31mThe following is how to use this app.\n\nPlease provide the following arguments:\n\nnode ./app.js -i infile.csv -o outfile.csv"
  );
  exit(0);
} else {
  console.log(
    "\x1b[31mPlease provide the following arguments:\n\nnode ./app.js -i infile.csv -o outfile.csv"
  );
  exit(0);
}
