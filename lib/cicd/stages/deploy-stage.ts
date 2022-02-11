import { Action, Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { EcsDeployAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PipelineConfig } from './../../../config/pipeline-config';
import { Stack } from 'aws-cdk-lib';
import { IDeployStageParam, IPipelineConfigProps } from '../../shared/config';
import { IBaseService, FargateService, Cluster } from 'aws-cdk-lib/aws-ecs';

export class DeployStage {
    private readonly stack: Stack;
    private readonly props: IPipelineConfigProps;
    private readonly buildOutput: Artifact;
    private readonly environment: string;

    constructor(stack: Stack, props: IPipelineConfigProps, buildOutput: Artifact, environment: string) {
        this.stack = stack;
        this.props = props;
        this.buildOutput = buildOutput;
        this.environment = environment;
    }

    public get action(): Action {
        const deployEnv = this.getDeployEnvDetails(this.environment);
        const baseService: IBaseService = FargateService.fromFargateServiceAttributes(this.stack, deployEnv.serviceIdentifier, {
            cluster: Cluster.fromClusterAttributes(this.stack, deployEnv.clusterName, {
                clusterName: deployEnv.clusterName,
                securityGroups: [SecurityGroup.fromSecurityGroupId(this.stack, deployEnv.securityGroupIdentifier, deployEnv.securityGroup)],
                vpc: Vpc.fromVpcAttributes(this.stack, deployEnv.vpcIdentifier, {
                    vpcId: deployEnv.vpcId,
                    availabilityZones: deployEnv.availabilityZones
                })
            }),
            serviceName: deployEnv.ecsServiceName
        });
        return new EcsDeployAction({
            actionName: deployEnv.actionName,
            service: baseService,
            input: this.buildOutput
        });
    }

    private getDeployEnvDetails(env: string): IDeployStageParam {
        switch (env) {
            case "dev": 
                return PipelineConfig.deployStage.dev;
            case "prod":
                return PipelineConfig.deployStage.prod;
            default:
                return PipelineConfig.deployStage.dev;
        }
    }
}