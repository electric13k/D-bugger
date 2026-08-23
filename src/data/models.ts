import { OpenRouterModelOption, MonitoredRepo } from '../types';

export const OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek-R1 (Free)',
    contextLength: '128k tokens',
    isFree: true,
    provider: 'DeepSeek',
    recommendedFor: 'Complex multi-file logic bugs, race conditions & algorithmic regressions',
    badge: 'Reasoning Heavy',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    contextLength: '128k tokens',
    isFree: true,
    provider: 'Meta',
    recommendedFor: 'Production bug fixes, AST refactoring & high-accuracy code patches',
    badge: 'Best General Coder',
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B (Free)',
    contextLength: '32k tokens',
    isFree: true,
    provider: 'Alibaba Cloud',
    recommendedFor: 'Language-specific syntax, type safety, Python/TS/Rust bugs & test suites',
    badge: 'Code Specialist',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp (Free)',
    contextLength: '1,048,576 tokens (1M)',
    isFree: true,
    provider: 'Google',
    recommendedFor: 'Massive full-repository context, deep dependency trees & cross-module tracing',
    badge: '1M Mega Context',
  },
  {
    id: 'mistralai/mistral-small-3.1:free',
    name: 'Mistral Small 3.1 (Free)',
    contextLength: '32k tokens',
    isFree: true,
    provider: 'Mistral AI',
    recommendedFor: 'Fast zero-latency patch verification & quick lint error corrections',
    badge: 'Ultra Fast',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash (Native SDK)',
    contextLength: '1M tokens',
    isFree: true,
    provider: 'Google AI Studio',
    recommendedFor: 'Default native server-side fallback with verified reliability',
    badge: 'Native Studio Engine',
  }
];

export const DEMO_PRESET_REPOS: MonitoredRepo[] = [];

