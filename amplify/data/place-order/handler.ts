import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/placeOrder';
import type { Schema } from '../resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

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

    const { data: product } = await client.models.Product.get({ id: productId });
    if (!product) {
      return { ok: false, orderId: '', message: 'Produkti nuk u gjet.' };
    }

    const currentStock = product.stock ?? 0;
    if (item.quantity > currentStock) {
      return {
        ok: false,
        orderId: '',
        message: `Sasia e kërkuar për "${product.name ?? 'produkt'}" tejkalon stokun.`,
      };
    }

    await client.models.Product.update({
      id: product.id,
      stock: currentStock - item.quantity,
    });
  }

  const { data: order } = await client.models.Order.create({
    orderNumber,
    customerName,
    customerEmail,
    total,
    date,
    status: status as 'KRIJUAR' | 'NE_PROCES' | 'NE_DERGIM' | 'DOREZUAR' | 'ANULUAR',
    items,
    address,
  });

  if (!order) {
    return { ok: false, orderId: '', message: 'Porosia nuk u krijua.' };
  }

  return { ok: true, orderId: order.id, message: 'OK' };
};
