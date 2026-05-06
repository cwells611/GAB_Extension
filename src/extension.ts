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
        //if the reset button is clicked, reset the colors to the default colors
        if(message.reset) {
            const editorConfig: Record<string, any> = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
            editorConfig['[GAB Theme]'] = {};
            editorConfig['[GAB Theme]'].textMateRules = [];
            vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', editorConfig, vscode.ConfigurationTarget.Global);
            //post a message back to the webview to update color inputs 
            colorPanel.webview.postMessage({
                reset: true
            });
            return;
        }
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

function checkColor(scope: string, defaultColor: string): string {
    let settings: Record<string, any> =vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
    let color: string = defaultColor;
    //if there are no settings return default color 
    if(!settings['[GAB Theme]']) {
        return color;
    }
    //look for passed scope in in rules and return color to set the input value
    let rules: any[] = settings['[GAB Theme]'].textMateRules;
    let index: number = rules.findIndex(rules => rules.scope === scope); 
    if(index != -1) {
        color = rules[index].settings.foreground;
    }
    return color; 
}

//get the HTML content for the webview (1 labeled color input for each scope in gab-theme) 
//add event listeners to all inputs of type color to send message of scope and color back to extension
export function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style> 
            input[type="color"] {
                width: 100px;
                height: 30px;
                border: none;
            }
        </style>
    </head>
    <body>
    <h1>GAB Syntax Highlighting Customization</h1>
    <h3>Editor</h3>
    <label for="editor.background">Background: </label>
    <input type="color" id="editor.background" name="editor.background" value="${checkColor('editor.background', '#2b2b2b')}">
    <label for="editor.foreground">Foreground: </label>
    <input type="color" id="editor.foreground" name="editor.foreground" value="${checkColor('editor.foreground', '#d4d4d4')}">
    <h3>GAB</h3>
    <label for="comments">Comments: </label>
    <input type="color" id="comments" name="comments" value="${checkColor('comments', '#57a64b' )}">
    <label for="strings">Strings: </label>
    <input type="color" id="strings" name="strings" value="${checkColor('strings', '#d69d82')}">
    <label for="constant.character.escape">Escape Characters: </label>
    <input type="color" id="constant.character.escape" name="constant.character.escape" value="${checkColor('constant.character.escape', '#2938d9')}">
    <label for="namespaces">Namespaces: </label>
    <input type="color" id="namespaces" name="namespaces" value="${checkColor('namespaces', '#4ec9b0')}">
    <label for="namespaces.declare_variables">Declaring Variables: </label>
    <input type="color" id="namespaces.declare_variables" name="namespaces.declare_variables" value="${checkColor('namespaces.declare_variables', '#4ec9b0')}">
    <label for="namespaces.variables">Variables: </label>
    <input type="color" id="namespaces.variables" name="namespaces.variables" value="${checkColor('namespaces.variables', '#4ec9b0')}">
    <label for="namespaces.subroutines">Subroutines: </label>
    <input type="color" id="namespaces.subroutines" name="namespaces.subroutines" value="${checkColor('namespaces.subroutines', '#4ec9b0')}">
    <label for="reset">Restore Defaults</label> 
    <input type="button" id="reset" value="Restore Defaults">
    <script>
        const vscode = acquireVsCodeApi();
        const colorInputs = document.querySelectorAll('input[type="color"]');
        const resetButton = document.getElementById('reset');
        const defaultColors = {
            'editor.background': '#2b2b2b',
            'editor.foreground': '#d4d4d4',
            'comments': '#57a64b',
            'strings': '#d69d82',
            'constant.character.escape': '#2938d9',
            'namespaces': '#4ec9b0',
            'namespaces.declare_variables': '#4ec9b0',
            'namespaces.variables': '#4ec9b0',
            'namespaces.subroutines': '#4ec9b0',
        };
        (function() {
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
        resetButton.addEventListener('click', () => {
            vscode.postMessage({
                reset: true
            });
        });
        window.addEventListener('message', event => {
            if(event.data.reset) {
                colorInputs.forEach(input => {
                    input.value = defaultColors[input.name];
                });
            }  
        });
    </script>
    </body>
    </html>`; 
}


export function deactivate() {}