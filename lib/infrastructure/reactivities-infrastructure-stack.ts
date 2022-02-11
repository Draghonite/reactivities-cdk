import { InfrastructureConfig } from './../../config/infrastructure-config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, ListenerConfig, Secret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { RemovalPolicy } from 'aws-cdk-lib';

export class ReactivitiesInfrastructureStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // TODO: update infrastructure for high availability (cross AZ) and allow choosing Fargate on dev/pre-prod and EC2 on Prod

        // TODO: see about patching overrides passed in through props (the stack's props)
        const infrastructureConfig = InfrastructureConfig;

        // provision ECR
        const repository = new Repository(this, 'ReactivitiesRepository', {
            repositoryName: infrastructureConfig.ecrRepositoryName,
            // NOTE: dangerous but this IS meant to be a one-time deployment stack and if redeployment is necessary, would be justified
            removalPolicy: RemovalPolicy.DESTROY
        });

        // provision ECS
        const fargateTaskDefinition = new FargateTaskDefinition(this, 'ReactivitiesFargateDefinition', {
            cpu: infrastructureConfig.ecsFargateCPU,
            memoryLimitMiB: infrastructureConfig.ecsFargateMemoryLimit,
            family: 'ReactivitiesFargateDefinition'
        });
        const secretReactivities = secretsmanager.Secret.fromSecretNameV2(this, 'ReactivitiesSecret', infrastructureConfig.applicationSecret);
        const container = fargateTaskDefinition.addContainer('ReactivitiesContainer', {
            containerName: infrastructureConfig.ecsFargateContainerName,
            image: ContainerImage.fromEcrRepository(repository, "latest"),
            memoryLimitMiB: infrastructureConfig.ecsFargateMemoryLimit,
            // TODO: make these configurable
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
            portMappings: [{ containerPort: infrastructureConfig.ecsFargateContainerPort }]
        });

        const vpc = new Vpc(this, 'ReactivitiesVPC', {
            vpcName: infrastructureConfig.vpcName,
            cidr: infrastructureConfig.vpcCIDR
        });
        const cluster = new Cluster(this, 'ReactivitiesECSCluster', {
            clusterName: infrastructureConfig.ecsClusterName,
            vpc: vpc
        });
        const service = new FargateService(this, 'ReactivitiesService', {
            serviceName: infrastructureConfig.ecsServiceName,
            cluster: cluster,
            taskDefinition: fargateTaskDefinition,
            desiredCount: 1,
            minHealthyPercent: 0,
            maxHealthyPercent: 200
        });
        const loadBalancer = new ApplicationLoadBalancer(this, 'ReactivitesALB', {
            vpc: vpc,
            internetFacing: true
        });
        const listener = loadBalancer.addListener('ReactivitiesALBListener', { port: 80, open: true });
        service.registerLoadBalancerTargets({
            containerName: infrastructureConfig.ecsFargateContainerName,
            containerPort: 80,
            newTargetGroupId: 'ReactivitiesTG',
            listener: ListenerConfig.applicationListener(listener, {
                protocol: ApplicationProtocol.HTTP,
                port: 80
            })
        });
        // output the path to access the service
        new cdk.CfnOutput(this, 'ReactivitiesLoadBalancerDNS', { value: loadBalancer.loadBalancerDnsName });


        // TODO: the newly-created vpc has a new route table that needs connection to the new internet gateway allowing 0.0.0.0/0
        // TODO: document any manual clean-up necessary -- e.g. EIP, ENI, Subnet, VPC, SG, ... may remain between deployments
    }
}