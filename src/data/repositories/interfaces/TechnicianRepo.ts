/**
 * Technician Repository Interface
 * 
 * Defines the contract for technician-related data operations.
 * Currently using MSW for mocking, but this interface prepares for
 * future migration to a clean architecture with repository pattern.
 */

export interface TechnicianRepo {
  // Job management
  getMyJobs(filters?: unknown): Promise<unknown[]>
  getJobById(id: string): Promise<unknown>
  acceptJob(id: string): Promise<unknown>
  updateJobStatus(id: string, status: string, notes?: string): Promise<unknown>
  completeJob(id: string, data: unknown): Promise<unknown>

  // Availability
  setAvailability(available: boolean): Promise<void>
  getAvailability(): Promise<unknown>

  // Station maintenance
  getMaintenanceTasks(stationId?: string): Promise<unknown[]>
  createMaintenanceTask(data: unknown): Promise<unknown>
  updateMaintenanceTask(id: string, data: unknown): Promise<unknown>

  // Documents & reports
  getDocuments(jobId?: string): Promise<unknown[]>
  uploadDocument(jobId: string, file: unknown): Promise<unknown>

  // Settlements
  getSettlements(period?: string): Promise<unknown[]>
  getSettlementById(id: string): Promise<unknown>
}
