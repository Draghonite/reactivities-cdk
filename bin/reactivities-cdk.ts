#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CICDPipelineStack } from '../lib/reactivities-cicd-pipeline-stack';

const app = new cdk.App();
new CICDPipelineStack(app, 'ReactivitiesCICDPipelineStack');
