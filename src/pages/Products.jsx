import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../api.js'
import { useAuth } from '../auth.jsx'
import { Mark } from '../components/Brand.jsx'
import ProductForm from '../components/ProductForm.jsx'
import {
  Banner, Button, Modal, Spinner, ToastStack, WAKING_UP, useSlowNotice, useToasts,
} from '../components/ui.jsx'

const LOW_STOCK = 5
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const count = new Intl.NumberFormat('en-PH')

// The API stores UTC "YYYY-MM-DD HH:MM:SS"; show it in Manila time.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(String(value).replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function statusOf(quantity) {
  if (quantity === 0) return 'out'
  if (quantity <= LOW_STOCK) return 'low'
  return 'ok'
}

function Stock({ quantity }) {
  const status = statusOf(quantity)
  const look = {
    out: ['bg-bad-bg text-bad', 'Out of stock'],
    low: ['bg-warn-bg text-warn', `Low, ${quantity} left`],
    ok: ['bg-ok-bg text-ok', 'In stock'],
  }[status]
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums font-medium">{count.format(quantity)}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${look[0]}`}>{look[1]}</span>
    </span>
  )
}

const FILTERS = [
  ['all', 'All'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
]

export default function Products() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { toasts, push } = useToasts()
  const slow = useSlowNotice(loading)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await api.get('/products')
      setProducts(res.data.data ?? [])
    } catch (err) {
      setLoadError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const closeEditor = useCallback(() => setEditing(null), [])
  const closeDelete = useCallback(() => { if (!deleteBusy) setDeleting(null) }, [deleteBusy])

  const totals = useMemo(() => ({
    items: products.length,
    units: products.reduce((n, p) => n + p.quantity, 0),
    low: products.filter((p) => statusOf(p.quantity) !== 'ok').length,
    value: products.reduce((n, p) => n + p.price * p.quantity, 0),
  }), [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (filter === 'low' && statusOf(p.quantity) !== 'low') return false
      if (filter === 'out' && statusOf(p.quantity) !== 'out') return false
      if (!q) return true
      return p.product_name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    })
  }, [products, query, filter])

  async function save(payload) {
    if (editing && editing !== 'new') {
      await api.put(`/products/${editing.id}`, payload)
      push('Product updated.')
    } else {
      await api.post('/products', payload)
      push('Product added.')
    }
    setEditing(null)
    await load()
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await api.delete(`/products/${deleting.id}`)
      push('Product deleted.')
      setDeleting(null)
      await load()
    } catch (err) {
      push(errorMessage(err), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const hasProducts = products.length > 0

  return (
    <div className="min-h-screen">
      <nav className="bg-panel text-panel-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <Mark />
            <span className="font-heading text-xl">StokPile</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-panel-muted sm:inline">{user?.username || user?.email}</span>
            <Button variant="secondary" className="!border-panel-muted/40 !bg-transparent !text-panel-ink hover:!bg-panel-2" onClick={logout}>Log out</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-heading text-3xl">Stock</h1>
          <Button onClick={() => setEditing('new')}>Add product</Button>
        </header>

        {hasProducts && (
          <dl className="mb-6 grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4 sm:divide-x">
            {[
              ['Products', count.format(totals.items)],
              ['Units on hand', count.format(totals.units)],
              ['Need restocking', count.format(totals.low)],
              ['Inventory value', peso.format(totals.value)],
            ].map(([label, value], i) => (
              <div key={label} className={`px-5 py-4 ${i > 1 ? 'border-t border-line sm:border-t-0' : ''} ${i === 1 ? 'border-l border-line sm:border-l-0' : ''} ${i === 3 ? 'border-l border-line sm:border-l-0' : ''}`}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className={`font-heading mt-1 text-2xl tabular-nums ${label === 'Need restocking' && totals.low > 0 ? 'text-accent-text' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {hasProducts && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="search" className="sr-only">Search products</label>
              <input
                id="search"
                type="search"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted hover:border-muted"
              />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter by stock">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    filter === key ? 'border-panel bg-panel text-panel-ink' : 'border-line bg-surface text-ink hover:bg-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadError && (
          <Banner kind="error" action={<Button variant="secondary" onClick={load}>Retry</Button>}>{loadError}</Banner>
        )}

        {loading && !hasProducts ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted" role="status">
            <Spinner className="size-6" />
            <span>Loading products…</span>
            {slow && <span className="text-sm">{WAKING_UP}</span>}
          </div>
        ) : !loadError && !hasProducts ? (
          <div className="rounded-xl border border-dashed border-line bg-surface py-16 text-center">
            <Mark className="mx-auto mb-3 size-10 text-muted" />
            <p className="font-heading mb-1 text-xl">No products yet</p>
            <p className="mb-5 text-sm text-muted">Add your first product to start tracking stock.</p>
            <Button onClick={() => setEditing('new')}>Add product</Button>
          </div>
        ) : hasProducts && visible.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface py-12 text-center text-muted">
            <p>No products match.</p>
            <button type="button" className="mt-2 font-semibold text-accent-text underline" onClick={() => { setQuery(''); setFilter('all') }}>Clear search and filter</button>
          </div>
        ) : hasProducts ? (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Product</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
                    <th scope="col" className="px-4 py-3 font-medium">Stock</th>
                    <th scope="col" className="px-4 py-3 font-medium">Added</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((p) => (
                    <tr key={p.id} className={statusOf(p.quantity) === 'ok' ? '' : 'bg-warn-bg/30'}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.product_name}</div>
                        {p.description && <div className="max-w-sm truncate text-muted">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{peso.format(p.price)}</td>
                      <td className="px-4 py-3"><Stock quantity={p.quantity} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" onClick={() => setEditing(p)} aria-label={`Edit ${p.product_name}`}>Edit</Button>
                          <Button variant="ghost" className="!text-bad" onClick={() => setDeleting(p)} aria-label={`Delete ${p.product_name}`}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {visible.map((p) => (
                <li key={p.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{p.product_name}</p>
                      {p.description && <p className="mt-0.5 text-sm text-muted">{p.description}</p>}
                    </div>
                    <p className="font-semibold tabular-nums">{peso.format(p.price)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <Stock quantity={p.quantity} />
                    <span className="text-muted">{formatDate(p.created_at)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setEditing(p)} aria-label={`Edit ${p.product_name}`}>Edit</Button>
                    <Button variant="secondary" className="flex-1 !text-bad" onClick={() => setDeleting(p)} aria-label={`Delete ${p.product_name}`}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add product' : 'Edit product'} onClose={closeEditor}>
          <ProductForm product={editing === 'new' ? null : editing} onSave={save} onCancel={closeEditor} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete product?" onClose={closeDelete}>
          <p className="mb-6 text-sm text-muted">
            “{deleting.product_name}” will be permanently removed. This can't be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeDelete} disabled={deleteBusy}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy && <Spinner />}
              Delete
            </Button>
          </div>
        </Modal>
      )}

      <ToastStack toasts={toasts} />
    </div>
  )
}
