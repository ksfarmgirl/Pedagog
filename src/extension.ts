/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * extension.ts (and activateMockDebug.ts) forms the "plugin" that plugs into VS Code and contains the code that
 * connects VS Code with the debug adapter.
 * 
 * extension.ts contains code for launching the debug adapter in three different ways:
 * - as an external program communicating with VS Code via stdin/stdout,
 * - as a server process communicating with VS Code via sockets or named pipes, or
 * - as inlined code running in the extension itself (default).
 * 
 * Since the code in extension.ts uses node.js APIs it cannot run in the browser.
 */

'use strict';

import * as Net from 'net';
import * as vscode from 'vscode';
import { PythonEvaluator } from 'arepl-backend';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { platform } from 'process';
import { ProviderResult } from 'vscode';
import { MockDebugSession } from './mockDebug';
import { activateMockDebug, workspaceFileAccessor } from './activateMockDebug';

/*
 * The compile time flag 'runMode' controls how the debug adapter is run.
 * Please note: the test suite only supports 'external' mode.
 */
const runMode: 'external' | 'server' | 'namedPipeServer' | 'inline' = 'inline';

//Python extension check variable
let extPy;

export async function activate(context: vscode.ExtensionContext) {

	//Set python extension 
	extPy = vscode.extensions.getExtension("ms-python.python");

	//Check for python extension 
	if(!extPy){
		vscode.window.showErrorMessage("You must have the official Python extension to use this debugger!");
		return;
	}
  if(!extPy.isActive){
		await extPy.activate();
	}

	// Track currently webview panel
  //let currentPanel = undefined;
  // ^^^ simplified from below line of commented code
  let currentPanel = vscode.WebviewPanel;
  //var vars = dump(5);

  context.subscriptions.push(
    vscode.commands.registerCommand('preview.start', () => {

        if (currentPanel) {
          // If we already have a panel, show it in the target column
          currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
          // Otherwise, create a new panel
          currentPanel = vscode.window.createWebviewPanel(
            'preview',
            'Preview',
            vscode.ViewColumn.Two,
            {
              enableScripts: true
            }
          );
      currentPanel.webview.html = getWebviewContent();

       // Reset when the current panel is closed
       currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }
    })
  );

  function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
        <h1 id="lines-of-code-counter">0</h1>
    
        <script>
            const counter = document.getElementById('lines-of-code-counter');
    
            let count = 0;
            setInterval(() => {
                counter.textContent = count++;
            }, 100);
        </script>
    </body>
    </html>`;
  }

  // Opens preview window on extension startup by using preview.start
  vscode.commands.executeCommand('preview.start');

	// debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
	switch (runMode) {
		case 'server':
			// run the debug adapter as a server inside the extension and communicate via a socket
			activateMockDebug(context, new MockDebugAdapterServerDescriptorFactory());
			break;

		case 'namedPipeServer':
			// run the debug adapter as a server inside the extension and communicate via a named pipe (Windows) or UNIX domain socket (non-Windows)
			activateMockDebug(context, new MockDebugAdapterNamedPipeServerDescriptorFactory());
			break;

		case 'external': default:
			// run the debug adapter as a separate process
			activateMockDebug(context, new DebugAdapterExecutableFactory());
			break;

		case 'inline':
			// run the debug adapter inside the extension and directly talk to it
			activateMockDebug(context);
			break;
	}
}

export function deactivate() {
	// nothing to do
}

class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {

	// The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
	// Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

	createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): ProviderResult<vscode.DebugAdapterDescriptor> {
		// param "executable" contains the executable optionally specified in the package.json (if any)

		// use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
		if (!executable) {
			const command = "absolute path to my DA executable";
			const args = [
				"some args",
				"another arg"
			];
			const options = {
				cwd: "working directory for executable",
				env: { "envVariable": "some value" }
			};
			executable = new vscode.DebugAdapterExecutable(command, args, options);
		}

		// make VS Code launch the DA executable
		return executable;
	}
}

class MockDebugAdapterServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

	private server?: Net.Server;

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			// start listening on a random port
			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor);
				session.setRunAsServer(true);
				session.start(socket as NodeJS.ReadableStream, socket);
			}).listen(0);
		}

		// make VS Code connect to debug server
		return new vscode.DebugAdapterServer((this.server.address() as Net.AddressInfo).port);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}

class MockDebugAdapterNamedPipeServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

	private server?: Net.Server;

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			// start listening on a random named pipe path
			const pipeName = randomBytes(10).toString('utf8');
			const pipePath = platform === "win32" ? join('\\\\.\\pipe\\', pipeName) : join(tmpdir(), pipeName);

			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor);
				session.setRunAsServer(true);
				session.start(<NodeJS.ReadableStream>socket, socket);
			}).listen(pipePath);
		}

		// make VS Code connect to debug server
		return new vscode.DebugAdapterNamedPipeServer(this.server.address() as string);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}
