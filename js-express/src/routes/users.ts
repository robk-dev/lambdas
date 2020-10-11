import express, { Router } from 'express';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const IS_OFFLINE = process.env.NODE_ENV !== 'production';
const USERS_TABLE = process.env.TABLE;

const dynamoDb = IS_OFFLINE === true ?
    new AWS.DynamoDB.DocumentClient({
        region: 'us-east-1',
        endpoint: 'http://127.0.0.1:8080',
    }) :
    new AWS.DynamoDB.DocumentClient();

const router = Router();

const getUsersHandler = async (_req: express.Request, res: express.Response) => {
    const data = await dynamoDb.scan({
        TableName: USERS_TABLE
    }).promise();
    return res.json(data);
}

router.get('/users', getUsersHandler);

router.get('/users/:id', (req: express.Request, res: express.Response) => {
    const id = req.params.id;

    const params = {
        TableName: USERS_TABLE,
        Key: {
            id
        }
    };

    dynamoDb.get(params, (error: Error, result: { Item: {} }) => {
        if (error) {
            res.status(400).json({ error: 'Error retrieving User' });
        }
        if (result.Item) {
            res.json(result.Item);
        } else {
            res.status(404).json({ error: `User with id: ${id} not found` });
        }
    });
});

router.post('/users', (req: express.Request, res: express.Response) => {
    const name = req.body.name;
    const id = uuid.v4();

    const params = {
        TableName: USERS_TABLE,
        Item: {
            id,
            name
        },
    };

    dynamoDb.put(params, (error: Error) => {
        if (error) {
            res.status(400).json({ error: 'Could not create User' });
        }
        res.json({
            id,
            name
        });
    });
});

router.delete('/users/:id', (req: express.Request, res: express.Response) => {
    const id = req.params.id;

    const params = {
        TableName: USERS_TABLE,
        Key: {
            id
        }
    };

    dynamoDb.delete(params, (error: Error) => {
        if (error) {
            res.status(400).json({ error: 'Could not delete User' });
        }
        res.json({ success: true });
    });
});

router.put('/users', (req: express.Request, res: express.Response) => {
    const id = req.body.id;
    const name = req.body.name;

    const params = {
        TableName: USERS_TABLE,
        Key: {
            id
        },
        UpdateExpression: 'set #name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': name },
        ReturnValues: "ALL_NEW"
    }

    dynamoDb.update(params, (error: Error, result: any) => {
        if (error) {
            res.status(400).json({ error: 'Could not update User' });
        }
        res.json(result.Attributes);
    })
});

export {
    router
}