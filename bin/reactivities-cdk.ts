#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ReactivitiesCDKPipelineStack } from '../lib/cdk/reactivities-cdk-pipeline-stack';
import { ReactivitiesInfrastructureStack } from '../lib/infrastructure/reactivities-infrastructure-stack';

const app = new cdk.App();

// one-time infrastructure stack for the application (ECR, ECS [])
new ReactivitiesInfrastructureStack(app, 'ReactivitiesInfrastructureStack');

// self-mutating stack + CI/CD-specific stack
new ReactivitiesCDKPipelineStack(app, 'ReactivitiesCDKPipelineStack');
