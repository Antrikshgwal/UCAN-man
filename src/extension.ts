import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('UCAN-man extension is now active!');
    console.log('Registering command: ucanman.decodeUcan');

    const disposable = vscode.commands.registerCommand('ucanman.decodeUcan', () => {
        console.log('ucanman.decodeUcan command was triggered!');
        vscode.window.showInformationMessage('UCAN Inspector opened!');
        
    });

    context.subscriptions.push(disposable);
    console.log('Command registered successfully');
}

export function deactivate() {
    console.log('UCAN-man extension is now deactivated');
}
