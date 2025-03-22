import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
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
      entry: `${__dirname}/../lambdas/getDriverById.ts`, // Specify the entry file
      bundling: {
        forceDockerBundling: false, // Disable Docker bundling
      },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAllDriversFn = new lambdanode.NodejsFunction(this, "GetAllDriversFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllDrivers.ts`, // Specify the entry file
      bundling: {
        forceDockerBundling: false, // Disable Docker bundling
      },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "F1Api", {
      restApiName: "Formula 1 API",
      description: "API for managing Formula 1 drivers and teams.",
    });

    // driver's' resource
    const driversResource = api.root.addResource("drivers");
    //resource and method for the GET /drivers/{team}/{driverId} endpoint
    const driverResource = driversResource
      .addResource("{team}")
      .addResource("{driverId}");

    driverResource.addMethod("GET", new apigateway.LambdaIntegration(getDriverByIdFn));
    driversResource.addMethod("GET", new apigateway.LambdaIntegration(getAllDriversFn));

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
    driversTable.grantReadData(getAllDriversFn);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "The URL of the API Gateway endpoint",
    });
  }
}