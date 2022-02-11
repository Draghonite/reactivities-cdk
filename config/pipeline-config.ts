import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { SecretValue } from "aws-cdk-lib";
import { BuildSpecContent } from "../lib/shared/buildspec";
import { IPipelineConfigProps } from "../lib/shared/config";


export const PipelineConfig: IPipelineConfigProps = {
    appName: 'reactivities',
    serviceName: '',
    pipelineIdentifier: 'ReactivitiesCICDPipeline',
    pipelineName: 'ReactivitiesCICDPipeline',
    bucketIdentifier: 'reactivities-cicd-pipeline',
    sourceStage: {
        actionName: 'GitHub_Source',
        artifactIdentifier: 'SourceArtifact',
        owner: 'Draghonite',
        repo: 'reactivities',
        oauthToken: SecretValue.secretsManager('prod/github/draghonite', { jsonField : 'PERSONAL_ACCESS_TOKEN' }),
        variablesNamespace: 'SourceVariables',
        branch: 'main'
    },
    buildStage: {
        actionName: 'Build',
        projectIdentifier: 'ReactivitiesBuildProject',
        projectName: '',
        bucketName: 'ReactivitiesBuildProject',
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
        repositoryIdentifier: 'ReactivitiviesRepository',
        repositoryName: 'reactivities-repository', // TODO: shared from the infrastructure's config and not duplicated here
        buildSpec: BuildSpecContent,
        artifactIdentifier: 'BuildArtifact',
        variablesNamespace: 'BuildVariables'
    },
    deployStage: {
        dev: {
            actionName: 'ReactivitiesDeployTesting',
            artifactIdentifier: '',
            clusterIdentifier: 'ReactivitiesECSClusterTesting',
            clusterName: 'reactivities-ecs-cluster',
            vpcIdentifier: 'ReactivitiesTestingVPC',
            vpcId: 'vpc-067980609b6d19c08',
            securityGroupIdentifier: 'ReactivitiesTestingSG',
            securityGroup: 'sg-0e9a22c054ec91941',
            serviceIdentifier: 'ReactivitiesFargateService',
            availabilityZones: ['us-east-1'],
            ecsServiceName: 'ReactivitiesInfrastructureStack-ReactivitiesService41450F96-TOrwSxVfLV1F' // TODO: shared from infra config or via look-up
        },
        prod: {
            actionName: 'ReactivitiesDeployTestingProd',
            artifactIdentifier: '',
            clusterIdentifier: 'ReactivitiesECSClusterTestingProd',
            clusterName: 'reactivities-ecs-cluster-prod',
            vpcIdentifier: 'ReactivitiesTestingVPCProd',
            vpcId: 'vpc-067980609b6d19c08',
            securityGroupIdentifier: 'ReactivitiesTestingSGProd',
            securityGroup: 'sg-0e9a22c054ec91941',
            serviceIdentifier: 'ReactivitiesFargateServiceProd',
            availabilityZones: ['us-east-1'],
            ecsServiceName: 'ReactivitiesInfrastructureStack-ReactivitiesService41450F96-TOrwSxVfLV1F'
        }
    },
    approvalStage: {
        notifyEmails: ['cicd@sidemotion.com'],
        notifyTopic: ''
    },
    notification: {
        slack: [
            {
                channelName: '',
                channelId: '',
                workspaceId: '',
                arn: ''
            }
        ]
    }
}