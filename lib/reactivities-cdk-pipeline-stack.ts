import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { SecretValue } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ReactivitiesCICDStage } from './reactivities-cicd-pipeline-stage';
import { Repository } from 'aws-cdk-lib/aws-ecr';

export class ReactivitiesCDKPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // create a pipeline for CDK and its stages (watch for code updates to the CDK stack and self-mutate, provision required CI/CD resources [ECR, ECS, etc.] and provision the CI/CD stack)
        /*
            - Synth
              - Source:ZGitHub url: https://github.com/Draghonite/reactivities-cdk
            - Deploy
        */

        const pipeline = new CodePipeline(this, 'ReactivitiesCDKPipeline', {
            pipelineName: 'ReactivitiesCDKPipeline',
            synth: new CodeBuildStep('SynthStep', {
                // TODO: use v2 source (a codestart connection as this [v1] strategy is no longer recommended)
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

        // CI/CD resources (ECR, ECS)
        const repository = new Repository(this, "ReactivitiesRepository", {
            repositoryName: "reactivities-repository"
        });

        // const containerService = new 

        // CI/CD stage (stack) provisioning along w/ necessary services
        const deploy = new ReactivitiesCICDStage(this, 'Deploy-CICD');
        const deployStage = pipeline.addStage(deploy);
    }
}