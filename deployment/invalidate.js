let AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

let s3 = new AWS.S3({ apiVersion: '2006-03-01' });
let cloudfront = new AWS.CloudFront({ apiVersion: '2019-03-26' });
let cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15' });

const argv = require('yargs')
  .usage('usage: $0 -b <bucket> [-c <num_of_checks>]')
  .option('bucket', {
    alias: 'b',
    description: 'name of the s3 bucket',
    demandOption: true,
  })
  .option('checks', {
    alias: 'c',
    description: 'number of 30 second periods to wait before timeout',
    default: 80, // wait for 2400 seconds (aka 40 minutes)
  }).argv;

// we have to get the tag on the s3 bucket (based on the bucket name) that is that stack name
// then with the stack name we get the stack and get the cloudfront id which we use to invalidate

console.log(`Getting tags for api-products S3 bucket '${argv.bucket}'`);
s3.getBucketTagging({ Bucket: argv.bucket })
  .promise()
  .then(processTags)
  .then(invalidateCloudfront)
  .catch(error => {
    console.log('error:', error);
    process.exit(1);
  });

function processTags(bucket) {
  let stackTag = bucket.TagSet.find(tag => {
    return tag.Key === 'aws:cloudformation:stack-name';
  });

  console.log(`Retrieving cloudfront stack '${stackTag.Value}'`);
  return cloudformation
    .listStackResources({ StackName: stackTag.Value })
    .promise();
}

function invalidateCloudfront(stackResources) {
  let cloudfrontDistro = stackResources.StackResourceSummaries.find(
    resource => {
      return resource.ResourceType === 'AWS::CloudFront::Distribution';
    },
  );
  let cloudfrontId = cloudfrontDistro.PhysicalResourceId;

  let params = {
    DistributionId: cloudfrontId,
    InvalidationBatch: {
      CallerReference: `cf-invalidation-${(Date.now() / 1000) | 0}`,
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  };

  console.log(`Invalidating cloudfront stack '${cloudfrontId}'`);
  return cloudfront
    .createInvalidation(params)
    .promise()
    .then(() => {
      return new Promise((resolve, reject) => {
        process.stdout.write('Waiting for invalidation...');

        let checks = 0;
        let intervalId = setInterval(
          () =>
            cloudfront.listInvalidations(
              { DistributionId: cloudfrontId },
              (error, invalidations) => {
                if (error) {
                  clearInterval(intervalId);
                  reject(error);
                } else if (
                  invalidations !== null &&
                  invalidations !== undefined &&
                  invalidations.Items.length > 0
                ) {
                  let latestInvalidation = invalidations.Items.sort(
                    (a, b) => b.CreateTime - a.CreateTime,
                  )[0];
                  if (latestInvalidation.Status === 'InProgress') {
                    process.stdout.write('.');
                  } else if (latestInvalidation.Status === 'Completed') {
                    clearInterval(intervalId);
                    console.log('\nInvalidation complete');
                    resolve();
                  } else {
                    reject({
                      msg: 'there is an invalid status for the invalidation',
                      invalidation: latestInvalidation,
                      stack: 'N/A',
                    });
                  }
                }

                if (++checks > argv.checks) {
                  clearInterval(intervalId);
                  reject('timeout waiting for console invalidation');
                }
              },
            ),
          30000,
        ); // 30 seconds
      });
    });
}
