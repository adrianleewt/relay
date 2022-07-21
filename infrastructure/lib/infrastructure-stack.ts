import {
  Stack,
  StackProps,
  aws_s3 as s3,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { WebSocketLambdaAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';

import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { hosting_bucket_name, user_pool_name } from './constants';

export interface SimpleLambdaProps {
  memorySize?: number;
  reservedConcurrentExecutions?: number;
  runtime?: Runtime;
  name: string;
  description: string;
  entryFilename: string;
  handler?: string;
  timeout?: Duration;
  envVariables?: any;
}

export class SimpleLambda extends Construct {
  public fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: SimpleLambdaProps) {
    super(scope, id);

    this.fn = new NodejsFunction(this, id, {
      entry: `./src/lambda/${props.entryFilename}`,
      handler: props.handler ?? 'handler',
      runtime: props.runtime ?? Runtime.NODEJS_16_X,
      timeout: props.timeout ?? Duration.seconds(5),
      memorySize: props.memorySize ?? 1024,
      tracing: Tracing.ACTIVE,
      functionName: props.name,
      description: props.description,
      depsLockFilePath: path.join(__dirname, '..', 'package-lock.json'),
      environment: props.envVariables ?? {},
    });
  }
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'RelayBucket', {
      bucketName: hosting_bucket_name,
      versioned: true,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
    });

    // DynamoDB
    const table = new dynamodb.Table(this, 'relay-table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const wordTable = new dynamodb.Table(this, 'relay-word-table', {
      partitionKey: {
        name: 'word',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 👇 User Pool
    const userPool = new cognito.UserPool(this, 'userpool', {
      userPoolName: user_pool_name,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our awesome app!',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      userInvitation: {
        emailSubject: 'Invite to play Relay!',
        emailBody:
          'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
      },
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
      signInCaseSensitive: false,
      customAttributes: {
        country: new cognito.StringAttribute({ mutable: true }),
        isAdmin: new cognito.StringAttribute({ mutable: true }),
        joinedOn: new cognito.DateTimeAttribute(),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 👇 User Pool Client Attributes
    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      address: true,
      birthdate: true,
      gender: true,
      locale: true,
      middleName: true,
      fullname: true,
      nickname: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      profilePicture: true,
      preferredUsername: true,
      profilePage: true,
      timezone: true,
      lastUpdateTime: true,
      website: true,
    };

    const clientReadAttributes = new cognito.ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['country', 'isAdmin']);

    const clientWriteAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      })
      .withCustomAttributes(...['country']);

    // 👇 User Pool Client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      'relay-users-client',
      {
        userPool,
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userSrp: true,
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        readAttributes: clientReadAttributes,
        writeAttributes: clientWriteAttributes,
      }
    );

    // (Dis-)connect handler
    const connectHandler = new SimpleLambda(this, 'ConnectionHandlerLambda', {
      entryFilename: 'websocket-connect-handler.ts',
      handler: 'connectHandler',
      name: 'ConnectionHandler',
      description:
        'Handles the onConnect & onDisconnect events emitted by the WebSocket API Gateway',
      envVariables: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantFullAccess(connectHandler.fn);

    // Main (default route) handler
    const defaultHandler = new SimpleLambda(this, 'DefaultHandlerLambda', {
      entryFilename: 'websocket-default-handler.ts',
      handler: 'defaultHandler',
      name: 'DefaultHandler',
      description:
        'Handles requests sent via websocket and stores (connectionId, time) tuple in DynamoDB.',
      envVariables: {
        TABLE_NAME: table.tableName,
        WORDS_TABLE_NAME: wordTable.tableName,
        CONNECTION_URL: process.env.RELAY_CONNECTION_URL,
      },
    });
    table.grantFullAccess(defaultHandler.fn);
    wordTable.grantFullAccess(defaultHandler.fn);

    // Websocket Auth Handler
    const authHandler = new SimpleLambda(this, 'AuthHandler', {
      entryFilename: 'authorizer.ts',
      handler: 'authHandler',
      name: 'AuthHandler',
      description: 'Authorizes WebSocket requests.',
      envVariables: {
        USER_POOL_ID: userPool.userPoolId,
        APP_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const webSocketApi = new apigwv2.WebSocketApi(this, 'relay-ws-api', {
      connectRouteOptions: {
        authorizer: new WebSocketLambdaAuthorizer(
          'Authorizer',
          authHandler.fn,
          {
            identitySource: [`route.request.querystring.idToken`],
          }
        ),
        integration: new WebSocketLambdaIntegration(
          'ConnectIntegration',
          connectHandler.fn
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          'DisconnectIntegration',
          connectHandler.fn
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          'DefaultIntegration',
          defaultHandler.fn
        ),
      },
    });

    webSocketApi.grantManageConnections(connectHandler.fn);
    webSocketApi.grantManageConnections(defaultHandler.fn);

    const webSocketStage = new apigwv2.WebSocketStage(this, 'ws-stage', {
      webSocketApi,
      stageName: 'game',
      autoDeploy: true,
    });

    const webSocketURL = webSocketStage.url;
    // wss://${this.api.apiId}.execute-api.${s.region}.${s.urlSuffix}/${urlPath}
    const callbackURL = webSocketStage.callbackUrl;
    // https://${this.api.apiId}.execute-api.${s.region}.${s.urlSuffix}/${urlPath}

    // Outputs
    new cdk.CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'webSocketURL', {
      value: webSocketURL,
    });
    new cdk.CfnOutput(this, 'callbackURL', {
      value: callbackURL,
    });
  }
}
