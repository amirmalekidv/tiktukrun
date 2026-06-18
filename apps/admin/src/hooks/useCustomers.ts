'use client'
import useSWR from 'swr'
import { customersApi } from '@/lib/api/customers'
import type { CustomerFilterParams } from '@/types'

export function useCustomers(params?: CustomerFilterParams) {
  const key = params ? ['customers', JSON.stringify(params)] : 'customers'
  return useSWR(key, () => customersApi.list(params), { revalidateOnFocus: false })
}

export function useCustomer(id: string) {
  return useSWR(id ? `customer-${id}` : null, () => customersApi.get(id))
}

export function useCustomerBookings(id: string) {
  return useSWR(id ? `customer-bookings-${id}` : null, () => customersApi.getBookings(id))
}

export function useCustomerTransactions(id: string) {
  return useSWR(id ? `customer-txns-${id}` : null, () => customersApi.getTransactions(id))
}

export function useCustomerReviews(id: string) {
  return useSWR(id ? `customer-reviews-${id}` : null, () => customersApi.getReviews(id))
}

export function useCustomerNotes(id: string) {
  return useSWR(id ? `customer-notes-${id}` : null, () => customersApi.getNotes(id))
}
