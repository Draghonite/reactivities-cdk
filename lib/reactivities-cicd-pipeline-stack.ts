import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import ReactivitiesConfig from './reactivities-config';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export class ReactivitiesCICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const repository = Repository.fromRepositoryName(this, "ReactivitiviesRepository", ReactivitiesConfig.ECR_REPOSITORY_NAME);

        // create the pipeline for CI/CD and its stages
        /*
            - Source
              - GitHub url: https://github.com/Draghonite/reactivities
            - Build
              - steps
            - Deploy
        */
        const bucket = new s3.Bucket(this, 'reactivities-cicd-pipeline');
        const pipeline = new codepipeline.Pipeline(this, 'ReactivitiesCICDPipeline', {
            pipelineName: ReactivitiesConfig.CICD_PIPELINE_NAME,
            artifactBucket: bucket
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
        const codeBuildProject = new codebuild.Project(this, 'ReactivitiesBuildProject', {
            // projectName: 'ReactivitiesBuildProject',
            artifacts: codebuild.Artifacts.s3({
                bucket,
                name: 'ReactivitiesBuildProject'
            }),
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
                privileged: true,
                environmentVariables: {
                    REPOSITORY_URI: { value: repository.repositoryUri }
                }
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                env: {},
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
                            'echo "PRE-BUILD-STAGE"',
                            'echo $REPOSITORY_URI',
                            'echo Restore started on `date`',
                            // # DotNet - restore dependencies
                            'dotnet restore src/API/API.csproj',
                            // # ECR - login and get metadata
                            'echo Logging in to Amazon ECR...',
                            'aws --version',
                            '$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)',
                            'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                            'IMAGE_TAG=${COMMIT_HASH:=latest}'
                        ]
                    },
                    build: {
                        commands: [
                            'echo "BUILD-STAGE"',
                            'echo Build started on `date`',
                            // # Client app - install client app dependencies, run tests and build (NOTE: 'npm run build' copies build output to the DotNet app for self-hosting)
                            'echo Building client app',
                            'cd src/client-app',
                            'npm install',
                            'npm run build',
                            'npm test -- --watchAll=false',
                            'cd ../..',
                            // # DotNet - run tests and build server/api for release
                            'echo Building dotnet',
                            'dotnet build src/API/API.csproj -c Release -o /app/build',
                            'echo Test started on `date`',
                            'dotnet test -c Release --logger trx --results-directory ./testresults',
                            // # ECR - build Docker image and tag appropriately
                            'echo Building the Docker image...',
                            'docker build -t $REPOSITORY_URI:latest .',
                            'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG'
                        ]
                    },
                    post_build: {
                        commands: [
                            'echo "POST-BUILD-STAGE"',
                            'echo Publish started on `date`',
                            // # DotNet - publish release
                            'dotnet publish src/API/API.csproj -r linux-x64 -c Release -o /app/publish',
                            // # ECR - push docker image to ECR
                            'echo Pushing the Docker images...',
                            'docker push $REPOSITORY_URI:latest',
                            'docker push $REPOSITORY_URI:$IMAGE_TAG',
                            // # write image definitions file
                            // # - apt-get install jq -y
                            'ContainerName="ReactivitiesContainer"', // TODO: pass as an env variable
                            'ImageURI=$REPOSITORY_URI:$IMAGE_TAG',
                            'echo $ImageURI',
                            'printf \'[{"name":"CONTAINER_NAME","imageUri":"IMAGE_URI"}]\' > imagedefinitions.json',
                            'sed -i -e "s|CONTAINER_NAME|$ContainerName|g" imagedefinitions.json',
                            'sed -i -e "s|IMAGE_URI|$ImageURI|g" imagedefinitions.json',
                            'cat imagedefinitions.json'
                        ]
                    },
                }
            })
        });

        // TODO: must attach aws managed policy 'AmazonEC2ContainerRegistryPowerUser' to the build project's role
        /*
            TODO: may also need:
                "Effect": "Allow",
                "Action": "secretsmanager:GetSecretValue",
                "Resource": "arn:aws:secretsmanager:*:904164939197:secret:*"
        */
        codeBuildProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: codeBuildProject,
            variablesNamespace: 'BuildVariables',
            input: sourceOutput,
            outputs: [buildOutput]
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [buildAction]
        });
        // #endregion
    
        // #region Deploy

        // #endregion
    }
}