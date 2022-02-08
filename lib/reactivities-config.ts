export default class ReactivitiesConfig {
    static REPOSITORY_NAME = 'reactivities-repository';
    static VPC_NAME = 'reactivities-vpc';
    static VPC_CIDR = '10.0.0.0/24';
    static ECS_CLUSTER_NAME = 'reactivities-ecs-cluster';
    static APPLICATION_SECRET = 'staging/reactivities';
    static ECS_FARGATE_CONTAINER_NAME = 'ReactivitiesContainer';
    static ECS_FARGATE_CPU = 256;
    static ECS_FARGATE_MEMORY_LIMIT = 512;
    static ECS_FARGATE_CONTAINER_PORT = 80;
}