import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });
const translateClient = new TranslateClient({ region: process.env.REGION });

interface Driver {
  team: string;
  driverId: string;
  name: string;
  description: string;
  [key: string]: any; // Allow additional fields
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const team = event.pathParameters?.team;
  const driverId = event.pathParameters?.driverId;
  const language = event.queryStringParameters?.language;

  // Input validation
  if (!team || !driverId || !language) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing team, driverId, or language in request" }),
    };
  }

  // Validate language code (example: must be 2 characters)
  if (!/^[a-zA-Z]{2}$/.test(language)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid language code. Must be a 2-letter code (e.g., 'en', 'es')" }),
    };
  }

  // Fetch the driver from DynamoDB
  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      team: { S: team },
      driverId: { S: driverId },
    },
  };

  try {
    const data = await dynamoDbClient.send(new GetItemCommand(params));
    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Driver not found" }),
      };
    }

    const driver = unmarshall(data.Item) as Driver;

    // Translate the description field
    const translateParams = {
      Text: driver.description,
      SourceLanguageCode: "auto", // Automatically detect the source language
      TargetLanguageCode: language.toUpperCase(), // Target language
    };

    const translation = await translateClient.send(new TranslateTextCommand(translateParams));

    // Return the driver with the translated description
    return {
      statusCode: 200,
      body: JSON.stringify({
        ...driver,
        translatedDescription: translation.TranslatedText,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};