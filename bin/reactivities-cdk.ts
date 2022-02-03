#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReactivitiesCICDPipelineStack } from '../lib/reactivities-cicd-pipeline-stack';

const app = new cdk.App();
console.log(process.env.CDK_DEFAULT_ACCOUNT, process.env.CDK_DEFAULT_REGION);
new ReactivitiesCICDPipelineStack(app, 'reactivities-cicd-pipeline-stack', {});
