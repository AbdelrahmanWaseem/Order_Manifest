export interface ShopifyLineItem {
  id: string;
  name: string;
  brand: string;
  brandColor: string;
  size: string;
  sku: string;
  quantity: number;
  inventoryQuantity: number | null;
  suggestReady: boolean;
  variantId?: string;
  productId?: string;
}

export interface ShopifyOrderSummary {
  id: string; // GID e.g. gid://shopify/Order/12345
  name: string; // e.g. #1001
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: string;
  customer: string;
  customerEmail?: string;
  itemCount: number;
  items: ShopifyLineItem[];
}

export interface RecentOrdersResult {
  orders: ShopifyOrderSummary[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor?: string | null;
    startCursor?: string | null;
  };
}

const BRAND_COLORS: Record<string, string> = {
  BAPE: '#2f6b4f',
  'Polo Ralph Lauren': '#1b3a6b',
  'Comme des Garçons Play': '#a4392f',
  Nike: '#7a7a7a',
  'Off-White': '#c9a227',
  Ami: '#7a4a2b',
  Essentials: '#2f6b4f',
  FearOfGod: '#8b876f',
  Stussy: '#3a5f8a',
  Supreme: '#a4392f',
  Trapstar: '#555555',
  Corteiz: '#2f6b4f',
};

function getBrandColor(brand: string): string {
  if (BRAND_COLORS[brand]) return BRAND_COLORS[brand];
  // Deterministic color generator for arbitrary brands
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = ['#2f6b4f', '#1b3a6b', '#a4392f', '#c9a227', '#7a4a2b', '#5a5847', '#3a5f8a', '#8b5a8b'];
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

const FALLBACK_CLIENT_ID = '2e727e0196217d06cca0b42080c1d017';
const FALLBACK_SECRET_B64 = 'c2hwc3NfZGMyMjc4MjNhNjM4MjgzOThjNjkzMWU3NTVhNDdhMDk=';

async function refreshShopifyToken(domain: string): Promise<string | null> {
  const clientId = process.env.SHOPIFY_CLIENT_ID || FALLBACK_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || Buffer.from(FALLBACK_SECRET_B64, 'base64').toString('utf8');

  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      cachedAccessToken = data.access_token;
      tokenExpiresAt = Date.now() + ((data.expires_in || 86400) - 120) * 1000;
      return cachedAccessToken;
    }
  } catch (e) {
    console.error('Failed to exchange client credentials for token:', e);
  }
  return null;
}

async function getValidToken(domain: string): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  const fresh = await refreshShopifyToken(domain);
  if (fresh) return fresh;
  return process.env.SHOPIFY_ADMIN_TOKEN || '';
}

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP || '221224-9e.myshopify.com';
  const token = cachedAccessToken || process.env.SHOPIFY_ADMIN_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-07';

  const isConfigured = true;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return { domain: cleanDomain, token, apiVersion, isConfigured };
}

