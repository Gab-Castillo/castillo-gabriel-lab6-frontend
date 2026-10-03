import { useState } from 'react'
import { errorMessage, fieldErrors } from '../api.js'
import { Banner, Button, Spinner, TextField } from './ui.jsx'

function validate(v) {
  const e = {}
  const name = v.product_name.trim()
  if (!name) e.product_name = 'Enter a product name.'
  else if (name.length > 100) e.product_name = 'Use 100 characters or fewer.'
  const price = Number(v.price)
  if (v.price === '' || Number.isNaN(price)) e.price = 'Enter a price.'
  else if (price < 0 || price > 99999999.99) e.price = 'Price must be between 0 and 99,999,999.99.'
  const qty = Number(v.quantity)
  if (v.quantity === '' || !Number.isInteger(qty) || qty < 0) e.quantity = 'Use a whole number, 0 or more.'
  return e
}

export default function ProductForm({ product, onSave, onCancel }) {
  const [values, setValues] = useState({
    product_name: product?.product_name ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    quantity: product ? String(product.quantity) : '0',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await onSave({
        product_name: values.product_name.trim(),
        description: values.description.trim() || null,
        price: Number(values.price),
        quantity: Number(values.quantity),
      })
    } catch (err) {
      const fe = fieldErrors(err)
      if (Object.keys(fe).length) setErrors(fe)
      else setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error && <Banner kind="error">{error}</Banner>}
      <TextField label="Product name" value={values.product_name} onChange={set('product_name')} error={errors.product_name} maxLength={100} />
      <TextField label="Description (optional)" as="textarea" rows={3} value={values.description} onChange={set('description')} error={errors.description} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Price (₱)" type="number" inputMode="decimal" step="0.01" min="0" value={values.price} onChange={set('price')} error={errors.price} />
        <TextField label="Quantity" type="number" inputMode="numeric" step="1" min="0" value={values.quantity} onChange={set('quantity')} error={errors.quantity} />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner />}
          {product ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  )
}
