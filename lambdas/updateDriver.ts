import { DynamoDBClient, UpdateItemCommand, ReturnValue } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb"; // Import marshall to convert JavaScript objects to DynamoDB format

const client = new DynamoDBClient({ region: process.env.REGION });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const team = event.pathParameters?.team;
  const driverId = event.pathParameters?.driverId;

  if (!team || !driverId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing team or driverId in path" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  // Parse the request body
  const body = JSON.parse(event.body);

  // Validate required fields
  if (!body.driverName || !body.nationality || !body.carNumber || !body.points || !body.description || !body.isActive) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields in request body" }),
    };
  }

  // Prepare the DynamoDB UpdateItem command
  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      team: { S: team },
      driverId: { S: driverId },
    },
    UpdateExpression: "SET driverName = :driverName, nationality = :nationality, carNumber = :carNumber, points = :points, description = :description, isActive = :isActive",
    ExpressionAttributeValues: marshall({
      ":driverName": body.driverName,
      ":nationality": body.nationality,
      ":carNumber": body.carNumber,
      ":points": body.points,
      ":description": body.description,
      ":isActive": body.isActive,
    }),
    ReturnValues: ReturnValue.ALL_NEW, // Use the ReturnValue enum
  };

  try {
    const data = await client.send(new UpdateItemCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Driver updated successfully", driver: data.Attributes }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};