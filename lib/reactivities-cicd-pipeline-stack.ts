import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, ListenerConfig, Secret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class ReactivitiesCICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // TODO: commented out -- everything suddenly fails
        // provision ECR
        const REPOSITORY_NAME = 'reactivities-repository';
        // TODO: provision ECR in its own stack to use a static repo name -- otherwise updates to this stack will fail here EVERYTIME
        // const repository = new Repository(this, 'ReactivitiesRepository', {
        //     repositoryName: REPOSITORY_NAME
        // });

        // provision ECS
        const fargateTaskDefinition = new FargateTaskDefinition(this, 'ReactivitiesFargateDefinition', {
            cpu: 256,
            memoryLimitMiB: 512,
            family: 'ReactivitiesFargateDefinition'
        });
        const secretReactivities = secretsmanager.Secret.fromSecretNameV2(this, 'ReactivitiesSecret', 'staging/reactivities');
        const repository = Repository.fromRepositoryName(this, "ReactivitiviesRepository", REPOSITORY_NAME);
        const container = fargateTaskDefinition.addContainer('ReactivitiesContainer', {
            containerName: 'ReactivitiesContainer',
            image: ContainerImage.fromEcrRepository(repository, "latest"),
            memoryLimitMiB: 512,
            environment: {
                'ASPNETCORE_ENVIRONMENT': 'Production'
            },
            secrets: {
                'Cloudinary__ApiSecret': Secret.fromSecretsManager(secretReactivities, 'Cloudinary__ApiSecret'),
                'Cloudinary__ApiKey': Secret.fromSecretsManager(secretReactivities, 'Cloudinary__ApiKey'),
                'Cloudinary__CloudName': Secret.fromSecretsManager(secretReactivities, 'Cloudinary__CloudName'),
                'TokenKey': Secret.fromSecretsManager(secretReactivities, 'TokenKey'),
                'DATABASE_URL': Secret.fromSecretsManager(secretReactivities, 'DATABASE_URL')
            },
            portMappings: [{ containerPort: 80 }]
        });

        const vpc = new Vpc(this, 'ReactivitiesVPC', {
            // vpcName: 'ReactivitiesVPC',
            cidr: '10.0.0.0/24'
        });
        const cluster = new Cluster(this, 'ReactivitiesECSCluster', {
            // clusterName: 'ReactivitiesECSCluster',
            vpc: vpc
        });
        const service = new FargateService(this, 'ReactivitiesService', {
            cluster: cluster,
            taskDefinition: fargateTaskDefinition,
            desiredCount: 1,
            minHealthyPercent: 0,
            maxHealthyPercent: 200
        });
        const loadBalander = new ApplicationLoadBalancer(this, 'ReactivitesALB', {
            vpc: vpc,
            internetFacing: true
        });
        const listener = loadBalander.addListener('ReactivitiesALBListener', { port: 80 });
        service.registerLoadBalancerTargets({
            containerName: container.containerName,
            containerPort: 80,
            newTargetGroupId: 'ReactivitiesTG',
            listener: ListenerConfig.applicationListener(listener, {
                protocol: ApplicationProtocol.HTTPS
            })
        });



        // create the pipeline for CI/CD and its stages
        /*
            - Source
              - GitHub url: https://github.com/Draghonite/reactivities
            - Build
              - steps
            - Deploy
        */
        const bucket = new s3.Bucket(this, 'reactivities-cicd-pipeline', {
            
        });
        const pipeline = new codepipeline.Pipeline(this, 'ReactivitiesCICDPipeline', {
            // pipelineName: 'ReactivitiesCICDPipeline',
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
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
                privileged: true,
                environmentVariables: {
                    REPOSITORY_URI: { value: 'TEST-VALUE' }
                }
            },
            // logging: {
            //     cloudWatch: {
            //         logGroup: new cdk.aws_logs.LogGroup(this, 'ReactivitiesBuildProjectLogGroup', {
            //             logGroupName: '/aws/codebuild/ReactivitiesBuildProject'
            //         })
            //     }
            // },
            // artifacts: codebuild.Artifacts.s3({
            //     bucket: new s3.Bucket(this, 'ReactivitiesBucket', {
            //         bucketName: 'reactivities-bucket'
            //     }),
            //     identifier: 'ReactivitiesBuildProject'
            // }),
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
                            'echo $REPOSITORY_URI'
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
            variablesNamespace: 'BuildVariables',
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