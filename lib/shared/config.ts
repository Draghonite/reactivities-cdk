import { SecretValue } from "aws-cdk-lib";
import { BuildEnvironmentVariable, IBuildImage } from "aws-cdk-lib/aws-codebuild";

export interface IPipelineConfigProps {
    appName: string;
    serviceName: string;
    pipelineIdentifier: string;
    pipelineName: string;
    bucketIdentifier: string;
    sourceStage: ISourceStage;
    buildStage: IBuildStage;
    approvalStage: IApprovalStage;
    notification: INotification;
    deployStage: IDeployStage;
}

export interface IStage {
    actionName: string;
    artifactIdentifier: string;
}

export interface ISourceStage extends IStage {
    owner: string;
    repo: string;
    oauthToken: SecretValue;
    variablesNamespace: string;
    branch: string;
}

export interface IBuildStage extends IStage {
    projectIdentifier: string;
    projectName: string;
    repositoryIdentifier: string;
    bucketName: string;
    buildImage: IBuildImage;
    privileged: boolean;
    environmentVariables?: BuildEnvironmentVariable;
    repositoryName: string;
    buildSpec: any;
    variablesNamespace: string;
}

export interface IDeployStage {
    prod: IDeployStageParam;
    dev: IDeployStageParam;
}

export interface IDeployStageParam extends IStage {
    clusterIdentifier: string;
    clusterName: string;
    vpcIdentifier: string;
    vpcId: string;
    securityGroupIdentifier: string;
    securityGroup: string;
    serviceIdentifier: string;
    availabilityZones: string[];
    ecsServiceName: string;
}

export interface IApprovalStage {
    notifyEmails: string[];
    notifyTopic: string;
}

export interface ISlackNotificationConfig {
    channelName: string;
    channelId: string;
    workspaceId: string;
    arn: string;
}

export interface INotification {
    slack: ISlackNotificationConfig[];
}