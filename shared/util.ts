import { marshall } from "@aws-sdk/util-dynamodb";
import { Driver } from "./types";

/**
 * Generates a DynamoDB item for a driver.
 * @param driver - The driver object to convert to a DynamoDB item.
 * @returns DynamoDB item.
 */
export const generateDriverItem = (driver: Driver) => {
  return {
    PutRequest: {
      Item: marshall(driver),
    },
  };
};

/**
 * Generates a batch write request for DynamoDB.
 * @param drivers - Array of driver objects.
 * @returns Array of DynamoDB batch write requests.
 */
export const generateBatch = (drivers: Driver[]) => {
  return drivers.map((driver) => generateDriverItem(driver));
};