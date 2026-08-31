import {
  formatKurus,
  statusLabel,
  type Locale,
  type ProductListParams,
  type ProductSortField,
  type ProductStatus,
  type SortDirection,
} from '@stokmate/shared';
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon, ChevronsUpDownIcon, PackageOpenIcon, SearchIcon, SearchXIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { FreshnessControl } from '@/components/FreshnessControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/i18n';
import { useManualRefresh } from '@/lib/refresh';
import { StatusBadge, StockIndicator } from '@/products/product-display';
import { useBrands, useCategories, useProductList } from '@/products/queries';

const PAGE_SIZE = 20;

function intParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** WEB-001: status filter values mirror the wire contract (1|2|3); anything else = All. */
const STATUS_VALUES: ProductStatus[] = [1, 2, 3];

function statusParam(value: string | null): ProductStatus | undefined {
  const n = intParam(value);
  return n !== undefined && STATUS_VALUES.includes(n as ProductStatus)
    ? (n as ProductStatus)
    : undefined;
}

/** WEB-002: server-side sortable columns per the verified contract. */
const SORT_FIELDS: ProductSortField[] = ['name', 'price', 'stock', 'updatedAt'];
const DEFAULT_SORT: ProductSortField = 'name';
const DEFAULT_DIR: SortDirection = 'asc';

function sortParam(value: string | null): ProductSortField {
  return SORT_FIELDS.includes(value as ProductSortField)
    ? (value as ProductSortField)
    : DEFAULT_SORT;
}