export const BUG_SCENARIOS = [
  {
    id: 'bug-react-memory-leak',
    title: 'React useEffect EventListener Memory Leak & Unmounted State Update',
    category: 'memory_leak' as const,
    severity: 'high' as const,
    targetRepo: 'web/saas-dashboard-v2',
    file: 'src/components/LiveTelemetryStream.tsx',
    commitMsg: 'feat: add socket streaming telemetry listeners without cleanup',
    originalCode: `useEffect(() => {
  const socket = new WebSocket(STREAM_URL);
  socket.onmessage = (event) => {
    // BUG: Missing unmounted check and no cleanup return function!
    setMetrics(JSON.parse(event.data));
  };
  window.addEventListener('resize', calculateChartBounds);
}, []);`,
    bugExplanation: 'WebSocket connection and window resize listener are registered without any cleanup function in useEffect. When component unmounts or re-renders, orphaned sockets and listeners accumulate, leaking memory and calling setState on unmounted components.',
    suggestedFix: `useEffect(() => {
  let isMounted = true;
  const socket = new WebSocket(STREAM_URL);
  const handleResize = () => calculateChartBounds();

  socket.onmessage = (event) => {
    if (isMounted) {
      try {
        setMetrics(JSON.parse(event.data));
      } catch (err) {
        console.error("Failed to parse metric payload", err);
      }
    }
  };
  window.addEventListener('resize', handleResize);

  return () => {
    isMounted = false;
    socket.close();
    window.removeEventListener('resize', handleResize);
  };
}, []);`
  },
  {
    id: 'bug-sql-injection',
    title: 'CWE-89: SQL Injection Vulnerability in User Query Route',
    category: 'security_cve' as const,
    severity: 'critical' as const,
    targetRepo: 'acme/ecommerce-api',
    file: 'src/controllers/orderController.ts',
    commitMsg: 'refactor: direct query lookup for customer invoice tracking',
    originalCode: `export async function getCustomerOrders(req: Request, res: Response) {
  const { customerId, status } = req.query;
  // CRITICAL VULNERABILITY: Raw template string concatenation in SQL query!
  const queryStr = \`SELECT * FROM orders WHERE customer_id = '\${customerId}' AND status = '\${status}'\`;
  const [rows] = await db.raw(queryStr);
  return res.json(rows);
}`,
    bugExplanation: 'Direct interpolation of req.query into raw SQL query permits arbitrary remote SQL injection, potentially allowing attackers to bypass authentication and exfiltrate database contents.',
    suggestedFix: `export async function getCustomerOrders(req: Request, res: Response) {
  const customerId = String(req.query.customerId || '').trim();
  const status = String(req.query.status || 'pending').trim();

  // SECURE: Parameterized SQL bindings prevent SQL injection attacks
  const queryStr = 'SELECT id, customer_id, total, status, created_at FROM orders WHERE customer_id = ? AND status = ?';
  const [rows] = await db.query(queryStr, [customerId, status]);
  return res.json(rows);
}`
  },
  {
    id: 'bug-race-condition',
    title: 'Concurrent JWT Refresh Token Race Condition in Auth Gateway',
    category: 'race_condition' as const,
    severity: 'critical' as const,
    targetRepo: 'devops/auth-gateway',
    file: 'src/middleware/tokenRotator.ts',
    commitMsg: 'perf: handle parallel token rotations on expired session bursts',
    originalCode: `let isRefreshing = false;
export async function rotateRefreshToken(token: string) {
  // BUG: Non-atomic mutex check creates race conditions during simultaneous 401 requests
  if (isRefreshing) return;
  isRefreshing = true;
  const newTokens = await authServer.refresh(token);
  await db.sessions.update({ token: newTokens.refreshToken });
  isRefreshing = false;
  return newTokens;
}`,
    bugExplanation: 'Simple boolean flag fails when asynchronous promises yield between evaluation and assignment, causing multiple requests to invalidate active refresh tokens simultaneously and terminate valid user sessions.',
    suggestedFix: `let refreshPromise: Promise<TokenPair> | null = null;

export async function rotateRefreshToken(token: string): Promise<TokenPair> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const newTokens = await authServer.refresh(token);
      await db.sessions.update({ token: newTokens.refreshToken });
      return newTokens;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}`
  },
  {
    id: 'bug-null-pointer',
    title: 'Unhandled Optional Chaining / TypeError in Order Total Calculation',
    category: 'null_pointer' as const,
    severity: 'medium' as const,
    targetRepo: 'acme/ecommerce-api',
    file: 'src/services/pricingEngine.ts',
    commitMsg: 'feat: add promotional discount calculations for multi-currency',
    originalCode: `export function calculateGrandTotal(cart: any) {
  // BUG: Crashing on empty coupon object or unassigned shipping tier
  const discountRate = cart.appliedCoupon.percentage;
  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * cart.shippingAddress.taxRate;
  return (subtotal * (1 - discountRate)) + tax + cart.shippingRate.amount;
}`,
    bugExplanation: 'Accessing cart.appliedCoupon.percentage and cart.shippingAddress.taxRate throws TypeError "Cannot read properties of undefined" whenever cart has no coupon or guest user hasn\'t selected shipping yet.',
    suggestedFix: `export function calculateGrandTotal(cart: any): number {
  if (!cart || !Array.isArray(cart.items)) return 0;
  
  const discountRate = (cart.appliedCoupon?.percentage ?? 0) / 100;
  const subtotal = cart.items.reduce((sum: number, item: any) => {
    const price = Number(item?.price) || 0;
    const qty = Number(item?.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  const taxRate = Number(cart.shippingAddress?.taxRate) || 0;
  const shippingAmount = Number(cart.shippingRate?.amount) || 0;
  const discountedSubtotal = Math.max(0, subtotal * (1 - discountRate));
  const tax = discountedSubtotal * taxRate;

  return Number((discountedSubtotal + tax + shippingAmount).toFixed(2));
}`
  }
];