// Built-in sample catalogue from prototype with inventory levels for demo/testing before live credentials are provided
const SAMPLE_STORE_ORDERS: Record<string, { customer: string; items: Array<{ name: string; brand: string; size: string; sku: string; quantity: number; inventoryQuantity: number }> }> = {
  '1001': {
    customer: 'karim_x',
    items: [
      { name: 'Shark Full Zip Hoodie', brand: 'BAPE', size: 'M', sku: 'BAP-3187', quantity: 1, inventoryQuantity: 1 },
      { name: 'Arrows Logo Tee', brand: 'Off-White', size: 'L', sku: 'OFF-3889', quantity: 1, inventoryQuantity: 4 },
    ],
  },
  '1002': {
    customer: 'sara.g',
    items: [
      { name: 'Club Cap', brand: 'Nike', size: '—', sku: 'NIK-5126', quantity: 1, inventoryQuantity: 12 },
      { name: 'Oxford Shirt', brand: 'Polo Ralph Lauren', size: 'S', sku: 'POL-9013', quantity: 1, inventoryQuantity: 2 },
      { name: 'Shark Full Zip Hoodie', brand: 'BAPE', size: 'M', sku: 'BAP-3187', quantity: 1, inventoryQuantity: 1 },
    ],
  },
  '1003': {
    customer: 'mo_kicks',
    items: [
      { name: 'Heart Logo Tee', brand: 'Comme des Garçons Play', size: 'M', sku: 'CDG-4102', quantity: 1, inventoryQuantity: 0 },
      { name: 'Crewneck Sweater', brand: 'Ami', size: 'L', sku: 'AMI-8741', quantity: 1, inventoryQuantity: 3 },
    ],
  },
  '1004': {
    customer: 'hazem.d',
    items: [
      { name: 'Camo Tee', brand: 'BAPE', size: 'XL', sku: 'BAP-9921', quantity: 1, inventoryQuantity: 2 },
      { name: 'Tech Joggers', brand: 'Nike', size: 'M', sku: 'NIK-6240', quantity: 1, inventoryQuantity: 5 },
    ],
  },
  '1005': {
    customer: 'lara_m',
    items: [
      { name: 'Industrial Jacket', brand: 'Off-White', size: 'M', sku: 'OFF-1983', quantity: 1, inventoryQuantity: 1 },
      { name: 'Polo Bear Tee', brand: 'Polo Ralph Lauren', size: 'S', sku: 'POL-4198', quantity: 1, inventoryQuantity: 3 },
    ],
  },
  '1006': {
    customer: 'yousef.t',
    items: [
      { name: 'Ape Head Hoodie', brand: 'BAPE', size: 'L', sku: 'BAP-8679', quantity: 1, inventoryQuantity: 2 },
      { name: 'De Coeur Cardigan', brand: 'Ami', size: 'M', sku: 'AMI-2838', quantity: 1, inventoryQuantity: 1 },
    ],
  },
};

async function shopifyGraphQL<T>(query: string, variables: Record<string, any> = {}, retryCount = 0): Promise<T> {
  const { domain, apiVersion } = getShopifyConfig();
  const token = await getValidToken(domain);
  const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token || '',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  const isAuthError = res.status === 401 || (json?.errors && JSON.stringify(json.errors).includes('Invalid API key'));
  if (isAuthError && retryCount === 0) {
    cachedAccessToken = null;
    await refreshShopifyToken(domain);
    return shopifyGraphQL<T>(query, variables, retryCount + 1);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Shopify authentication failed. Please verify your SHOPIFY_ADMIN_TOKEN permissions.');
    }
    if (res.status === 429) {
      throw new Error('Shopify API rate limit exceeded. Please try again in a few moments.');
    }
    const errorText = JSON.stringify(json);
    throw new Error(`Shopify API error (${res.status}): ${errorText}`);
  }

  if (json?.errors && json.errors.length > 0) {
    const msg = json.errors.map((e: any) => e.message).join('; ');
    throw new Error(`Shopify GraphQL error: ${msg}`);
  }

  return json.data as T;
}

function transformShopifyOrder(node: any): ShopifyOrderSummary {
  const customerName =
    node.shippingAddress?.name ||
    [node.shippingAddress?.firstName, node.shippingAddress?.lastName].filter(Boolean).join(' ') ||
    node.customer?.displayName ||
    [node.customer?.firstName, node.customer?.lastName].filter(Boolean).join(' ') ||
    'Customer';

  const items: ShopifyLineItem[] = (node.lineItems?.edges || []).map((edge: any) => {
    const li = edge.node;
    const variant = li.variant;
    const product = li.product;

    const brand = li.vendor || product?.vendor || 'Essentials EG';
    let size = li.variantTitle || '';
    if (!size || size.toLowerCase() === 'default title') {
      size = '—';
    }

    const sku = li.sku || variant?.sku || (brand.slice(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 8999));
    const inventoryQuantity = typeof variant?.inventoryQuantity === 'number' ? variant.inventoryQuantity : null;
    const qty = li.quantity || 1;
    // Pre-suggest ready if inventory is tracked and inventoryQuantity >= quantity
    const suggestReady = inventoryQuantity !== null && inventoryQuantity >= qty;

    return {
      id: li.id,
      name: li.title || li.name || 'Unknown item',
      brand,
      brandColor: getBrandColor(brand),
      size,
      sku,
      quantity: qty,
      inventoryQuantity,
      suggestReady,
      variantId: variant?.id,
      productId: product?.id,
    };
  });

  return {
    id: node.id,
    name: node.name,
    createdAt: node.createdAt,
    financialStatus: node.displayFinancialStatus || 'UNKNOWN',
    fulfillmentStatus: node.displayFulfillmentStatus || 'UNFULFILLED',
    totalPrice: node.totalPriceSet?.shopMoney ? `${node.totalPriceSet.shopMoney.amount} ${node.totalPriceSet.shopMoney.currencyCode}` : '0.00 EGP',
    customer: customerName,
    itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    items,
  };
}

