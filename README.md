## Serverless REST Assignment - Distributed Systems.

__Name:__ Pawel Jaglarz

__Demo:__ (https://youtu.be/UYbRsv5CTKY)

### Context.


Context: Formula 1 Drivers and Teams

Table item attributes:

    team: string, // Partition key (e.g., "Mercedes")

    driverId: string, // Sort key (e.g., "HAM")

    driverName: string, // Full name of the driver (e.g., "Lewis Hamilton")

    nationality: string, // Nationality of the driver (e.g., "British")

    carNumber: number, // Car number (e.g., 44)

    points: number, // Total points scored by the driver

    description: string, // Description of the driver (e.g., "Seven-time World Champion")

    isActive: boolean // Indicates if the driver is currently active


### App API endpoints.

+ GET /drivers - Get all drivers.

+ GET /drivers/{team} - Get all drivers for a specific team.

+ GET /drivers/{team}/{driverId} - Get a specific driver by team and driver ID.

+ POST /drivers - Add a new driver.

+ PUT /drivers/{team}/{driverId} - Update a specific driver.

+ GET /drivers/{team}/{driverId}?language={lang} - Get a driver with a translated description (if available).


### Features.

1. Protected POST and PUT Endpoints with Cognito
POST /drivers and PUT /drivers/{team}/{driverId} endpoints are protected using Cognito User Pool Authorization.

Only authenticated users with a valid ID token can access these endpoints.

The ID token is passed in the Authorization header as a Bearer token.

Example Request:

bash
Copy
curl -X POST \
  https://<api-id>.execute-api.<region>.amazonaws.com/prod/drivers \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "team": "Mercedes",
        "driverId": "RUS",
        "driverName": "George Russell",
        "nationality": "British",
        "carNumber": 63,
        "points": 275,
        "description": "Rising star in Formula 1",
        "isActive": true
      }'

2. Seed Data for DynamoDB
The DynamoDB table is pre-populated with seed data

This ensures that the table contains initial data for testing and demonstration purposes.

Example Seed Data:

json
Copy
[
  {
    "team": "Mercedes",
    "driverId": "HAM",
    "driverName": "Lewis Hamilton",
    "nationality": "British",
    "carNumber": 44,
    "points": 413,
    "description": "Seven-time World Champion",
    "isActive": true
  },
  {
    "team": "Red Bull",
    "driverId": "VER",
    "driverName": "Max Verstappen",
    "nationality": "Dutch",
    "carNumber": 33,
    "points": 395,
    "description": "Two-time World Champion",
    "isActive": true
  }
]

3. IAM Least Privilege
IAM roles and policies are configured to grant the minimum required permissions for each Lambda function.

For example:

The GetDriverByIdFn Lambda function has read-only access to the DynamoDB table.

The AddDriverFn and UpdateDriverFn Lambda functions have write access to the DynamoDB table.

