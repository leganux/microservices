import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { v4 as uuidv4 } from 'uuid';

const PROTO_PATH = __dirname + '/../proto/crud.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const crudProto = grpc.loadPackageDefinition(packageDefinition).crud;

const items: { [key: string]: string } = {};

const createItem = (call: any, callback: any) => {
    const id = uuidv4();
    items[id] = call.request.name;
    callback(null, { id });
};

const readItem = (call: any, callback: any) => {
    const name = items[call.request.id];
    callback(null, { name });
};

const updateItem = (call: any, callback: any) => {
    if (items[call.request.id]) {
        items[call.request.id] = call.request.name;
        callback(null, { success: true });
    } else {
        callback(null, { success: false });
    }
};

const deleteItem = (call: any, callback: any) => {
    if (items[call.request.id]) {
        delete items[call.request.id];
        callback(null, { success: true });
    } else {
        callback(null, { success: false });
    }
};

const server = new grpc.Server();
server.addService((crudProto as any).CrudService.service, {
    createItem,
    readItem,
    updateItem,
    deleteItem,
});
server.bindAsync('127.0.0.1:50059', grpc.ServerCredentials.createInsecure(), () => {
    console.log('gRPC server running at http://127.0.0.1:50059');

});
