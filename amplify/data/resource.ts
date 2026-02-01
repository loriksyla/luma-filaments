import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Product: a
    .model({
      name: a.string(),
      type: a.enum(['PLA', 'PETG', 'ABS', 'TPU', 'ASA']),
      color: a.string(),
      hex: a.string(),
      price: a.float(),
      weight: a.string(),
      description: a.string(),
      imageUrl: a.string(),
      available: a.boolean(),
      brand: a.string(),
      stock: a.integer(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['ADMINS']),
    ]),
  Order: a
    .model({
      orderNumber: a.string(),
      customerName: a.string(),
      customerEmail: a.string(),
      total: a.float(),
      date: a.string(),
      status: a.enum(['KRIJUAR', 'NE_PROCES', 'NE_DERGIM', 'DOREZUAR', 'ANULUAR']),
      items: a.json(),
      address: a.json(),
    })
    .authorization((allow) => [
      allow.guest().to(['create']),
      allow.owner(),
      allow.groups(['ADMINS']),
    ]),
  UserProfile: a
    .model({
      name: a.string(),
      email: a.string(),
      role: a.enum(['user', 'admin']),
      addresses: a.json(),
    })
    .authorization((allow) => [allow.owner(), allow.groups(['ADMINS'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
