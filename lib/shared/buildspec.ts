export const BuildSpecContent = {
    version: '0.2',
    env: {},
    phases: {
        install: {
            'runtime-versions': {
                nodejs: 12
            },
            commands: [
                '/usr/local/bin/dotnet-install.sh --channel LTS'  // https://github.com/aws/aws-codebuild-docker-images/issues/497
            ]
        },
        pre_build: {
            commands: [
                'echo "PRE-BUILD-STAGE"',
                'echo $REPOSITORY_URI',
                'echo Restore started on `date`',
                // # DotNet - restore dependencies
                'dotnet restore src/API/API.csproj',
                // # ECR - login and get metadata
                'echo Logging in to Amazon ECR...',
                'aws --version',
                '$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)',
                'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                'IMAGE_TAG=${COMMIT_HASH:=latest}'
            ]
        },
        build: {
            commands: [
                'echo "BUILD-STAGE"',
                'echo Build started on `date`',
                // # Client app - install client app dependencies, run tests and build (NOTE: 'npm run build' copies build output to the DotNet app for self-hosting)
                'echo Building client app',
                'cd src/client-app',
                'npm install',
                'npm run build',
                'npm test -- --watchAll=false',
                'cd ../..',
                // # DotNet - run tests and build server/api for release
                'echo Building dotnet',
                'dotnet build src/API/API.csproj -c Release -o /app/build',
                'echo Test started on `date`',
                'dotnet test -c Release --logger trx --results-directory ./testresults',
                // # ECR - build Docker image and tag appropriately
                'echo Building the Docker image...',
                'docker build -t $REPOSITORY_URI:latest .',
                'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG'
            ]
        },
        post_build: {
            commands: [
                'echo "POST-BUILD-STAGE"',
                'echo Publish started on `date`',
                // # DotNet - publish release
                'dotnet publish src/API/API.csproj -r linux-x64 -c Release -o /app/publish',
                // # ECR - push docker image to ECR
                'echo Pushing the Docker images...',
                'docker push $REPOSITORY_URI:latest',
                'docker push $REPOSITORY_URI:$IMAGE_TAG',
                // # write image definitions file
                // # - apt-get install jq -y
                'ContainerName="ReactivitiesContainer"', // TODO: pass as an env variable
                'ImageURI=$REPOSITORY_URI:$IMAGE_TAG',
                'echo $ImageURI',
                'printf \'[{"name":"CONTAINER_NAME","imageUri":"IMAGE_URI"}]\' > imagedefinitions.json',
                'sed -i -e "s|CONTAINER_NAME|$ContainerName|g" imagedefinitions.json',
                'sed -i -e "s|IMAGE_URI|$ImageURI|g" imagedefinitions.json',
                'cat imagedefinitions.json'
            ]
        },
    },
    reports: {
        TestResults: {
            'file-format': 'VisualStudioTrx',
            files: [
                '**/*'
            ],
            'base-directory': './testresults'
        }
    },
    artifacts: {
        files: [
            '/app/publish/*',
            '/testreports/*',
            'imagedefinitions.json'
        ]
    }
}