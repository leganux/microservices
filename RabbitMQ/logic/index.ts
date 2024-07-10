import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

const queue = 'crud_queue';
const items: { [key: string]: string } = {};

const createItem = (name: string) => {
    const id = uuidv4();
    items[id] = name;
    return { id };
};

const readItem = (id: string) => {
    const name = items[id];
    return { name };
};

const updateItem = (id: string, name: string) => {
    if (items[id]) {
        items[id] = name;
        return { success: true };
    } else {
        return { success: false };
    }
};

const deleteItem = (id: string) => {
    if (items[id]) {
        delete items[id];
        return { success: true };
    } else {
        return { success: false };
    }
};

const processMessage = async (msg: amqp.ConsumeMessage | null, channel: amqp.Channel) => {
    if (msg) {
        try {
            const content = JSON.parse(msg.content.toString());
            let response;

            switch (content.action) {
                case 'create':
                    response = createItem(content.name);
                    break;
                case 'read':
                    response = readItem(content.id);
                    break;
                case 'update':
                    response = updateItem(content.id, content.name);
                    break;
                case 'delete':
                    response = deleteItem(content.id);
                    break;
                default:
                    response = { error: 'Invalid action' };
            }

            channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
                correlationId: msg.properties.correlationId
            });
            channel.ack(msg);
        } catch (error) {
            console.error('Error processing message', error);
            channel.nack(msg);
        }
    }
};

const startServer = async () => {
    try {
        const conn = await amqp.connect('amqp://localhost');
        const channel = await conn.createChannel();
        await channel.assertQueue(queue, { durable: false });
        console.log('Waiting for messages in %s', queue);
        channel.consume(queue, (msg) => processMessage(msg, channel));
    } catch (error) {
        console.error('Failed to start server', error);
    }
};

startServer().catch(console.warn);
