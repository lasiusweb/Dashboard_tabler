import { describe, expect, it } from 'vitest'
import { cartTotals, checkPinCode, couponEligible, couponSavings, discountPercent, formatINR, isInStock, orderStatusStep, searchProducts } from './storefront'

describe('formatINR', () => {
  it('formats with en-IN grouping and rupee sign', () => {
    expect(formatINR(1115)).toBe('₹1,115')
    expect(formatINR(1234567)).toBe('₹12,34,567')
  })
})

describe('discountPercent', () => {
  it('rounds the savings off the MRP', () => {
    expect(discountPercent(1350, 1115)).toBe(17)
  })

  it('is 0 when there is no discount', () => {
    expect(discountPercent(100, 100)).toBe(0)
    expect(discountPercent(0, 50)).toBe(0)
  })
})

describe('isInStock', () => {
  it('treats null (untracked) as in stock', () => {
    expect(isInStock(null)).toBe(true)
    expect(isInStock(0)).toBe(false)
    expect(isInStock(5)).toBe(true)
  })
})

describe('checkPinCode', () => {
  const pincodes = [
    { pincode: '411001', zone: 'metro' as const, deliveryDays: 2, cod: true },
    { pincode: '845401', zone: 'rural' as const, deliveryDays: 7, cod: false },
  ]

  it('matches a known 6-digit pincode', () => {
    expect(checkPinCode('411001', pincodes)?.zone).toBe('metro')
    expect(checkPinCode(' 411001 ', pincodes)?.deliveryDays).toBe(2)
  })

  it('returns null for unknown or malformed pins', () => {
    expect(checkPinCode('999999', pincodes)).toBeNull()
    expect(checkPinCode('411', pincodes)).toBeNull()
    expect(checkPinCode('41100a', pincodes)).toBeNull()
  })
})

describe('couponSavings', () => {
  it('computes percent / fixed / free-shipping savings', () => {
    expect(couponSavings(1000, { type: 'percent', value: 10, minBasket: 500 }, 50)).toBe(100)
    expect(couponSavings(1000, { type: 'fixed', value: 200, minBasket: 500 }, 50)).toBe(200)
    expect(couponSavings(1000, { type: 'freeShipping', value: 0, minBasket: 500 }, 50)).toBe(50)
  })

  it('caps savings at the subtotal', () => {
    expect(couponSavings(100, { type: 'fixed', value: 200, minBasket: 50 }, 0)).toBe(100)
  })

  it('gates on the minimum basket', () => {
    expect(couponEligible(400, { type: 'percent', value: 10, minBasket: 500 })).toBe(false)
    expect(couponEligible(600, { type: 'percent', value: 10, minBasket: 500 })).toBe(true)
  })
})

describe('cartTotals', () => {
  it('totals lines, applies discount and fees, clamps at zero', () => {
    const lines = [
      { qty: 2, price: 1115 },
      { qty: 1, price: 245 },
    ]
    expect(cartTotals(lines, { delivery: 49, codFee: 0, discount: 100 })).toEqual({
      subtotal: 2475,
      discount: 100,
      delivery: 49,
      codFee: 0,
      total: 2424,
    })
    expect(cartTotals([{ qty: 1, price: 100 }], { delivery: 49, codFee: 20, discount: 500 })).toEqual({
      subtotal: 100,
      discount: 100,
      delivery: 49,
      codFee: 20,
      total: 69,
    })
  })
})

describe('searchProducts', () => {
  const products = [
    { name: 'DAP Fertilizer 50kg', brand: 'FirstCrop', tags: ['fertilizer'], categoryName: 'Fertilizers' },
    { name: 'Hybrid paddy seeds 10kg', brand: 'Basmati', tags: ['seeds', 'paddy'], categoryName: 'Seeds' },
  ]

  it('matches every token across name/brand/tags/category', () => {
    expect(searchProducts(products, 'fertilizer')).toHaveLength(1)
    expect(searchProducts(products, 'paddy seeds')).toHaveLength(1)
    expect(searchProducts(products, 'firstcrop')).toHaveLength(1)
    expect(searchProducts(products, 'seeds')).toHaveLength(1)
  })

  it('returns everything for an empty query', () => {
    expect(searchProducts(products, '  ')).toHaveLength(2)
  })

  it('returns nothing when no token matches', () => {
    expect(searchProducts(products, 'tractor')).toHaveLength(0)
  })
})

describe('orderStatusStep', () => {
  it('maps the four active statuses to 1..4', () => {
    expect(orderStatusStep('Placed')).toBe(1)
    expect(orderStatusStep('Packed')).toBe(2)
    expect(orderStatusStep('Shipped')).toBe(3)
    expect(orderStatusStep('Delivered')).toBe(4)
  })

  it('is 0 for cancelled/unknown statuses', () => {
    expect(orderStatusStep('Cancelled')).toBe(0)
    expect(orderStatusStep('RTO')).toBe(0)
  })
})
