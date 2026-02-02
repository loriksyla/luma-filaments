import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import type { DataClientEnv } from '@aws-amplify/backend-function/runtime';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
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

type OrderItem = {
  quantity?: number;
  product?: {
    id?: string;
    name?: string;
    type?: string;
    brand?: string;
  };
};

type AddressValue = {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  customCity?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatAddress = (address: AddressValue | string) => {
  if (typeof address === 'string') return address;
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ').trim();
  const city = address.city === 'Tjetër' ? address.customCity : address.city;
  const line2 = [city, address.country, address.postalCode].filter(Boolean).join(', ');
  const phone = address.phone ? `Tel: ${address.phone}` : '';
  return [name, address.address ?? '', line2, phone].filter(Boolean).join(' • ');
};

const buildItemsHtml = (items: OrderItem[]) => {
  if (items.length === 0) return '<li>Pa artikuj</li>';
  return items
    .map((item) => {
      const qty = Math.max(1, item.quantity ?? 1);
      const name = item.product?.name ?? 'Produkt';
      const type = item.product?.type ? ` (${item.product.type})` : '';
      const brand = item.product?.brand ? ` - ${item.product.brand}` : '';
      return `<li>${qty}x ${escapeHtml(`${name}${type}${brand}`)}</li>`;
    })
    .join('');
};

const buildEmailHtml = (params: {
  title: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  total: number;
  status: string;
  itemsHtml: string;
  addressText: string;
}) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:24px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
        <h2 style="margin:0;font-size:22px;letter-spacing:0.4px;">${escapeHtml(params.title)}</h2>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 12px;font-size:14px;"><strong>Order:</strong> ${escapeHtml(params.orderNumber)}</p>
        <p style="margin:0 0 12px;font-size:14px;"><strong>Customer:</strong> ${escapeHtml(params.customerName)} (${escapeHtml(params.customerEmail)})</p>
        <p style="margin:0 0 12px;font-size:14px;"><strong>Date:</strong> ${escapeHtml(new Date(params.orderDate).toLocaleString('en-GB'))}</p>
        <p style="margin:0 0 12px;font-size:14px;"><strong>Status:</strong> ${escapeHtml(params.status)}</p>
        <p style="margin:0 0 12px;font-size:14px;"><strong>Total:</strong> €${params.total.toFixed(2)}</p>
        <p style="margin:16px 0 8px;font-size:14px;"><strong>Items:</strong></p>
        <ul style="margin:0 0 16px 20px;padding:0;font-size:14px;line-height:1.7;">${params.itemsHtml}</ul>
        <p style="margin:0 0 6px;font-size:14px;"><strong>Delivery Address:</strong></p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(params.addressText)}</p>
      </div>
    </div>
  </body>
</html>
`;

const sendOrderEmails = async (params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  date: string;
  status: string;
  items: OrderItem[];
  address: AddressValue | string;
}) => {
  const fromEmail = process.env.ORDER_EMAIL_FROM;
  const adminEmail = process.env.ORDER_EMAIL_ADMIN;
  if (!fromEmail || !adminEmail) return;

  const ses = new SESClient({ region: process.env.AWS_REGION });
  const addressText = formatAddress(params.address);
  const itemsHtml = buildItemsHtml(params.items);
  const safeOrderNumber = params.orderNumber || '—';

  const adminHtml = buildEmailHtml({
    title: 'New Order Received',
    orderNumber: safeOrderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    orderDate: params.date,
    total: params.total,
    status: params.status,
    itemsHtml,
    addressText,
  });

  const customerHtml = buildEmailHtml({
    title: 'Order Confirmation',
    orderNumber: safeOrderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    orderDate: params.date,
    total: params.total,
    status: 'Krijuar',
    itemsHtml,
    addressText,
  });

  await Promise.all([
    ses.send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [adminEmail] },
        Message: {
          Subject: { Data: `New Order ${safeOrderNumber}`, Charset: 'UTF-8' },
          Body: { Html: { Data: adminHtml, Charset: 'UTF-8' } },
        },
      })
    ),
    ses.send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [params.customerEmail] },
        Message: {
          Subject: { Data: `Order Confirmation ${safeOrderNumber}`, Charset: 'UTF-8' },
          Body: { Html: { Data: customerHtml, Charset: 'UTF-8' } },
        },
      })
    ),
  ]);
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

    const parsedItems = parseJson<OrderItem[]>(items, []);
    const parsedAddress = parseJson<AddressValue | string>(address, '');

    if (parsedItems.length === 0) {
      return { ok: false, orderId: '', message: 'Shporta është bosh.' };
    }

    const requestedByProduct = new Map<string, number>();
    for (const item of parsedItems) {
      const productId = item.product?.id;
      const qty = item.quantity ?? 0;
      if (!productId || qty <= 0) {
        return { ok: false, orderId: '', message: 'Sasi e pavlefshme.' };
      }
      requestedByProduct.set(productId, (requestedByProduct.get(productId) ?? 0) + qty);
    }

    const stockUpdates: Array<{ productId: string; nextStock: number }> = [];

    for (const [productId, requestedQty] of requestedByProduct.entries()) {

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
      if (requestedQty > currentStock) {
        return {
          ok: false,
          orderId: '',
          message: `Sasia e kërkuar për "${productData.name ?? 'produkt'}" tejkalon stokun.`,
        };
      }
      stockUpdates.push({
        productId,
        nextStock: currentStock - requestedQty,
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

    for (const update of stockUpdates) {
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
            id: update.productId,
            stock: update.nextStock,
          },
        },
      });
    }

    try {
      await sendOrderEmails({
        orderNumber,
        customerName,
        customerEmail,
        total,
        date,
        status,
        items: parsedItems,
        address: parsedAddress,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
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
