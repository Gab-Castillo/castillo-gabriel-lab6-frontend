import { Link } from 'react-router-dom'
import { Pile, Wordmark } from './Brand.jsx'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link to="/" aria-label="StokPile home" className="w-fit text-ink"><Wordmark /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-heading text-4xl">{title}</h1>
          <p className="mt-2 mb-8 text-muted">{subtitle}</p>
          {children}
          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </main>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-panel p-12 text-panel-ink lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-accent/15" aria-hidden="true" />
        <p className="font-heading relative max-w-md text-4xl leading-tight">Know what is on the shelf before the customer asks.</p>
        <Pile className="relative mx-auto w-full max-w-md" />
        <p className="relative max-w-sm text-sm text-panel-muted">
          Add products, track quantities and spot low stock in one place.
        </p>
      </aside>
    </div>
  )
}
