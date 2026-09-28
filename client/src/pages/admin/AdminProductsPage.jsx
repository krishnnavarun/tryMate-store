import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router';
import { deleteProduct } from '../../api/admin.js';
import { fetchProducts } from '../../api/products.js';
import Pagination from '../../components/ui/Pagination.jsx';
import ProductImage from '../../components/products/ProductImage.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import { useApi } from '../../hooks/useApi.js';
import { TYPE_LABELS, formatPrice } from '../../utils/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const { data, loading, error, reload } = useApi(
    (signal) => fetchProducts({ page, limit: 24, sort: 'name' }, { signal }),
    [page],
  );
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  usePageTitle('Admin · Products');

  async function handleDelete(product) {
    setDeleting(true);
    try {
      await deleteProduct(product._id);
      toast.success(`Deleted "${product.name}"`);
      setConfirmId(null);
      reload();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="heading-display mt-2 text-5xl">Products</h1>
          {data && <p className="mt-1 text-sm text-gray-500">{data.total} products</p>}
        </div>
        <div className="flex items-center gap-5">
          <Link to="/admin/orders" className="link-underline text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
            Orders
          </Link>
          <Link to="/admin/products/new" className="btn-primary btn-sm">
            + New product
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {loading && !data ? (
          <Spinner className="py-16" />
        ) : error ? (
          <StatusMessage title="Couldn't load products" message={error.userMessage} />
        ) : data.items.length === 0 ? (
          <StatusMessage title="No products yet" message="Create your first product, or run npm run seed." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sand bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-bone text-[11px] tracking-[0.14em] text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Colours</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((p) => (
                  <tr key={p._id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded-md bg-bone">
                          <ProductImage src={p.images[0]} alt="" name={p.name} type={p.type} hex={p.colors[0]?.hex} className="absolute inset-0 h-full w-full" />
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[p.type] ?? p.type}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatPrice(p.discountPrice ?? p.price)}
                      {p.discountPrice != null && (
                        <span className="ml-1 text-xs text-gray-500 line-through">{formatPrice(p.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.colors.map((c) => (
                          <span
                            key={c.name}
                            title={c.name}
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmId === p._id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-600">Delete?</span>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(p)}
                            className="rounded bg-red-600 px-2 py-1 font-medium text-white disabled:opacity-60"
                          >
                            Yes
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="px-2 py-1 font-medium">
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-3">
                          <Link to={`/products/${p.slug}`} className="font-medium text-gray-600 hover:text-brand">
                            View
                          </Link>
                          <Link to={`/admin/products/${p.slug}/edit`} className="font-medium text-brand hover:underline">
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmId(p._id)}
                            className="font-medium text-gray-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <div className="mt-8">
            <Pagination
              page={data.page}
              pages={data.pages}
              onPageChange={(p) => setSearchParams(p === 1 ? {} : { page: String(p) })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
