export default class ReactivitiesConfig {
    static ECR_REPOSITORY_NAME = 'reactivities-repository';
    static VPC_NAME = 'reactivities-vpc';
    static VPC_CIDR = '10.0.0.0/24';
    static VPC_ID = 'vpc-067980609b6d19c08'; // TODO: same
    static VPC_AVAILABILITY_ZONES = ['us-east-1']; // TODO: same
    static ECS_CLUSTER_NAME = 'reactivities-ecs-cluster';
    static ECS_SERVICE_NAME = 'ReactivitiesInfrastructureStack-ReactivitiesService41450F96-TOrwSxVfLV1F'; // TODO: rebuild infra after setting this to 'reactivities-ecs-service';
    static ECS_SECURITY_GROUP_ID = 'sg-0e9a22c054ec91941'; // TODO: same
    static APPLICATION_SECRET = 'staging/reactivities';
    static ECS_FARGATE_CONTAINER_NAME = 'ReactivitiesContainer';
    static ECS_FARGATE_CPU = 256;
    static ECS_FARGATE_MEMORY_LIMIT = 512;
    static ECS_FARGATE_CONTAINER_PORT = 80;
    static CICD_PIPELINE_NAME = 'ReactivitiesCICDPipeline';
}