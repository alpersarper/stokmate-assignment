import { formatKurus, type ProductListParams } from '@stokmate/shared';
import { ChevronRightIcon, Loader2Icon, PackageOpenIcon, SearchIcon, SearchXIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
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
import { StatusBadge, StockIndicator } from '@/products/product-display';
import { useBrands, useCategories, useProductList } from '@/products/queries';

const PAGE_SIZE = 20;

function intParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
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
  const page = intParam(searchParams.get('page')) ?? 1;
  const filtersActive = q !== '' || categoryId !== undefined || brandId !== undefined;

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
    page,
    pageSize: PAGE_SIZE,
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

  // A failed refetch keeps the previous results visible (keepPreviousData) and
  // surfaces the failure as a snackbar instead of destroying the page (UX-006).
  const lastToastedErrorRef = useRef(0);
  useEffect(() => {
    if (listQuery.isError && data && listQuery.errorUpdatedAt !== lastToastedErrorRef.current) {
      lastToastedErrorRef.current = listQuery.errorUpdatedAt;
      toast.error(t('listRefreshFailed'));
    }
  }, [listQuery.isError, listQuery.errorUpdatedAt, data, t]);

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
      next.delete('page');
    });
  };

  const showRefetchSpinner = listQuery.isFetching && !listQuery.isPending;

  return (
    <div className="flex flex-col gap-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{t('productsTitle')}</h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {t('productCount', { count: data.total })}
          </span>
        )}
        {showRefetchSpinner && (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />
        )}
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
          <Button variant="outline" onClick={() => void listQuery.refetch()}>
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
                  <TableHead>{t('colName')}</TableHead>
                  <TableHead>{t('colCategory')}</TableHead>
                  <TableHead>{t('colBrand')}</TableHead>
                  <TableHead className="text-right">{t('colPrice')}</TableHead>
                  <TableHead className="text-right">{t('colStock')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((product) => (
                  <TableRow
                    key={product.id}
                    tabIndex={0}
                    aria-label={t('openProduct', { name: product.name })}
                    className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
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
                      <StockIndicator stock={product.stock} minStock={product.minStock} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
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

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-1.5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
