export type Driver = {
    team: string, // Partition key (e.g., "Mercedes")
    driverId: string, // Sort key (e.g., "HAM")
    driverName: string, // Full name of the driver (e.g., "Lewis Hamilton")
    nationality: string, // Nationality of the driver (e.g., "British")
    carNumber: number, // Car number (e.g., 44)
    points: number, // Total points scored by the driver
    description: string, // Description of the driver (e.g., "Seven-time World Champion")
    isActive: boolean // Indicates if the driver is currently active
  }