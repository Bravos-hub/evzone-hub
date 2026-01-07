/**
 * Admin Repository Interface
 * 
 * Defines the contract for admin-related data operations.
 * Currently using MSW for mocking, but this interface prepares for
 * future migration to a clean architecture with repository pattern.
 */

export interface AdminRepo {
  // User management
  getAllUsers(): Promise<unknown[]>
  getUserById(id: string): Promise<unknown>
  createUser(data: unknown): Promise<unknown>
  updateUser(id: string, data: unknown): Promise<unknown>
  deleteUser(id: string): Promise<void>

  // Organization management
  getAllOrganizations(): Promise<unknown[]>
  getOrganizationById(id: string): Promise<unknown>
  createOrganization(data: unknown): Promise<unknown>

  // System management
  getSystemHealth(): Promise<unknown>
  getAuditLogs(filters?: unknown): Promise<unknown[]>
  getAnalytics(period?: string): Promise<unknown>
}
