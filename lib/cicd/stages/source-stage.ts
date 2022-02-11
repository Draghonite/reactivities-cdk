import { Stack } from "aws-cdk-lib";
import { Action, Artifact } from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { IPipelineConfigProps } from "../../shared/config";

export class SourceStage {
    private readonly stack: Stack;
    private readonly props: IPipelineConfigProps;
    private readonly sourceOutput: Artifact;

    constructor(stack: Stack, props: IPipelineConfigProps) {
        this.stack = stack;
        this.props = props;
        this.sourceOutput = new Artifact(this.props.sourceStage.artifactIdentifier);
    }

    public get action(): Action {
        // NOTE: uses GitHub connection v1 while v2 is recommended -- consider updating though limitations apply -- https://docs.aws.amazon.com/codepipeline/latest/userguide/update-github-action-connections.html
        return new GitHubSourceAction({
            actionName: this.props.sourceStage.actionName,
            owner: this.props.sourceStage.owner,
            repo: this.props.sourceStage.repo,
            oauthToken: this.props.sourceStage.oauthToken,
            variablesNamespace: this.props.sourceStage.variablesNamespace,
            output: this.sourceOutput,
            branch: this.props.sourceStage.branch
        });
    }
}