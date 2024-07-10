import express from 'express';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from "path";

import morgan from 'morgan';

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'crud.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const crudProto = grpc.loadPackageDefinition(packageDefinition).crud;
const client = new (crudProto as any).CrudService('localhost:50059', grpc.credentials.createInsecure());

const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.post('/items', (req, res) => {
    console.log(req.body)
    client.createItem({name: req.body.name}, (err: any, response: any) => {
        if (err) return res.status(500).send(err);
        res.send(response);
    });
});

app.get('/items/:id', (req, res) => {

    client.readItem({id: req.params.id}, (err: any, response: any) => {
        if (err) return res.status(500).send(err);
        res.send(response);
    });
});

app.put('/items/:id', (req, res) => {
    client.updateItem({id: req.params.id, name: req.body.name}, (err: any, response: any) => {
        if (err) return res.status(500).send(err);
        res.send(response);
    });
});

app.delete('/items/:id', (req, res) => {
    client.deleteItem({id: req.params.id}, (err: any, response: any) => {
        if (err) return res.status(500).send(err);
        res.send(response);
    });
});

app.listen(3001, () => {
    console.log('REST API server running at http://localhost:3001');
});
