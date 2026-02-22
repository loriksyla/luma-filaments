import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, placeOrderHandler, contactHandler } from './data/resource';
import { storage } from './storage/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  placeOrderHandler,
  contactHandler,
});

const sesPolicy = new PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['arn:aws:ses:*:*:identity/*'],
});

backend.placeOrderHandler.resources.lambda.addToRolePolicy(sesPolicy);
backend.contactHandler.resources.lambda.addToRolePolicy(sesPolicy);
