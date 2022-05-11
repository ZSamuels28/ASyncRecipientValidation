async function getRecipientValidation(
  GoodEmailList,
  BadEmailList,
  BadEmailCount,
  GoodEmailCount
) {
  axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
      console.log(`retry attempt: ${retryCount}`);
      return retryCount * 20000; // time interval between retries
    },
    retryCondition: (error) => {
      // if retry condition is not specified, by default idempotent requests are retried
      return error.response.status === 503;
    },
  });

  let completed = 0;
  try {
    const promises = GoodEmailList.map(async (email) => {
      const response = await axios({
        method: "GET",
        url: BASE_URL + "/api/v1/recipient-validation/single/" + email,
        headers: {
          Authorization: API_KEY,
        },
      }).catch((error) => {
        console.log("Error " + error.response.status + " - " + error);
      });

      completed++;
      process.stdout.write(
        "Done with " + completed + " / " + GoodEmailList.length + "\r"
      );

      return {
        email: email,
        valid: response.data.results.valid,
        result: response.data.results.result,
        is_role: response.data.results.is_role,
        is_disposable: response.data.results.is_disposable,
        is_free: response.data.results.is_free,
        delivery_confidence: response.data.results.delivery_confidence,
      };
    });

    const results = await Promise.all(promises);
    csvWriter.writeRecords(results);
    if (BadEmailCount == 0) {
      console.log("All emails successfully validated.");
    } else {
      console.log(
        "Email validation completed with the following results:\n\x1b[32mEmails Successfully Validated: " +
          GoodEmailCount +
          "\n\x1b[31mEmails with Errors: " +
          BadEmailCount +
          " (See Errorlog.csv for invalid emails)"
      );
      errorWriter.writeRecords(BadEmailList);
    }
  } catch (err) {
    /**
     * If the request is rejected, then the catch method will be executed.
     */
  }
}

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(email);
}

const axios = require("axios");
const axiosRetry = require("axios-retry");
const csv = require("fast-csv");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

const dotenv = require("dotenv");
const { exit } = require("process");
dotenv.config();
const myArgs = process.argv.slice(2);
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

const csvWriter = createCsvWriter({
  path: myArgs[3],
  header: [
    { id: "email", title: "Email" },
    { id: "result", title: "Result" },
    { id: "valid", title: "Valid" },
    { id: "is_role", title: "Is_Role" },
    { id: "is_disposable", title: "Is_Disposable" },
    { id: "is_free", title: "Is_Free" },
    { id: "delivery_confidence", title: "Delivery_Confidence" },
  ],
});

const errorWriter = createCsvWriter({
  path: "ErrorLog.csv",
  header: [{ id: "error_row", title: "ErrorRow" }],
});

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
  fs.createReadStream(myArgs[1])
    .pipe(csv.parse({ headers: false }))
    .on("data", (row) => {
      if (validateEmail(row) == true) {
        GoodEmailList.push(row);
        GoodEmailCount++;
      } else {
        BadEmailList.push({ error_row: row });
        BadEmailCount++;
      }
    })
    .on("end", () => {
      console.log(GoodEmailCount + " Valid Emails to Validate\n" + BadEmailCount + " Invalid Emails\n...Validating...\n")
      getRecipientValidation(
        GoodEmailList,
        BadEmailList,
        BadEmailCount,
        GoodEmailCount
      );
    });
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
