import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb"; // Import the marshall function
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Driver } from "../shared/types"; // Import the Driver type

const client = new DynamoDBClient({ region: process.env.REGION });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  // Parse the request body and validate it against the Driver type
  let driver: Driver;
  try {
    driver = JSON.parse(event.body) as Driver;

    // Validate required fields
    if (!driver.team || !driver.driverId || !driver.driverName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: team, driverId, or driverName" }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  // Prepare the DynamoDB PutItem command
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: marshall(driver), // Use marshall to convert the Driver object to DynamoDB format
  };

  try {
    await client.send(new PutItemCommand(params));
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Driver added successfully", driver }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};