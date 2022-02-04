import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // create the pipeline for CI/CD stages
        /*
            - Source
              - url: https://github.com/Draghonite/reactivities
            - Build
            - Deploy
        */
        const pipeline = new codepipeline.Pipeline(this, 'ReactivitiesCICDPipeline', {
            pipelineName: 'ReactivitiesCICDPipeline'
        });
        // Source (GitHub)
        const sourceOutput = new codepipeline.Artifact("SourceArtifact");
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'Draghonite',
            repo: 'reactivities',
            oauthToken: SecretValue.secretsManager('prod/github/draghonite', { jsonField : 'PERSONAL_ACCESS_TOKEN' }),
            variablesNamespace: "SourceVariables",
            output: sourceOutput,
            branch: 'main'
        });
        // Build
        const buildOutput = new codepipeline.Artifact();
        const codeBuildProject = new codebuild.Project(this,
            'CodeBuildProject',
            // {
            //   buildSpec: codebuild.BuildSpec.fromSourceFilename('./buidspec.yml'),
            //   source: sourceOutput
            // }
            {
                buildSpec: codebuild.BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        install: {
                            commands: [
                                'echo "INSTALL-STAGE"'
                            ]
                        },
                        pre_build: {
                            commands: [
                                'echo "PRE-BUILD-STAGE"'
                            ]
                        },
                        build: {
                            commands: [
                                'echo "BUILD-STAGE"'
                            ]
                        },
                        post_build: {
                            commands: [
                                'echo "POST-BUILD-STAGE"'
                            ]
                        },
                    }
                })
            }
        );
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: codeBuildProject,
            input: sourceOutput,
            outputs: [buildOutput]
        });

        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction]
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction]
        });
    }
}