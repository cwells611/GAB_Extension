import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const command = "gab.customizeTheme";
    const commandHandler = () => {
        console.log('Customizing GAB Theme');
        createWebViewPanel();
    };
    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}

//create a webview panel 
export function createWebViewPanel() {
    const colorPanel = vscode.window.createWebviewPanel(
        'gab-syntax-highlighting', 
        'GAB Syntax Highlighting Customization', 
        vscode.ViewColumn.Beside,
        {enableScripts: true}
    );
    //set HTML content for the webview
    colorPanel.webview.html = getWebviewContent();
    //check to see if we have recieved a message from the webview
    colorPanel.webview.onDidReceiveMessage(message => {
        //get the editor config from the settings.json
        let editorConfig: Record<string, any> = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
        //if GAB Theme does not exist in setting.json create it and textmaterules as {} and []
        if(!editorConfig['[GAB Theme]']) {
            editorConfig['[GAB Theme]'] = {};
            editorConfig['[GAB Theme]'].textMateRules = []; 
        }
        //update the scope from the message with the new color 
        let rules: any[] = editorConfig['[GAB Theme]'].textMateRules; 
        let index: number = rules.findIndex(rule => rule.scope === message.scope);
        if(index == -1) {
            rules.push({scope: message.scope, settings: message.settings}); 
        }
        else {
            rules[index].settings = message.settings;
        }
        //update object with new rules (color)
        editorConfig['[GAB Theme]'].textMateRules = rules;
        //update the settings.json with the new editorConfig
        vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', editorConfig, vscode.ConfigurationTarget.Global);
    });
}

//get the HTML content for the webview (1 labeled color input for each scope in gab-theme) 
//add event listeners to all inputs of type color to send message of scope and color back to extension
export function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
    <h1>GAB Syntax Highlighting Customization</h1>
    <h3>Editor</h3>
    <div id="editor-colors">
        <label for="editor.background">Background: </label>
        <input type="color" id="editor.background" name="editor.background" value="#2b2b2b">
        <br>
        <label for="editor.foreground">Foreground: </label>
        <input type="color" id="editor.foreground" name="editor.foreground" value="#d4d4d4">
        <br>
    </div>
    <h3>GAB</h3>
    <div id="gab-colors">
        <label for="comments">Comments: </label>
        <input type="color" id="comments" name="comments" value="#57a64b">
        <br>
        <label for="strings">Strings: </label>
        <input type="color" id="strings" name="strings" value="#d69d82">
        <br>
        <label for="constant.character.escape">Escape Characters: </label>
        <input type="color" id="constant.character.escape" name="constant.character.escape" value="#2938d9">
        <br>
        <label for="namespaces">Namespaces: </label>
        <input type="color" id="namespaces" name="namespaces" value="#4ec9b0">
        <br>
        <label for="namespaces.declare_variables">Declaring Variables: </label>
        <input type="color" id="namespaces.declare_variables" name="namespaces.declare_variables" value="#4ec9b0">
        <br>
        <label for="namespaces.variables">Variables: </label>
        <input type="color" id="namespaces.variables" name="namespaces.variables" value="#4ec9b0">
        <br>
        <label for="namespaces.subroutines">Subroutines: </label>
        <input type="color" id="namespaces.subroutines" name="namespaces.subroutines" value="#4ec9b0">
    </div>
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const colorInputs = document.querySelectorAll('input[type="color"]');
            colorInputs.forEach(input => {
                input.addEventListener('change', () => {
                    const color = input.value;
                    const scope = input.name;
                    vscode.postMessage({
                        scope: scope,
                        settings: {"foreground": color}
                    });
                });
            });
        })();
    </script>
    </body>
    </html>`; 
}


export function deactivate() {}