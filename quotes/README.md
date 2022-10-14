
# Build a random quotes API using serverless JavaScript and NoSql datastore

Source code for the random quotes API in this [blog post](https://codehooks.io/blog/serverless-quotes-api).

## Install

```bash
coho create quotes

npm i codehooks-js -s

coho deploy

coho add-token --readonly

coho import ./quotes.csv quotes --rowcount 

coho createindex --collection quotes --index rowcount
```
