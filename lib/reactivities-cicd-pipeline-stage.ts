import { Stage, StageProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { ReactivitiesCICDPipelineStack } from "./reactivities-cicd-pipeline-stack";

export class ReactivitiesCICDStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);
        
        const service = new ReactivitiesCICDPipelineStack(this, 'ReactivitiesCICDPipelineStack', {
            stackName: "ReactivitiesCICDPipelineStack"
        });
    }
}