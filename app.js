async function getRecipientValidation (emaillist) {

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

    var completed = 0
    try {
        const promises = emaillist.map(async email => {
        const response = await axios({
                method: 'GET',
                url: 'https://api.sparkpost.com/api/v1/recipient-validation/single/' + email,
                headers: {
                    'Authorization': API_KEY
                }
            })
            .catch(error =>
            {
                console.log("Error " + error.response.status + " - " + error)
            })

            completed++
            process.stdout.write("Done with " + completed + " / " + emaillist.length + "\r")

            return {
                email: email,
                valid: response.data.results.valid,
                result: response.data.results.result,
                is_role: response.data.results.is_role,
                is_disposable: response.data.results.is_disposable,
                is_free: response.data.results.is_free,
                delivery_confidence: response.data.results.delivery_confidence,
            }
        })

        const results = await Promise.all(promises)
        csvWriter.writeRecords(results)
        console.log("Emails Completed Validation")

    } catch (err) {
        /**
         * If the request is rejected, then the catch method will be executed.
         */
    }
};

const axios = require('axios');
const axiosRetry = require('axios-retry');
const csv = require('fast-csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const dotenv = require('dotenv')
dotenv.config()
const API_KEY = process.env.API_KEY

const csvWriter = createCsvWriter({
    path: 'out.csv',
    header: [
      {id: 'email', title: 'Email'},
      {id: 'result', title: 'Result'},
      {id: 'valid', title: 'Valid'},
      {id: 'is_role', title: 'Is_Role'},
      {id: 'is_disposable', title: 'Is_Disposable'},
      {id: 'is_free', title: 'Is_Free'},
      {id: 'delivery_confidence', title: 'Delivery_Confidence'},
    ]
  });

let emaillist = []

fs.createReadStream('valtest.csv')
.pipe(csv.parse({headers: false}))
.on('data', (row) => {
    emaillist.push(row)
})
.on('end', () => {
    getRecipientValidation(emaillist);
});