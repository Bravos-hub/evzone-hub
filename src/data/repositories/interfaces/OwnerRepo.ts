/**
 * Owner Repository Interface
 * 
 * Defines the contract for station owner-related data operations.
 * Currently using MSW for mocking, but this interface prepares for
 * future migration to a clean architecture with repository pattern.
 */

export interface OwnerRepo {
  // Station management
  getMyStations(): Promise<unknown[]>
  getStationById(id: string): Promise<unknown>
  createStation(data: unknown): Promise<unknown>
  updateStation(id: string, data: unknown): Promise<unknown>
  deleteStation(id: string): Promise<void>

  // Charge points
  getChargePoints(stationId: string): Promise<unknown[]>
  updateChargePoint(stationId: string, chargePointId: string, data: unknown): Promise<unknown>

  // Tariffs
  getTariffs(): Promise<unknown[]>
  createTariff(data: unknown): Promise<unknown>
  updateTariff(id: string, data: unknown): Promise<unknown>

  // Earnings & revenue
  getEarnings(period?: string): Promise<unknown>
  getRevenueStats(): Promise<unknown>

  // Bookings
  getBookings(filters?: unknown): Promise<unknown[]>
  getBookingById(id: string): Promise<unknown>
}
