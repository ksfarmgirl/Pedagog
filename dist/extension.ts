import * as path from 'path';
import { workspace, commands, ExtensionContext, OutputChannel } from 'vscode';
import { WebSocket } from 'ws';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    ShowDocumentRequest,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
    const socketPort = workspace.getConfiguration('extension').get('port', 7000);
    let socket: WebSocket | null = null;

    commands.registerCommand('extension.startStreaming', () => {
        //establish connection
        socket = new WebSocket(`ws://localhost:${socketPort}`);
    });

    // server is implemented in node.......
    const serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    );

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        }
    };

    //log
    let log = '';
    const websocketOutputChannel: OutputChannel = {
        name: 'websocket',
        //appending logs to send later
        append(value: string) {
            log += value;
            console.log(value);
        },
        appendLine(value: string) {
            log += value;
            //don't send logs until ws initialization
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(log);
            }
            log = '';
        },
        clear() { },
        show() { },
        hide() { },
        dispose() { },
        replace() { }
    };

    //options to control language client??
    const clientOptions: LanguageClientOptions = {
        //register server for plain text documents???
        documentSelector: [{ scheme: 'file', language: 'plaintext' }],
        synchronize: {
            //notify the server about file changes to ....???
            //Not sure how to change this, or what to pull???????
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        //hijacks all lsp logs and redirect them to a specific port through websocket connection
        outputChannel: websocketOutputChannel
    };

    //create the language client and start the client
    client = new LanguageClient(
        'languageServerExample',
        'Language Server Example',
        serverOptions,
        clientOptions
    );

    //start the client this will also launch server???
    await client.start();
}

export function deactivate(): Thenable<void> {
    if (!client) { //undefined not defined
        //return undefined;
    }
    return client.stop();
}