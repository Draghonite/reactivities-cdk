import { BuildSpecContent } from './../../shared/buildspec';
import { Stack } from "aws-cdk-lib";
import { Artifacts, BuildSpec, Project } from "aws-cdk-lib/aws-codebuild";
import { Action, Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { IRepository, Repository } from "aws-cdk-lib/aws-ecr";
import { IPipelineConfigProps } from "../../shared/config";
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class BuildStage {
    private readonly stack: Stack;
    private readonly props: IPipelineConfigProps;
    private readonly buildOutput: Artifact;
    private readonly repository: IRepository;
    private readonly sourceOutput: Artifact;
    private readonly bucket: Bucket;

    constructor(stack: Stack, props: IPipelineConfigProps, sourceOutput: Artifact, bucket: Bucket) {
        this.stack = stack;
        this.props = props;
        this.buildOutput = new Artifact(this.props.buildStage.artifactIdentifier);
        this.repository = Repository.fromRepositoryName(this.stack, props.buildStage.repositoryIdentifier, props.buildStage.repositoryName);
        this.sourceOutput = sourceOutput;
        this.bucket = bucket;
    }

    public get action(): Action {
        const project = new Project(this.stack, this.props.buildStage.projectIdentifier, {
            artifacts: Artifacts.s3({
                bucket: this.bucket,
                name: this.props.buildStage.bucketName
            }),
            environment: {
                buildImage: this.props.buildStage.buildImage,
                privileged: this.props.buildStage.privileged,
                environmentVariables: this.props.buildStage.environmentVariables?.value || {
                    REPOSITORY_URI: { value: this.repository.repositoryUri }
                }
            },
            buildSpec: BuildSpec.fromObject(BuildSpecContent)
        });
        project.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
        return new CodeBuildAction({
            actionName: this.props.buildStage.actionName,
            project: project,
            variablesNamespace: this.props.buildStage.variablesNamespace,
            input: this.sourceOutput,
            outputs: [this.buildOutput]
        });
    }
}