import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, placeOrderHandler, contactHandler } from './data/resource';
import { storage } from './storage/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

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

const stack = Stack.of(backend.placeOrderHandler.resources.lambda);
const region = stack.region;
const account = stack.account;

const placeOrderSesPolicy = new PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: [`arn:aws:ses:${region}:${account}:identity/loriksyla1@gmail.com`],
});

const contactSesPolicy = new PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: [`arn:aws:ses:${region}:${account}:identity/gentrit.tech@gmail.com`],
});

backend.placeOrderHandler.resources.lambda.addToRolePolicy(placeOrderSesPolicy);
backend.contactHandler.resources.lambda.addToRolePolicy(contactSesPolicy);