export function ProductListPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // List state lives in the URL (UX-006): returning from detail and reloading
  // both preserve search, filters, and page.
  const q = searchParams.get('q') ?? '';
  const categoryId = intParam(searchParams.get('category'));
  const brandId = intParam(searchParams.get('brand'));
  const status = statusParam(searchParams.get('status'));
  const sort = sortParam(searchParams.get('sort'));
  const dir: SortDirection = searchParams.get('dir') === 'desc' ? 'desc' : DEFAULT_DIR;
  const page = intParam(searchParams.get('page')) ?? 1;
  const filtersActive =
    q !== '' || categoryId !== undefined || brandId !== undefined || status !== undefined;

  const updateParams = (mutate: (next: URLSearchParams) => void) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      },
      { replace: true },
    );
  };

  // Search input is local state debounced 300 ms into the URL (UX-001); the
  // typed text itself is never clobbered by request outcomes.
  const [searchText, setSearchText] = useState(q);
  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = searchText.trim();
      if (trimmed === q) return;
      updateParams((next) => {
        if (trimmed) next.set('q', trimmed);
        else next.delete('q');
        next.delete('page'); // search change resets pagination
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce reacts to typed text only
  }, [searchText, q]);

  const params: ProductListParams = {
    q: q || undefined,
    categoryId,
    brandId,
    status,
    // Server defaults (name asc) are omitted so the default dataset keeps its key shape.
    sort: sort === DEFAULT_SORT && dir === DEFAULT_DIR ? undefined : sort,
    dir: sort === DEFAULT_SORT && dir === DEFAULT_DIR ? undefined : dir,
    page,
    pageSize: PAGE_SIZE,
  };

  // WEB-002: header-click sorting, server-side only. Same field toggles
  // asc→desc; a new field starts asc. Any sort change restarts at page 1.
  const applySort = (field: ProductSortField) => {
    const nextDir: SortDirection = sort === field && dir === 'asc' ? 'desc' : 'asc';
    updateParams((next) => {
      if (field === DEFAULT_SORT && nextDir === DEFAULT_DIR) {
        next.delete('sort');
        next.delete('dir');
      } else {
        next.set('sort', field);
        next.set('dir', nextDir);
      }
      next.delete('page');
    });
  };
  const listQuery = useProductList(params);
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();

  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // Out-of-range page (e.g. stale URL after data changed): snap to the last page.
  useEffect(() => {
    if (data && data.total > 0 && data.items.length === 0 && page > totalPages) {
      updateParams((next) => next.set('page', String(totalPages)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to result shape only
  }, [data, page, totalPages]);

  // Page changes scroll the list back to the top (UX-006).
  const prevPageRef = useRef(page);
  useEffect(() => {
    if (prevPageRef.current !== page) {
      prevPageRef.current = page;
      window.scrollTo({ top: 0 });
    }
  }, [page]);

  // A failed refetch keeps the previous results visible (keepPreviousData);
  // the toolbar FreshnessControl states the failure and which snapshot is
  // shown (supersedes the earlier one-shot snackbar — persistent, and it
  // cannot spam on repeated poll failures).
  const { refresh, refreshDisabled } = useManualRefresh(listQuery);

  const openProduct = (id: number) => {
    // Carry the list URL so detail's back link restores this exact state.
    navigate(`/products/${String(id)}`, { state: { listSearch: location.search } });
  };

  const clearFilters = () => {
    setSearchText('');
    updateParams((next) => {
      next.delete('q');
      next.delete('category');
      next.delete('brand');
      next.delete('status'); // back to the web default: All
      next.delete('page');
    });
  };

  return (
    <div className="flex flex-col gap-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{t('productsTitle')}</h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {t(data.total === 1 ? 'productCountOne' : 'productCount', { count: data.total })}
          </span>
        )}
        <div className="ml-auto">
          <FreshnessControl
            dataUpdatedAt={listQuery.dataUpdatedAt}
            errorUpdatedAt={listQuery.errorUpdatedAt}
            isFetching={listQuery.isFetching}
            onRefresh={refresh}
            refreshDisabled={refreshDisabled}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            className="pr-8 pl-9"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText !== '' && (
            <button
              type="button"
              aria-label={t('clearSearch')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchText('')}
            >
              <XIcon className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <Select
          value={categoryId !== undefined ? String(categoryId) : 'all'}
          onValueChange={(value) =>
            updateParams((next) => {
              if (value === 'all') next.delete('category');
              else next.set('category', value);
              next.delete('page');
            })
          }
        >
          <SelectTrigger className="w-44" aria-label={t('categoryLabel')}>
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {(categoriesQuery.data ?? []).map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={brandId !== undefined ? String(brandId) : 'all'}
          onValueChange={(value) =>
            updateParams((next) => {
              if (value === 'all') next.delete('brand');
              else next.set('brand', value);
              next.delete('page');
            })
          }
        >
          <SelectTrigger className="w-44" aria-label={t('brandLabel')}>
            <SelectValue placeholder={t('allBrands')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allBrands')}</SelectItem>
            {(brandsQuery.data ?? []).map((brand) => (
              <SelectItem key={brand.id} value={String(brand.id)}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status !== undefined ? String(status) : 'all'}
          onValueChange={(value) =>
            updateParams((next) => {
              if (value === 'all') next.delete('status');
              else next.set('status', value);
              next.delete('page');
            })
          }
        >
          <SelectTrigger className="w-40" aria-label={t('colStatus')}>
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            {STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {statusLabel(value, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon className="size-4" aria-hidden />
            {t('clearFilters')}
          </Button>
        )}
      </div>

      {listQuery.isPending ? (
        <ListSkeleton />
      ) : listQuery.isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
          <TriangleAlertIcon className="size-8 text-destructive" aria-hidden />
          <p className="font-medium">{t('listErrorTitle')}</p>
          {/* Same protected pipeline as the toolbar refresh: spam-clicking
              Retry joins the in-flight request instead of restarting it. */}
          <Button variant="outline" onClick={refresh}>
            {t('retry')}
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        filtersActive ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
            <SearchXIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">{t('noResultsTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('noResultsBody')}</p>
            <Button variant="outline" onClick={clearFilters}>
              {t('clearFilters')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
            <PackageOpenIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">{t('emptyCatalogTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyCatalogBody')}</p>
          </div>
        )
      ) : data ? (
        <>
          <div
            className={`overflow-x-auto rounded-lg border border-border transition-opacity ${
              listQuery.isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="name" sort={sort} dir={dir} onSort={applySort}>
                    {t('colName')}
                  </SortableHead>
                  <TableHead>{t('colCategory')}</TableHead>
                  <TableHead>{t('colBrand')}</TableHead>
                  <SortableHead field="price" sort={sort} dir={dir} onSort={applySort} align="right">
                    {t('colPrice')}
                  </SortableHead>
                  <SortableHead field="stock" sort={sort} dir={dir} onSort={applySort} align="right">
                    {t('colStock')}
                  </SortableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <SortableHead field="updatedAt" sort={sort} dir={dir} onSort={applySort}>
                    {t('colUpdated')}
                  </SortableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((product) => (
                  <TableRow
                    key={product.id}
                    tabIndex={0}
                    aria-label={t('openProduct', { name: product.name })}
                    // Keyboard focus must be clearly visible (UX-006): the
                    // muted tint alone reads like hover, so add an inset ring.
                    className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset"
                    onClick={() => openProduct(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProduct(product.id);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.sku}</div>
                    </TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>{product.brandName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKurus(product.price, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockIndicator
                        stock={product.stock}
                        minStock={product.minStock}
                        align="right"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatUpdatedAt(product.updatedAt, locale)}
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('pageInfo', { page: data.page, pages: totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  updateParams((next) => {
                    if (page - 1 <= 1) next.delete('page');
                    else next.set('page', String(page - 1));
                  })
                }
              >
                {t('prevPage')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams((next) => next.set('page', String(page + 1)))}
              >
                {t('nextPage')}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * WEB-002 sortable column header. The whole head is a button; active state is
 * shown with a direction arrow and exposed via aria-sort on the header cell.
 */
function SortableHead({
  field,
  sort,
  dir,
  onSort,
  align,
  children,
}: {
  field: ProductSortField;
  sort: ProductSortField;
  dir: SortDirection;
  onSort: (field: ProductSortField) => void;
  align?: 'right';
  children: ReactNode;
}) {
  const active = sort === field;
  return (
    <TableHead
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={align === 'right' ? 'text-right' : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-2 ${
          active ? 'font-semibold text-foreground' : ''
        }`}
      >
        {children}
        {active ? (
          dir === 'asc' ? (
            <ArrowUpIcon className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownIcon className="size-3.5" aria-hidden />
          )
        ) : (
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/60" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

function formatUpdatedAt(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/**
 * Initial-load skeleton mirroring the real table (UX-004): same container,
 * real (localized) column headers — they don't depend on data — and
 * column-proportioned cell placeholders, so the loaded table lands without a
 * layout jump.
 */
function ListSkeleton() {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('colName')}</TableHead>
            <TableHead>{t('colCategory')}</TableHead>
            <TableHead>{t('colBrand')}</TableHead>
            <TableHead className="text-right">{t('colPrice')}</TableHead>
            <TableHead className="text-right">{t('colStock')}</TableHead>
            <TableHead>{t('colStatus')}</TableHead>
            <TableHead>{t('colUpdated')}</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }, (_, i) => (
            <TableRow key={i}>
              <TableCell className="w-[30%]">
                <Skeleton className="mb-1.5 h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="w-8" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
