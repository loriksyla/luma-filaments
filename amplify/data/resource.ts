import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';

export const placeOrderHandler = defineFunction({
  name: 'placeOrder',
  entry: './place-order/handler.ts',
  environment: {
    AMPLIFY_DATA_DEFAULT_NAME: 'data',
    ORDER_EMAIL_FROM: 'loriksyla1@gmail.com',
    ORDER_EMAIL_ADMIN: 'loriksyla@gmail.com',
  },
});

const schema = a
  .schema({
    PlaceOrderResponse: a.customType({
      ok: a.boolean(),
      orderId: a.string(),
      message: a.string(),
    }),
    Product: a
      .model({
        name: a.string(),
        type: a.enum(['PLA', 'PETG', 'ABS', 'TPU', 'ASA']),
        price: a.float(),
        weight: a.string(),
        imageUrl: a.string(),
        available: a.boolean(),
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
        name: a.string().required(),
        email: a.string().required(),
        addresses: a.json(),
      })
      .authorization((allow) => [allow.owner(), allow.groups(['ADMINS'])]),
    placeOrder: a
      .mutation()
      .arguments({
        orderNumber: a.string().required(),
        customerName: a.string().required(),
        customerEmail: a.string().required(),
        date: a.string().required(),
        items: a.string().required(),
        address: a.string().required(),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()])
      .handler(a.handler.function(placeOrderHandler))
      .returns(a.ref('PlaceOrderResponse')),
  })
  .authorization((allow) => [
    allow.resource(placeOrderHandler).to(['query', 'mutate']),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
