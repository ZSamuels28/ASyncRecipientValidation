<a href="https://www.sparkpost.com"><img src="https://www.sparkpost.com/sites/default/files/attachments/SparkPost_Logo_2-Color_Gray-Orange_RGB.svg" width="200px"/></a>

[Sign up](https://app.sparkpost.com/join?plan=free-0817?src=Social%20Media&sfdcid=70160000000pqBb&pc=GitHubSignUp&utm_source=github&utm_medium=social-media&utm_campaign=github&utm_content=sign-up) for a SparkPost account and visit our [Developer Hub](https://developers.sparkpost.com) for even more content.

## Easy installation

Firstly ensure you have `node`:

Either by downloading directly and installing via: https://nodejs.org/en/download/
(Recommended) Or by using the following instructions: https://treehouse.github.io/installation-guides/mac/node-mac.html

Get the project, and install dependencies.

```
git clone https://github.com/ZSamuels28/ASyncRecipientValidation.git
cd ASyncRecipientValidation
```

You can now type `node ./app.js -h` and see usage info.

## Pre-requisites

Set the following environment variables by creating a .env file within the ASyncRecipientValidation directory with the following information. Note these are case-sensitive:

```
SPARKPOST_HOST
    The URL of the SparkPost API service you're using. Defaults to https://api.sparkpost.com.

SPARKPOST_API_KEY
    API key on your SparkPost account, with Recipient Validation rights.
```

The .env file should look something like the following:
```
# .env
SPARKPOST_API_KEY=1234567890ABCDEFGHIJKLMNOPQRSTUVXYZ
SPARKPOST_HOST=https://api.sparkpost.com
```

## Usage

```
node ./app.js -h
usage: ./app.js [-h] [-i INFILE] [-o OUTFILE]

Validate recipients with SparkPost. Checks a single email address, or reads
from specified input file (or stdin). Results to specified output file or
stdout (i.e. can act as a filter).

optional arguments:
  -h, --help            show this help message and exit
  -i INFILE, --infile INFILE
                        filename to read email recipients from (in .CSV
                        format)
  -e EMAIL, --email EMAIL
                        email address to validate. May carry multiple
                        addresses, comma-separated, no spaces
  -o OUTFILE, --outfile OUTFILE
                        filename to write validation results to (in .CSV
                        format)
  --skip_precheck       Skip the precheck of input file email syntax
```

## File input / output

The program can act as a Unix-style "filter" so you can pipe / redirect input and output.
Alternatively, you can use the `-i` and `-o` options to specify input and output files.

An example input file is included in the project. Progress reporting is sent to stderr, so it doesn't
interfere with stdout. Here is a filter example, then displaying the output file.

The output file follows the same form as the SparkPost web application. Note that
*all* your address results are reported, not just the rejected ones (unlike the web UI validation).

Each validation makes a single API call, so this can take a while to run.

Comfort reporting goes to `stderr` so you can redirect the actual output to a file.

```
./sparkyRecipValidate.py <valtest.csv >out.csv
Scanned input file <stdin>, contains 15 syntactically OK and 0 bad addresses. Validating with SparkPost..
Done
```

```
cat out.csv
email,valid,result,reason,is_role,is_disposable,is_free,did_you_mean
postmaster@yahoo.com,True,valid,,True,False,True,
admin@geekswithapersonality.com,True,valid,,True,False,False,
dahoju@heximail.com,True,valid,,False,True,True,
gpiohwxy@sharklasers.com,True,valid,,False,True,False,
kobapracro@memeil.top,False,,Invalid Domain,False,True,False,
planetaryhacksaw@maildrop.cc,True,valid,,False,True,False,
austein@yopmail.com,True,valid,,False,True,False,
vemugi@banit.me,True,valid,,False,True,False,
sales@sparkpost.com,True,valid,,True,False,False,
jeff+friendly@messagesystems.com,True,valid,,False,False,False,
123a@gmail.com,False,undeliverable,Invalid Recipient,False,False,True,
sam@hotmal.com,True,valid,,False,False,False,sam@hotmail.com
abc@yahoo.com,False,undeliverable,Invalid Recipient,False,False,True,
123@hotmail.com,True,valid,,False,False,True,
sweettomatoes@hottomattoes.com,False,,Invalid Domain,False,False,False,
```

Excel or [csvkit](https://csvkit.readthedocs.io) may be helpful to work with these files, for example

```
$ ./sparkyRecipValidate.py -i valtest.csv | csvlook
Scanned input file valtest.csv, contains 15 syntactically OK and 0 bad addresses. Validating with SparkPost..
Done
| email                            | valid | result        | reason            | is_role | is_disposable | is_free | did_you_mean    |
| -------------------------------- | ----- | ------------- | ----------------- | ------- | ------------- | ------- | --------------- |
| postmaster@yahoo.com             |  True | valid         |                   |    True |         False |    True |                 |
| admin@geekswithapersonality.com  |  True | valid         |                   |    True |         False |   False |                 |
| dahoju@heximail.com              |  True | valid         |                   |   False |          True |    True |                 |
| gpiohwxy@sharklasers.com         |  True | valid         |                   |   False |          True |   False |                 |
| kobapracro@memeil.top            | False |               | Invalid Domain    |   False |          True |   False |                 |
| planetaryhacksaw@maildrop.cc     |  True | valid         |                   |   False |          True |   False |                 |
| austein@yopmail.com              |  True | valid         |                   |   False |          True |   False |                 |
| vemugi@banit.me                  |  True | valid         |                   |   False |          True |   False |                 |
| sales@sparkpost.com              |  True | valid         |                   |    True |         False |   False |                 |
| jeff+friendly@messagesystems.com |  True | valid         |                   |   False |         False |   False |                 |
| 123a@gmail.com                   | False | undeliverable | Invalid Recipient |   False |         False |    True |                 |
| sam@hotmal.com                   |  True | valid         |                   |   False |         False |   False | sam@hotmail.com |
| abc@yahoo.com                    | False | undeliverable | Invalid Recipient |   False |         False |    True |                 |
| 123@hotmail.com                  |  True | valid         |                   |   False |         False |    True |                 |
| sweettomatoes@hottomattoes.com   | False |               | Invalid Domain    |   False |         False |   False |                 |
```

## Input file email syntax check

The email syntax pre-check uses [this library](https://pypi.org/project/email_validator/), runs locally, and adds minimal runtime overhead.
It also reports how many addresses are in the file before API-based validation starts.

You can skip the pre-check using the command-line flag shown under "Usage". 
If input is coming from a stream, and therefore not seekable, the pre-check will also be skipped.

Piping in, as you might expect, not seekable:
```
$ cat valtest.csv | ./sparkyRecipValidate.py >result3.csv
Skipping input file syntax pre-check. Validating with SparkPost..
Done
```

Redirection with `<` is (perhaps surprisingly) seekable on many systems, and will run the pre-check unless skipped:
```
$ ./sparkyRecipValidate.py <valtest.csv >result2.csv
Scanned input file <stdin>, contains 15 syntactically OK and 0 bad addresses. Validating with SparkPost..
Done
```

Specifying the input file with `-i` is seekable, and will run the pre-check unless skipped:
```
$ ./sparkyRecipValidate.py -i valtest.csv >result2.csv
Scanned input file valtest.csv, contains 15 syntactically OK and 0 bad addresses. Validating with SparkPost..
Done
```

## See Also
[SparkPost Developer Hub](https://developers.sparkpost.com/)

[Recipient Validation](https://www.sparkpost.com/docs/tech-resources/recipient-validation-sparkpost/)

[Recipient Validation SparkPost API endpoint](https://developers.sparkpost.com/api/recipient-validation/)

