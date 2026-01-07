/**
 * MSW Browser Setup
 * Initialize MSW for browser environment
 */

// @ts-ignore - MSW types may not be available during build
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
