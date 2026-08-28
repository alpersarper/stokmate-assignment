// Wire types for the verified StokMate API. Source of truth: docs/API_CONTRACT.md.
// Do not add fields the contract does not verify.

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  /** UTC ISO-8601; issue time + 15 min. Informational only — the client refreshes reactively on 401. */
  expiresAt: string;
  user: UserDto;
}

/** unit: 1=Adet, 2=Kg, 3=Lt, 4=Paket */
export type Unit = 1 | 2 | 3 | 4;
/** status: 1=Aktif, 2=Pasif, 3=Üretim Durduruldu */
export type ProductStatus = 1 | 2 | 3;

/** The 16-field list DTO. No field is ever null; barcode may be "". Prices are integer kuruş. */
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  price: number;
  stock: number;
  minStock: number;
  unit: Unit;
  status: ProductStatus;
  isFeatured: boolean;
  updatedAt: string;
}

/** GET /products/{id} — list DTO plus the three PUT-critical fields. */
export interface ProductDetail extends Product {
  costPrice: number;
  supplierId: number;
  description: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  /** Effective page after server clamping (1-based). */
  page: number;
  /** Effective pageSize after server clamping (max 100). */
  pageSize: number;
}

export interface ProductStats {
  total: number;
  outOfStock: number;
  lowStock: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
}

export type ProductSortField = 'name' | 'price' | 'stock' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

/** All params optional and combinable (AND semantics). Single-value only — the API has no multi-select. */
export interface ProductListParams {
  q?: string;
  categoryId?: number;
  brandId?: number;
  status?: ProductStatus;
  sort?: ProductSortField;
  dir?: SortDirection;
  page?: number;
  pageSize?: number;
}

/**
 * PUT /products/{id} is a FULL REPLACE: omitted fields are reset to C# defaults, not preserved.
 * Every field here is required so the type system forbids partial bodies.
 * Always build this from a fresh GET /products/{id} plus the user's edits.
 */
export interface ProductUpdateBody {
  name: string;
  sku: string;
  barcode: string;
  categoryId: number;
  brandId: number;
  supplierId: number;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: Unit;
  status: ProductStatus;
  description: string;
  isFeatured: boolean;
}
