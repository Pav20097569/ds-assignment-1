import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb"; // Import unmarshall to convert DynamoDB items to JavaScript objects

const client = new DynamoDBClient({ region: process.env.REGION });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const team = event.pathParameters?.team;

  if (!team) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing team in path" }),
    };
  }

  // Parse query parameters
  const isActive = event.queryStringParameters?.isActive;
  const nationality = event.queryStringParameters?.nationality;

  // Build the DynamoDB query parameters
  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "team = :team",
    ExpressionAttributeValues: {
      ":team": { S: team },
    },
  };

  try {
    const data = await client.send(new QueryCommand(params));
    let drivers = data.Items?.map((item) => unmarshall(item)) || [];

    // Apply filters based on query parameters
    if (isActive !== undefined) {
      drivers = drivers.filter((driver) => driver.isActive === (isActive === "true"));
    }
    if (nationality) {
      drivers = drivers.filter((driver) => driver.nationality === nationality);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(drivers),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};