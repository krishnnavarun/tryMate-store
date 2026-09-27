import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router';
import { createProduct, updateProduct } from '../../api/admin.js';
import { fetchProduct } from '../../api/products.js';
import SizeChartEditor from '../../components/admin/SizeChartEditor.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import { useApi } from '../../hooks/useApi.js';
import { EMPTY_FORM, toFormState, toProductBody } from '../../utils/productForm.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

// /admin/products/new and /admin/products/:slug/edit
export default function AdminProductFormPage() {
  const { slug } = useParams();
  const { data: product, loading, error } = useApi(
    (signal) => (slug ? fetchProduct(slug, { signal }) : Promise.resolve(null)),
    [slug ?? null],
  );
  usePageTitle(slug ? `Edit ${product?.name ?? 'product'}` : 'New product');

  if (slug && loading) return <Spinner className="py-24" />;
  if (slug && error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage title="Product not found" message={error.userMessage} />
      </div>
    );
  }
  // key: fresh form state per product
  return <ProductForm key={product?._id ?? 'new'} product={product} />;
}

function Section({ title, children }) {
  return (
    <section className="animate-rise rounded-[28px] border border-sand bg-white p-6 sm:p-8">
      <h2 className="heading-display mb-5 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink transition-colors hover:border-gray-300 focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none"
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductForm({ product }) {
  const [form, setForm] = useState(() => (product ? toFormState(product) : EMPTY_FORM));
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);
  const navigate = useNavigate();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const field = (name) => ({ name, value: form[name], onChange: (e) => set({ [name]: e.target.value }) });

  async function handleSubmit(event) {
    event.preventDefault();
    const { body, error } = toProductBody(form);
    if (error) return setProblem(error);
    setSaving(true);
    setProblem(null);
    try {
      const saved = product ? await updateProduct(product._id, body) : await createProduct(body);
      toast.success(product ? 'Product saved' : 'Product created');
      navigate(`/products/${saved.slug}`);
    } catch (err) {
      setProblem(err.userMessage);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/admin/products" className="link-underline text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase hover:text-ink">
        ← All products
      </Link>
      <h1 className="heading-display mt-2 text-5xl">
        {product ? `Edit: ${product.name}` : 'New product'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required maxLength={120} {...field('name')} />
            <FormField label="Brand" required maxLength={80} {...field('brand')} />
            <FormField
              label="Slug (URL name)"
              maxLength={140}
              placeholder="made from the name if empty"
              hint="Lowercase letters, digits and dashes."
              {...field('slug')}
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Category"
                value={form.category}
                onChange={(v) => set({ category: v })}
                options={[['upper_body', 'Upper body'], ['lower_body', 'Lower body'], ['dresses', 'Dresses']]}
              />
              <Select
                label="Type"
                value={form.type}
                onChange={(v) => set({ type: v })}
                options={[['shirt', 'Shirt'], ['tshirt', 'T-shirt'], ['polo', 'Polo']]}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={(v) => set({ gender: v })}
                options={[['men', 'Men'], ['women', 'Women'], ['unisex', 'Unisex']]}
              />
            </div>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">Description</span>
              <textarea
                rows={3}
                maxLength={4000}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                className="block w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink transition-colors hover:border-gray-300 focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none"
              />
            </label>
          </div>
        </Section>

        <Section title="Price (₹)">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Price" type="number" min="1" step="1" required {...field('price')} />
            <FormField label="Discount price (optional)" type="number" min="1" step="1" {...field('discountPrice')} />
          </div>
        </Section>

        <Section title="Colours">
          <div className="space-y-2">
            {form.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`Color ${i + 1}`}
                  value={c.hex}
                  onChange={(e) => set({ colors: form.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                  className="h-11 w-12 cursor-pointer rounded-xl border border-sand bg-white p-1"
                />
                <input
                  aria-label={`Color ${i + 1} name`}
                  placeholder="Name, e.g. Navy"
                  required
                  maxLength={40}
                  value={c.name}
                  onChange={(e) => set({ colors: form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  className="w-48 rounded-xl border border-sand bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
                />
                <code className="text-xs text-gray-500">{c.hex.toUpperCase()}</code>
                <button
                  type="button"
                  disabled={form.colors.length === 1}
                  onClick={() => set({ colors: form.colors.filter((_, j) => j !== i) })}
                  className="ml-auto text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase hover:text-red-600 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ colors: [...form.colors, { name: '', hex: '#9E9E9E' }] })}
              className="btn-secondary btn-sm"
            >
              + Add colour
            </button>
          </div>
        </Section>

        <Section title="Images">
          <p className="mb-3 text-xs text-gray-500">
            Display image URLs, ideally one per colour, in the same order as the colours above.
          </p>
          <div className="space-y-2">
            {form.images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                {url ? (
                  <img src={url} alt="" className="h-12 w-9 shrink-0 rounded-md bg-bone object-cover" />
                ) : (
                  <span className="h-12 w-9 shrink-0 rounded-md bg-bone" />
                )}
                <input
                  aria-label={`Image ${i + 1} URL`}
                  type="url"
                  required={i === 0}
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => set({ images: form.images.map((x, j) => (j === i ? e.target.value : x)) })}
                  className="flex-1 rounded-xl border border-sand bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  disabled={form.images.length === 1}
                  onClick={() => set({ images: form.images.filter((_, j) => j !== i) })}
                  className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase hover:text-red-600 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ images: [...form.images, ''] })}
              className="btn-secondary btn-sm"
            >
              + Add image
            </button>
          </div>

          <div className="mt-6 flex items-start gap-3">
            {form.garmentImageUrl && (
              <img src={form.garmentImageUrl} alt="" className="h-20 w-16 shrink-0 rounded-md bg-bone object-cover" />
            )}
            <FormField
              label="Garment image URL (for try-on)"
              type="url"
              required
              className="flex-1"
              placeholder="https://…"
              hint="A clean flat-lay photo of the garment alone on a plain background. The AI try-on uses this."
              {...field('garmentImageUrl')}
            />
          </div>

          <FormField
            label="Fitting room cut-out (optional)"
            type="url"
            className="mt-4"
            placeholder="https://…/garment.png"
            hint="A transparent PNG of the garment from the front, sleeves included. The live fitting room draws it on the shopper; without it, a drawn shape in the product colour is used."
            {...field('overlayImageUrl')}
          />
        </Section>

        <Section title="Size chart and stock">
          <SizeChartEditor rows={form.sizes} onChange={(sizes) => set({ sizes })} />
        </Section>

        {problem && <p className="animate-rise rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{problem}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
          <Link to="/admin/products" className="link-underline self-center px-2 text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
