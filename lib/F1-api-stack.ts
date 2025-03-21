import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { drivers } from "../seed/drivers";

export class F1ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for Formula 1 Drivers
    const driversTable = new dynamodb.Table(this, "DriversTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "team", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "driverId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Formula1Drivers",
    });

    // Lambda Functions
    const getDriverByIdFn = new lambdanode.NodejsFunction(this, "GetDriverByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getDriverById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getDriversByTeamFn = new lambdanode.NodejsFunction(this, "GetDriversByTeamFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getDriversByTeam.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const addDriverFn = new lambdanode.NodejsFunction(this, "AddDriverFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addDriver.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateDriverFn = new lambdanode.NodejsFunction(this, "UpdateDriverFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateDriver.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const translateDescriptionFn = new lambdanode.NodejsFunction(this, "TranslateDescriptionFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/translateDescription.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Seed Data for DynamoDB Table
    new custom.AwsCustomResource(this, "DriversDDBInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [driversTable.tableName]: generateBatch(drivers),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("DriversDDBInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [driversTable.tableArn],
      }),
    });

    // Permissions
    driversTable.grantReadData(getDriverByIdFn);
    driversTable.grantReadData(getDriversByTeamFn);
    driversTable.grantWriteData(addDriverFn);
    driversTable.grantWriteData(updateDriverFn);
    driversTable.grantReadWriteData(translateDescriptionFn);
  }
}