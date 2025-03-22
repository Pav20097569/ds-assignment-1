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

  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "team = :team",
    ExpressionAttributeValues: {
      ":team": { S: team },
    },
  };

  try {
    const data = await client.send(new QueryCommand(params));
    const drivers = data.Items?.map((item) => unmarshall(item)) || [];
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