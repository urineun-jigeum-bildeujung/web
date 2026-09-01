// TanStack Query Key 중앙 관리 factory. 호출부는 배열을 직접 조립하지 않고 이 factory만 쓴다.

// id 타입은 백엔드 Swagger 확정 전이라 넓게 둔다. 확정되면 좁힌다.
type ResourceId = string | number;

interface ProductListFilters {
  category?: string;
  species?: string;
}

const productKeys = {
  all: ["product"] as const,
  listAll: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductListFilters) => [...productKeys.listAll(), filters] as const,
  searchAll: () => [...productKeys.all, "search"] as const,
  search: (keyword: string) => [...productKeys.searchAll(), keyword] as const,
  detailAll: () => [...productKeys.all, "detail"] as const,
  detail: (productId: ResourceId) => [...productKeys.detailAll(), productId] as const,
};

const timedealKeys = {
  all: ["timedeal"] as const,
  list: () => [...timedealKeys.all, "list"] as const,
  detailAll: () => [...timedealKeys.all, "detail"] as const,
  detail: (dealId: ResourceId) => [...timedealKeys.detailAll(), dealId] as const,
};

const cartKeys = {
  all: ["cart"] as const,
};

const orderKeys = {
  all: ["order"] as const,
  list: () => [...orderKeys.all, "list"] as const,
  detailAll: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: ResourceId) => [...orderKeys.detailAll(), orderId] as const,
};

const petKeys = {
  all: ["pet"] as const,
  list: () => [...petKeys.all, "list"] as const,
};

const addressKeys = {
  all: ["address"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

const reviewKeys = {
  all: ["review"] as const,
  byProductAll: () => [...reviewKeys.all, "by-product"] as const,
  byProduct: (productId: ResourceId) => [...reviewKeys.byProductAll(), productId] as const,
  myAll: () => [...reviewKeys.all, "my"] as const,
  myList: () => [...reviewKeys.myAll(), "list"] as const,
  myDetail: (reviewId: ResourceId) => [...reviewKeys.myAll(), "detail", reviewId] as const,
};

const paymentKeys = {
  all: ["payment"] as const,
  detailAll: () => [...paymentKeys.all, "detail"] as const,
  detail: (paymentId: ResourceId) => [...paymentKeys.detailAll(), paymentId] as const,
  methods: () => [...paymentKeys.all, "methods"] as const,
};

const notificationKeys = {
  all: ["notification"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const QUERY_KEYS = {
  product: productKeys,
  timedeal: timedealKeys,
  cart: cartKeys,
  order: orderKeys,
  pet: petKeys,
  address: addressKeys,
  review: reviewKeys,
  payment: paymentKeys,
  notification: notificationKeys,
  user: userKeys,
} as const;
