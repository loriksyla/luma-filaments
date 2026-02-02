import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, placeOrderHandler } from './data/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  placeOrderHandler,
});

backend.placeOrderHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
);
