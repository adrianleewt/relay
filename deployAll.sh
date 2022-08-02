cd client
npm run build
# && aws s3 sync build/ "s3://${RELAY_HOSTING_BUCKET_NAME}"

cd ../infrastructure
npm run build
cdk deploy --require-approval never
