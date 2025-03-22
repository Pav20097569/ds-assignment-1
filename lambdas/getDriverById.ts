import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: Handler = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", JSON.stringify(event?.pathParameters));
    const parameters = event?.pathParameters;
    const team = parameters?.team;
    const driverId = parameters?.driverId;
    const language = event?.queryStringParameters?.language;

    // Input validation
    if (!team || !driverId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing team or driverId" }),
      };
    }

    // Fetch the driver from DynamoDB
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { team, driverId },
      })
    );
    console.log("GetCommand response: ", commandOutput);

    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Driver not found" }),
      };
    }

    const driver = commandOutput.Item;

    // Translate the description if a language is provided
    if (language) {
      const translateParams = {
        Text: driver.description,
        SourceLanguageCode: "auto", // Automatically detect the source language
        TargetLanguageCode: language.toUpperCase(), // Target language
      };

      const translation = await translateClient.send(new TranslateTextCommand(translateParams));
      driver.translatedDescription = translation.TranslatedText;
    }

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ data: driver }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}