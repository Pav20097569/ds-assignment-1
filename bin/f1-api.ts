#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { F1APIStack } from "../lib/F1-api-stack";

const app = new cdk.App();
new F1APIStack(app, "F1APIStack", { env: { region: "eu-west-1" } });
