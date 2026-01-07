/**
 * Operator Repository Interface
 * 
 * Defines the contract for operator-related data operations.
 * Currently using MSW for mocking, but this interface prepares for
 * future migration to a clean architecture with repository pattern.
 */

export interface OperatorRepo {
  // Station operations
  getAssignedStations(): Promise<unknown[]>
  getStationById(id: string): Promise<unknown>
  updateStationStatus(id: string, status: string): Promise<unknown>

  // Session management
  getActiveSessions(): Promise<unknown[]>
  getSessionById(id: string): Promise<unknown>
  getSessionsByStation(stationId: string): Promise<unknown[]>

  // Incidents & dispatches
  getIncidents(filters?: unknown): Promise<unknown[]>
  createIncident(data: unknown): Promise<unknown>
  updateIncident(id: string, data: unknown): Promise<unknown>

  getDispatches(filters?: unknown): Promise<unknown[]>
  createDispatch(data: unknown): Promise<unknown>
  updateDispatch(id: string, data: unknown): Promise<unknown>

  // Team management
  getTeamMembers(): Promise<unknown[]>
  assignTeamMember(stationId: string, userId: string): Promise<unknown>

  // Reports
  getReports(period?: string): Promise<unknown>
  getStationReports(stationId: string): Promise<unknown>
}
