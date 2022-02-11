#reactivities-cdk
## Built-up manually from the ground up to showcase

- AWS CDK
- TypeScript
- Managing of CloudFormation automation code for stacks involving:
  - Infrastructure (including provisioning of ECR, ECS + Fargate, VPC, ALB and related connectivity services);
  - CI/CD pipeline with a Source, Build and Deploy stages; and,
  - A self-mutating CDK Pipeline to manage its lifecycle as well as that of the CI/CD pipeline

The `cdk.json` file tells the CDK Toolkit how to execute the app which kicks off the infrastructure stack and the "cdk pipeline" stack, which in turn kicks off the ci/cd pipeline, managing it within its own lifecycle.

## Useful commands

 * `npm run build`   compile typescript to js -- run this in its own IDE terminal during development
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state -- especially useful in refactoring if used before a commit/deploy
 * `cdk synth`       emits the synthesized CloudFormation template -- always run this before deploying and committing code changes

## Thanks to
* [Creating AWS CodePipeline Using AWS CDK](https://faun.pub/creating-aws-codepipeline-using-aws-cdk-6d6895d56cee)