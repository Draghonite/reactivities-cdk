#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ReactivitiesCDKPipelineStack } from '../lib/reactivities-cdk-pipeline-stack';

const app = new cdk.App();
new ReactivitiesCDKPipelineStack(app, 'ReactivitiesCDKPipelineStack');
