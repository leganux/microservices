import express from 'express';
import * as amqp from 'amqplib';
import morgan from 'morgan';
import {v4 as uuidv4} from 'uuid';

const queue = 'crud_queue';

const sendRPCMessage = async (message: any) => {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const q = await channel.assertQueue('', {exclusive: true});

    return new Promise((resolve, reject) => {
        const correlationId = uuidv4();

        channel.consume(q.queue, (msg) => {
            if (msg?.properties.correlationId === correlationId) {
                resolve(JSON.parse(msg.content.toString()));
            }
        }, {noAck: true});

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            correlationId,
            replyTo: q.queue
        });
    });
};

const app = express();
app.use(express.json());
app.use(morgan('dev')); // Agrega morgan para el registro de solicitudes

app.post('/items', async (req, res) => {
    const response = await sendRPCMessage({action: 'create', name: req.body.name});
    res.send(response);
});

app.get('/items/:id', async (req, res) => {
    const response = await sendRPCMessage({action: 'read', id: req.params.id});
    res.send(response);
});

app.put('/items/:id', async (req, res) => {
    const response = await sendRPCMessage({action: 'update', id: req.params.id, name: req.body.name});
    res.send(response);
});

app.delete('/items/:id', async (req, res) => {
    const response = await sendRPCMessage({action: 'delete', id: req.params.id});
    res.send(response);
});

app.listen(3000, () => {
    console.log('REST API server running at http://localhost:3000');
});
