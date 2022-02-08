import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, ListenerConfig, Secret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import ReactivitiesConfig from './reactivities-config';
import { RemovalPolicy } from 'aws-cdk-lib';

export class ReactivitiesInfrastructureStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // provision ECR
        const repository = new Repository(this, 'ReactivitiesRepository', {
            repositoryName: ReactivitiesConfig.REPOSITORY_NAME,
            // NOTE: dangerous but this IS meant to be a one-time deployment stack and if redeployment is necessary, would be justified
            removalPolicy: RemovalPolicy.DESTROY
        });

        // provision ECS
        const fargateTaskDefinition = new FargateTaskDefinition(this, 'ReactivitiesFargateDefinition', {
            cpu: ReactivitiesConfig.ECS_FARGATE_CPU,
            memoryLimitMiB: ReactivitiesConfig.ECS_FARGATE_MEMORY_LIMIT,
            family: 'ReactivitiesFargateDefinition'
        });
        const secretReactivities = secretsmanager.Secret.fromSecretNameV2(this, 'ReactivitiesSecret', ReactivitiesConfig.APPLICATION_SECRET);
        const container = fargateTaskDefinition.addContainer('ReactivitiesContainer', {
            containerName: ReactivitiesConfig.ECS_FARGATE_CONTAINER_NAME,
            image: ContainerImage.fromEcrRepository(repository, "latest"),
            memoryLimitMiB: ReactivitiesConfig.ECS_FARGATE_MEMORY_LIMIT,
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
            portMappings: [{ containerPort: ReactivitiesConfig.ECS_FARGATE_CONTAINER_PORT }]
        });

        const vpc = new Vpc(this, 'ReactivitiesVPC', {
            vpcName: ReactivitiesConfig.VPC_NAME,
            cidr: ReactivitiesConfig.VPC_CIDR
        });
        const cluster = new Cluster(this, 'ReactivitiesECSCluster', {
            clusterName: ReactivitiesConfig.ECS_CLUSTER_NAME,
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
            containerName: ReactivitiesConfig.ECS_FARGATE_CONTAINER_NAME,
            containerPort: 80,
            newTargetGroupId: 'ReactivitiesTG',
            listener: ListenerConfig.applicationListener(listener, {
                protocol: ApplicationProtocol.HTTPS
            })
        });
    }
}