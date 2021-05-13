const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// define global variables for the script
let basePath = '';
let files = [];

const argv = require('yargs')
  .usage('usage: $0 -b <bucket> [options]')
  .option('bucket', {
    alias: 'b',
    description: 'name of the s3 bucket',
    demandOption: true,
  }).argv;

console.log(`Deploying Api-Products AsyncApi Website to '${argv.bucket}'`);
process.stdout.write('Uploading files...');

basePath = process.cwd() + '/playground/build/';
files = getAllFiles(basePath);

console.log(argv.bucket);

uploadFiles().catch(error => {
  console.log('error:', error);
  console.log('\nstack:', error.stack);
  process.exit(1);
});

// chunk the upload (a bit) to avoid chaos
function uploadFiles() {
  if (files.length === 0) {
    console.log(`\nUpload complete to '${argv.bucket}'`);
    return Promise.resolve();
  }

  process.stdout.write('.');

  const promises = [];
  for (let x = 0; x < 200; x++) {
    if (files.length === 0) {
      break; // we've run out
    }

    const file = files.pop();
    const params = {
      Bucket: argv.bucket,
      Key: file.replace(basePath, ''),
      Body: fs.readFileSync(file),
      ContentType: getContentType(file),
    };

    if (path.basename(file) === 'index.html') {
      params.CacheControl = 'no-store';
    }

    promises.push(s3.upload(params).promise());
  }

  return Promise.all(promises).then(uploadFiles);
}

function getContentType(filename) {
  const extension = filename.substring(filename.lastIndexOf('.') + 1);
  switch (extension) {
    case 'map':
      return 'map';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpg';
    case 'gif':
      return 'image/gif';
    case 'html':
      return 'text/html';
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    default:
      return 'application/octet-stream';
  }
}

function getAllFiles(dir, filelist) {
  filelist = filelist || [];

  const allFiles = fs.readdirSync(dir);
  allFiles.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = getAllFiles(path.join(dir, file), filelist);
    } else {
      filelist.push(path.join(dir, file));
    }
  });

  return filelist;
}
