# MAKE SURE TO ACTIVATE VIRTUALENV.

import sys
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError


class Relay:

    def __init__(self, dyn_resource):
        """
        :param dyn_resource: A Boto3 DynamoDB resource.
        """
        self.dyn_resource = dyn_resource
        self.table = None

    def exists(self, table_name):
        """
        Determines whether a table exists. As a side effect, stores the table in
        a member variable.
        :param table_name: The name of the table to check.
        :return: True when the table exists; otherwise, False.
        """
        try:
            table = self.dyn_resource.Table(table_name)
            table.load()
            exists = True
        except ClientError as err:
            if err.response['Error']['Code'] == 'ResourceNotFoundException':
                exists = False
            else:
                print(
                    "Couldn't check for existence of %s. Here's why: %s: %s",
                    table_name,
                    err.response['Error']['Code'], err.response['Error']['Message'])
                raise
        else:
            self.table = table
        return exists

    def write_batch_words(self, words):
        try:
            with self.table.batch_writer() as writer:
                for word in words:
                    writer.put_item(Item=word)
        except ClientError as err:
            print(
                "Couldn't load data into table %s. Here's why: %s: %s", self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            raise

    def query_all_items(self):
        response = self.table.scan()
        items = response['Items']
        print(items)

    def truncateTable(self):

        # get the table keys
        tableKeyNames = [key.get("AttributeName")
                         for key in self.table.key_schema]

        # Only retrieve the keys for each item in the table (minimize data transfer)
        projectionExpression = ", ".join('#' + key for key in tableKeyNames)
        expressionAttrNames = {'#'+key: key for key in tableKeyNames}

        counter = 0
        page = self.table.scan(ProjectionExpression=projectionExpression,
                               ExpressionAttributeNames=expressionAttrNames)
        with self.table.batch_writer() as batch:
            while page["Count"] > 0:
                counter += page["Count"]
                # Delete items in batches
                for itemKeys in page["Items"]:
                    batch.delete_item(Key=itemKeys)
                # Fetch the next page
                if 'LastEvaluatedKey' in page:
                    page = self.table.scan(
                        ProjectionExpression=projectionExpression, ExpressionAttributeNames=expressionAttrNames,
                        ExclusiveStartKey=page['LastEvaluatedKey'])
                else:
                    break
        print(f"Deleted {counter}")


if __name__ == '__main__':
    print('-'*88)
    print("Relay Song Uploader")
    print('-'*88)

    relay = Relay(boto3.resource('dynamodb'))
    relay_exists = relay.exists(
        'InfrastructureStack-relaywordtableD463DE20-YADLYDDU0JZU')

    if not relay_exists:
        sys.exit('Table not found. Terminating...')

    # relay.truncateTable()

    with open('./words.txt', 'r') as file:
        to_send = []
        for line in file:
            to_send.append({'word': line.strip(), 'count': 0})
        # relay.write_batch_words(to_send)
