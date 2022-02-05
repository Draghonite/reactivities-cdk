import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ReactivitiesCICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // create the pipeline for CI/CD and its stages
        /*
            - Source
              - GitHub url: https://github.com/Draghonite/reactivities
            - Build
              - steps
            - Deploy
        */
        const pipeline = new codepipeline.Pipeline(this, 'ReactivitiesCICDPipeline', {
            pipelineName: 'ReactivitiesCICDPipeline'
        });        
        // #region Source (GitHub)
        const sourceOutput = new codepipeline.Artifact('SourceArtifact');
        // TODO: use v2 source (a codestart connection as this [v1] strategy is no longer recommended)
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'Draghonite',
            repo: 'reactivities',
            oauthToken: SecretValue.secretsManager('prod/github/draghonite', { jsonField : 'PERSONAL_ACCESS_TOKEN' }),
            variablesNamespace: 'SourceVariables',
            output: sourceOutput,
            branch: 'main'
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [sourceAction]
        });
        // #endregion
        
        // #region Build
        const buildOutput = new codepipeline.Artifact('BuildArtifact');
        const codeBuildProject = new codebuild.Project(this, 'Reactivities-BuildProject', {
            // TODO: continue here (starting w/ environment)
            projectName: "ReactivitiesBuildProject",
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': {
                            nodejs: 12
                        },
                        commands: [
                            '/usr/local/bin/dotnet-install.sh --channel LTS'  // https://github.com/aws/aws-codebuild-docker-images/issues/497
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
        });
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: codeBuildProject,
            variablesNamespace: "BuildVariables",
            input: sourceOutput,
            outputs: [buildOutput]
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction]
        });
        // #endregion
    }
}