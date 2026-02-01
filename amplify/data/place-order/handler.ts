import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import type { DataClientEnv } from '@aws-amplify/backend-function/runtime';
import type { Schema } from '../resource';

type Handler = Schema['placeOrder']['functionHandler'];

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value == null) return fallback;
  return value as T;
};

export const handler: Handler = async (event) => {
  try {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
      process.env as DataClientEnv
    );
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const {
      orderNumber,
      customerName,
      customerEmail,
      total,
      date,
      status,
      items,
      address,
    } = event.arguments;

    const parsedItems = parseJson<{ product: { id: string }; quantity: number }[]>(items, []);

    if (parsedItems.length === 0) {
      return { ok: false, orderId: '', message: 'Shporta është bosh.' };
    }

    for (const item of parsedItems) {
      const productId = item.product?.id;
      if (!productId || item.quantity <= 0) {
        return { ok: false, orderId: '', message: 'Sasi e pavlefshme.' };
      }

      const { data: product } = await client.graphql({
        query: /* GraphQL */ `
          query GetProduct($id: ID!) {
            getProduct(id: $id) {
              id
              name
              stock
            }
          }
        `,
        variables: { id: productId },
      }) as any;

      const productData = product?.getProduct;
      if (!productData) {
        return { ok: false, orderId: '', message: 'Produkti nuk u gjet.' };
      }

      const currentStock = productData.stock ?? 0;
      if (item.quantity > currentStock) {
        return {
          ok: false,
          orderId: '',
          message: `Sasia e kërkuar për "${productData.name ?? 'produkt'}" tejkalon stokun.`,
        };
      }

      await client.graphql({
        query: /* GraphQL */ `
          mutation UpdateProduct($input: UpdateProductInput!) {
            updateProduct(input: $input) {
              id
              stock
            }
          }
        `,
        variables: {
          input: {
            id: productId,
            stock: currentStock - item.quantity,
          },
        },
      });
    }

    const { data: orderResult } = await client.graphql({
      query: /* GraphQL */ `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          orderNumber,
          customerName,
          customerEmail,
          total,
          date,
          status,
          items,
          address,
        },
      },
    }) as any;

    const createdOrderId = orderResult?.createOrder?.id;
    if (!createdOrderId) {
      return { ok: false, orderId: '', message: 'Porosia nuk u krijua.' };
    }

    return { ok: true, orderId: createdOrderId, message: 'OK' };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : err
          ? JSON.stringify(err)
          : 'Gabim i panjohur.';
    console.error('placeOrder failed:', err);
    return { ok: false, orderId: '', message };
  }
};
