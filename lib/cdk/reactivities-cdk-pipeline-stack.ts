import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { SecretValue, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ReactivitiesCICDPipelineStack } from '../cicd/reactivities-cicd-pipeline-stack';

export class ReactivitiesCDKPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // create a pipeline for CDK and its stages (watch for code updates to the CDK stack and self-mutate and provision the CI/CD stack)
        /*
            - Synth
              - Source:GitHub url: https://github.com/Draghonite/reactivities-cdk
            - Deploy
        */

        const pipeline = new CodePipeline(this, 'ReactivitiesCDKPipeline', {
            pipelineName: 'ReactivitiesCDKPipeline',
            synth: new CodeBuildStep('SynthStep', {
                // TODO: use v2 source (a codestar connection as this [v1] strategy is no longer recommended)
                input: CodePipelineSource.gitHub('Draghonite/reactivities-cdk', 'main', {
                    authentication: SecretValue.secretsManager('prod/github/draghonite', { jsonField : 'PERSONAL_ACCESS_TOKEN' })
                }),
                installCommands: [
                    'npm install -g aws-cdk'
                ],
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth'
                ]
            })
        });

        // CI/CD stage (stack) provisioning along w/ necessary services
        const deploy = new ReactivitiesCICDStage(this, 'Deploy-CICD');
        const deployStage = pipeline.addStage(deploy);
    }
}

export class ReactivitiesCICDStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);
        
        const service = new ReactivitiesCICDPipelineStack(this, 'ReactivitiesCICDPipelineStack', {
            stackName: "ReactivitiesCICDPipelineStack"
        });
    }
}