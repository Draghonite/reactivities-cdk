import { DeployStage } from './stages/deploy-stage';
import { SourceStage } from './stages/source-stage';
import { Construct } from 'constructs';
import { IPipelineConfigProps } from '../shared/config';
import { PipelineConfig } from './../../config/pipeline-config';
import { BuildStage } from './stages/build-stage';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class ReactivitiesCICDPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // TODO: make this a configurable and more integral part of the naming strategy for all the application-scoped (and infrastructure-scoped, if appropriate) resources created
        const appName = this.node.tryGetContext("appName");
        
        // TODO: see about patching overrides passed in through props (the stack's props)
        const pipelineConfig: IPipelineConfigProps = PipelineConfig;
        
        const bucket = new Bucket(this, pipelineConfig.bucketIdentifier);
        const pipeline = new Pipeline(this, pipelineConfig.pipelineIdentifier, {
            pipelineName: pipelineConfig.pipelineName,
            artifactBucket: bucket
        });

        // Source Stage
        const sourceAction = new SourceStage(this, pipelineConfig).action;
        const sourceOutput: Artifact = sourceAction.actionProperties.outputs![0];
        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction]
        });
        
        // Build Stage
        const buildAction = new BuildStage(this, pipelineConfig, sourceOutput, bucket).action;
        const buildOutput: Artifact = buildAction.actionProperties.outputs![0];
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction]
        });
    
        // Deploy to Integration/Staging/Pre-Prod
        const deployAction = new DeployStage(this, pipelineConfig, buildOutput, "dev").action;
        pipeline.addStage({
            stageName: 'Deploy',
            actions: [deployAction]
        });

        // Manual Approval Stage
        // TODO: 

        // Deploy to Prod
        // TODO: 

        // Notifications for the pipeline events
        // TODO: 
    }
}