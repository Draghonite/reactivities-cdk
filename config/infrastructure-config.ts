export const InfrastructureConfig = {
    ecrRepositoryName: 'reactivities-repository',
    vpcName: 'reactivities-vpc',
    vpcCIDR: '10.0.0.0/24',
    vpcIdentifier: 'vpc-067980609b6d19c08', // TODO: same',
    vpcAvailabilityZones: ['us-east-1'], // TODO: same
    ecsClusterName: 'reactivities-ecs-cluster',
    ecsServiceName: 'ReactivitiesInfrastructureStack-ReactivitiesService41450F96-TOrwSxVfLV1F', // TODO: rebuild infra after setting this to 'reactivities-ecs-service'
    ecsSecurityGroupIdentifier: 'sg-0e9a22c054ec91941', // TODO: same
    applicationSecret: 'staging/reactivities',
    ecsFargateContainerName: 'ReactivitiesContainer',
    ecsFargateCPU: 256,
    ecsFargateMemoryLimit: 512,
    ecsFargateContainerPort: 80,
    cicdPipelineName: 'ReactivitiesCICDPipeline'
}