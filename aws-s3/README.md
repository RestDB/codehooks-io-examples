# AWS S3 v3 example

Example app to create an API for upload and download of binary files to AWS S3.
Read this [dev.to blogpost](https://dev.to/restdbjones/step-by-step-guide-uploading-and-downloading-binary-files-to-aws-s3-v3-using-nodejs-and-codehooksio-4olh) with a step-by-step guide to handle binary files through the API.

## Install
```bash
npm install codehooks -g
```

Login to account

```bash
coho create mys3project
cd mys3project

npm init es6 -y
npm install codehooks-js
npm install @aws-sdk/client-s3
```

Edit codefiles.

```bash
coho deploy
```