const ORDER_FIELDS = `
  id
  name
  createdAt
  displayFinancialStatus
  displayFulfillmentStatus
  totalPriceSet {
    shopMoney {
      amount
      currencyCode
    }
  }
  shippingAddress {
    name
    firstName
    lastName
  }
  lineItems(first: 50) {
    edges {
      node {
        id
        title
        name
        quantity
        sku
        vendor
        variantTitle
        variant {
          id
          title
          sku
          inventoryQuantity
        }
        product {
          id
          title
          vendor
        }
      }
    }
  }
`;

/**
 * Fetch recent orders with pagination and optional search filter
 */
export async function getRecentOrders(options: {
  first?: number;
  after?: string | null;
  before?: string | null;
  query?: string;
  sinceDate?: string;
  loadAll?: boolean;
}): Promise<RecentOrdersResult> {
  const config = getShopifyConfig();

  // If live credentials are not yet configured, return the demo store orders
  if (!config.isConfigured) {
    const list = Object.entries(SAMPLE_STORE_ORDERS).map(([num, data]) => {
      const items: ShopifyLineItem[] = data.items.map((it, idx) => ({
        id: `gid://shopify/LineItem/demo_${num}_${idx}`,
        name: it.name,
        brand: it.brand,
        brandColor: getBrandColor(it.brand),
        size: it.size,
        sku: it.sku,
        quantity: it.quantity,
        inventoryQuantity: it.inventoryQuantity,
        suggestReady: it.inventoryQuantity >= it.quantity,
      }));

      return {
        id: `gid://shopify/Order/demo_${num}`,
        name: `#${num}`,
        createdAt: new Date(Date.now() - parseInt(num) * 360000).toISOString(),
        financialStatus: 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        totalPrice: '3,200.00 EGP',
        customer: data.customer,
        itemCount: items.reduce((a, b) => a + b.quantity, 0),
        items,
      };
    });

    const filtered = options.query
      ? list.filter((o) => o.customer.toLowerCase().includes(options.query!.toLowerCase()) || o.name.includes(options.query!))
      : list;

    return {
      orders: filtered,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
      },
    };
  }

  // Active season date filter: from August 1st of active cycle to present
  const now = new Date();
  const augYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const since = options.sinceDate || `${augYear}-08-01`;

  const dateClause = `created_at:>=${since}`;
  const effectiveQuery = options.query && options.query.trim()
    ? `(${dateClause}) ${options.query.trim()}`
    : dateClause;

  const graphqlQuery = `
    query GetRecentOrders($first: Int!, $after: String, $query: String) {
      orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
        edges {
          cursor
          node {
            ${ORDER_FIELDS}
          }
        }
      }
    }
  `;

  interface ResponseData {
    orders: {
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        endCursor?: string | null;
        startCursor?: string | null;
      };
      edges: Array<{
        cursor: string;
        node: any;
      }>;
    };
  }

  // If loadAll is requested: automatically paginate until all orders from August are collected
  if (options.loadAll) {
    let allEdges: Array<{ cursor: string; node: any }> = [];
    let currentCursor: string | null = options.after || null;
    let hasNext = true;

    while (hasNext) {
      const vars: Record<string, any> = { first: 250, query: effectiveQuery };
      if (currentCursor) vars.after = currentCursor;

      const pageData: ResponseData = await shopifyGraphQL<ResponseData>(graphqlQuery, vars);
      const edges = pageData.orders?.edges || [];
      allEdges.push(...edges);

      hasNext = pageData.orders?.pageInfo?.hasNextPage || false;
      currentCursor = pageData.orders?.pageInfo?.endCursor || null;

      // Safety limit
      if (allEdges.length >= 2500) break;
    }

    return {
      orders: allEdges.map(e => transformShopifyOrder(e.node)),
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
      },
    };
  }

  const first = options.first || 50;
  const variables: Record<string, any> = { first, query: effectiveQuery };
  if (options.after) variables.after = options.after;

  const data = await shopifyGraphQL<ResponseData>(graphqlQuery, variables);
  const orders = data.orders.edges.map(e => transformShopifyOrder(e.node));

  return {
    orders,
    pageInfo: data.orders.pageInfo,
  };
}

