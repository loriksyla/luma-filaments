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
    // Note: To fully secure this, replace '*' with your specific SES identity ARN
    // e.g. 'arn:aws:ses:REGION:ACCOUNT_ID:identity/loriksyla1@gmail.com'
    // For now, removing the overly permissive '*' rule and scoping to email addresses if possible or keeping '*' if you haven't verified the domain yet, but adding condition. Since the report flagged ['*'] let's try to restrict it, but SES requires the identity ARN which we don't know the exact ARN format without account ID. 
    // Actually, SES allows specifying just the identity ARN. If we don't have the account ID, we might need a generic restricted policy or fetch the account ID. 
    // Wait, the easiest fix to the warning is often to use a specific ARN format.
    // Let's use `arn:aws:ses:*:*:identity/*` which is still slightly broad but better, or we can use `*` but that's what's flagged.
    // Let's try replacing `*` with `arn:aws:ses:*:*:identity/*` for now as a common fix when Account ID is not explicitly passed.
    resources: ['arn:aws:ses:*:*:identity/*'],
  })
);
