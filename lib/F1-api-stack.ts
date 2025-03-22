import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as custom from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
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
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAllDriversFn = new lambdanode.NodejsFunction(this, "GetAllDriversFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllDrivers.ts`,
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const addDriverFn = new lambdanode.NodejsFunction(this, "AddDriverFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addDriver.ts`,
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getDriversByTeamFn = new lambdanode.NodejsFunction(this, "GetDriversByTeamFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getDriversByTeam.ts`,
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: driversTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateDriverFn = new lambdanode.NodejsFunction(this, "UpdateDriverFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateDriver.ts`,
      bundling: { forceDockerBundling: false },
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

    // Add the /drivers resource
    const driversResource = api.root.addResource("drivers");

    // Add the /drivers/{team} resource
    const driversByTeamResource = driversResource.addResource("{team}");

    // Add the /drivers/{team}/{driverId} resource
    const driverResource = driversByTeamResource.addResource("{driverId}");

    // Add methods to the resources
    driversResource.addMethod("GET", new apigateway.LambdaIntegration(getAllDriversFn));
    driversResource.addMethod("POST", new apigateway.LambdaIntegration(addDriverFn));
    driversByTeamResource.addMethod("GET", new apigateway.LambdaIntegration(getDriversByTeamFn));
    driverResource.addMethod("GET", new apigateway.LambdaIntegration(getDriverByIdFn), {
      requestParameters: {
        "method.request.querystring.language": false, // Optional query parameter
      },
    });
    driverResource.addMethod("PUT", new apigateway.LambdaIntegration(updateDriverFn));

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
    driversTable.grantWriteData(addDriverFn);
    driversTable.grantReadData(getDriversByTeamFn);
    driversTable.grantWriteData(updateDriverFn);

    // Grant the Lambda function permission to use AWS Translate and Comprehend
    const translatePolicy = new iam.PolicyStatement({
      actions: [
        "translate:TranslateText",
        "comprehend:DetectDominantLanguage", // Add this permission
      ],
      resources: ["*"], // Consider restricting this to specific resources if possible
    });
    getDriverByIdFn.addToRolePolicy(translatePolicy);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "The URL of the API Gateway endpoint",
    });
  }
}