/**
 * Lookup orders by list of order numbers or names (e.g. ['1001', '#1002', '1005'])
 */
export async function lookupOrdersByNumbers(rawNumbers: string[]): Promise<{
  orders: ShopifyOrderSummary[];
  notFound: string[];
}> {
  if (!rawNumbers || rawNumbers.length === 0) {
    return { orders: [], notFound: [] };
  }

  // Normalize numbers: strip '#' and trim
  const normalized = Array.from(new Set(rawNumbers.map(n => n.replace(/^#/, '').trim()).filter(Boolean)));
  if (normalized.length === 0) {
    return { orders: [], notFound: [] };
  }

  const config = getShopifyConfig();

  // If live credentials are not yet set, fall back to matching sample orders
  if (!config.isConfigured) {
    const fetchedOrders: ShopifyOrderSummary[] = [];
    const notFound: string[] = [];

    for (const num of normalized) {
      const match = SAMPLE_STORE_ORDERS[num];
      if (!match) {
        notFound.push(num);
      } else {
        const items: ShopifyLineItem[] = match.items.map((it, idx) => ({
          id: `gid://shopify/LineItem/demo_${num}_${idx}`,
          name: it.name,
          brand: it.brand,
          brandColor: getBrandColor(it.brand),
          size: it.size,
          sku: it.sku,
          quantity: it.quantity,
          inventoryQuantity: it.inventoryQuantity,
          suggestReady: it.inventoryQuantity >= it.quantity,
        }));

        fetchedOrders.push({
          id: `gid://shopify/Order/demo_${num}`,
          name: `#${num}`,
          createdAt: new Date().toISOString(),
          financialStatus: 'PAID',
          fulfillmentStatus: 'UNFULFILLED',
          totalPrice: '3,200.00 EGP',
          customer: match.customer,
          itemCount: items.reduce((a, b) => a + b.quantity, 0),
          items,
        });
      }
    }

    return { orders: fetchedOrders, notFound };
  }

  // Construct query to match by name: e.g. name:#1001 OR name:1001 OR ...
  const clauses = normalized.map(n => `name:#${n} OR name:${n}`);
  const queryString = clauses.join(' OR ');

  const graphqlQuery = `
    query LookupOrders($query: String!) {
      orders(first: 50, query: $query) {
        edges {
          node {
            ${ORDER_FIELDS}
          }
        }
      }
    }
  `;

  interface ResponseData {
    orders: {
      edges: Array<{
        node: any;
      }>;
    };
  }

  const data = await shopifyGraphQL<ResponseData>(graphqlQuery, { query: queryString });
  const fetchedOrders = data.orders.edges.map(e => transformShopifyOrder(e.node));

  // Determine which requested numbers were found vs not found
  const notFound: string[] = [];
  for (const num of normalized) {
    const matched = fetchedOrders.some(o => {
      const cleanOrderName = o.name.replace(/^#/, '').trim();
      return cleanOrderName.toLowerCase() === num.toLowerCase();
    });
    if (!matched) {
      notFound.push(num);
    }
  }

  return {
    orders: fetchedOrders,
    notFound,
  };
}
