const axios = require("axios");
const axiosRetry = require("axios-retry");
const csv = require("fast-csv");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dotenv = require("dotenv");
const path = require('path')
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });
const myArgs = process.argv.slice(2);
const SPARKPOST_API_KEY = process.env.SPARKPOST_API_KEY;
const SPARKPOST_HOST = process.env.SPARKPOST_HOST;

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
  path: "logs/errors.csv",
  header: [{ id: "error_row", title: "ErrorRow" }],
});

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
          url: SPARKPOST_HOST + "/api/v1/recipient-validation/single/" + email,
          headers: {
            Authorization: SPARKPOST_API_KEY,
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

module.exports = { getRecipientValidation };