/**
 * MSW Browser Setup
 * Initialize MSW for browser environment
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
