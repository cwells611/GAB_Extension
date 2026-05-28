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
        //get the gab theme config from the settings.json
        let gabThemeConfig: Record<string, any> = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
        //get the editor settings from the settings.json
        let editorConfig: Record<string, any> = vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
        //if the reset button is clicked, reset the colors to the default colors
        if(message.reset) {
            gabThemeConfig['[GAB Theme]'] = {};
            gabThemeConfig['[GAB Theme]'].textMateRules = [];
            editorConfig['[GAB Theme]'] = {};
            vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', gabThemeConfig, vscode.ConfigurationTarget.Global);
            vscode.workspace.getConfiguration('workbench').update('colorCustomizations', editorConfig, vscode.ConfigurationTarget.Global);
            //post a message back to the webview to update color inputs 
            colorPanel.webview.postMessage({
                reset: true
            });
            return;
        }
        if(message.type === 'gab') {
            //if GAB Theme does not exist in setting.json create it and textmaterules as {} and []
            if(!gabThemeConfig['[GAB Theme]']) {
                gabThemeConfig['[GAB Theme]'] = {};
                gabThemeConfig['[GAB Theme]'].textMateRules = []; 
            }
            //update the scope from the message with the new color 
            let rules: any[] = gabThemeConfig['[GAB Theme]'].textMateRules; 
            let index: number = rules.findIndex(rule => rule.scope === message.scope);
            if(index == -1) {
                rules.push({scope: message.scope, settings: {"foreground": message.color}}); 
            }
            else {
                rules[index].settings = {"foreground": message.color};
            }
            //update object with new rules (color)
            gabThemeConfig['[GAB Theme]'].textMateRules = rules;
            //update the settings.json with the new editorConfig
            vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', gabThemeConfig, vscode.ConfigurationTarget.Global);
        }
        //update edit
        if(message.type === 'editor') {
            if(!editorConfig['[GAB Theme]']) {
                editorConfig['[GAB Theme]'] = {};
            }
            editorConfig['[GAB Theme]'][message.scope] = message.color;
            vscode.workspace.getConfiguration('workbench').update('colorCustomizations', editorConfig, vscode.ConfigurationTarget.Global);
        }
    });
}

function checkColor(scope: string, defaultColor: string): string {
    let tokenSettings: Record<string, any> =vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
    let editorSettings: Record<string, any> =vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
    
    const editorScope = scope.startsWith('editor.') || scope.startsWith('editorGutter') || scope.startsWith('editorLineNumber');

    if(editorScope) {
        const custom = editorSettings['[GAB Theme]']?.[scope];
        return custom ?? defaultColor;
    }
    
    const rules: any[] = tokenSettings['[GAB Theme]']?.textMateRules || [];
    const index = rules.findIndex(rule => rule.scope === scope);
    if(index != -1) {
        return rules[index].settings.foreground ?? defaultColor;
    }
    return defaultColor;
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
            body {
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                padding: 20px;
            }
            h1 {
                font-size: 1.4em;
                margin-bottom: 20px;
            }
            .section {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 16px;
            }
            .section h3 {
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 1.1em;
            }
            .color-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 0;
            }
            .color-row label {
                flex: 1;
            }
            input[type="color"] {
                width: 60px;
                height: 28px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                cursor: pointer;
                background: none;
                padding: 2px;
            }
            input[type="color"]::-webkit-color-swatch-wrapper {
                padding: 0;
                border-radius: 6px;
            }
            input[type="color"]::-webkit-color-swatch {
                border: none;
                border-radius: 6px;
            }
            #reset {
                margin-top: 16px;
                padding: 8px 16px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
            }
            #reset:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
    <h1>GAB Syntax Highlighting Customization</h1>

    <div class="section">
        <h3>Editor</h3>
        <div class="color-row">
            <label for="editor.background">Background</label>
            <input type="color" id="editor.background" name="editor.background" value="${checkColor('editor.background', '#2b2b2b')}">
        </div>
        <div class="color-row">
            <label for="editor.foreground">Foreground</label>
            <input type="color" id="editor.foreground" name="editor.foreground" value="${checkColor('editor.foreground', '#d4d4d4')}">
        </div>
        <div class="color-row">
            <label for="editor.lineHighlightBackground">Active Line Background</label>
            <input type="color" id="editor.lineHighlightBackground" name="editor.lineHighlightBackground" value="${checkColor('editor.lineHighlightBackground', '#2a2a2a')}">
        </div>
        <div class="color-row">
            <label for="editor.selectionBackground">Selection Background</label>
            <input type="color" id="editor.selectionBackground" name="editor.selectionBackground" value="${checkColor('editor.selectionBackground', '#264f78')}">
        </div>
        <div class="color-row">
            <label for="editor.selectionHighlightBackground">Selection Highlight Background</label>
            <input type="color" id="editor.selectionHighlightBackground" name="editor.selectionHighlightBackground" value="${checkColor('editor.selectionHighlightBackground', '#264f78')}">
        </div>
        <div class="color-row">
            <label for="editorGutter.background">Editor Gutter Background</label>
            <input type="color" id="editorGutter.background" name="editorGutter.background" value="${checkColor('editorGutter.background', '#264f78')}">
        </div>
        <div class="color-row">
            <label for="editorLineNumber.foreground">Editor Line Number</label>
            <input type="color" id="editorLineNumber.foreground" name="editorLineNumber.foreground" value="${checkColor('editorLineNumber.foreground', '#264f78')}">
        </div>
    </div>

    <div class="section">
        <h3>GAB</h3>
        <div class="color-row">
            <label for="comments">Comments</label>
            <input type="color" id="comments" name="comments" value="${checkColor('comments', '#57a64b')}">
        </div>
        <div class="color-row">
            <label for="strings">Strings</label>
            <input type="color" id="strings" name="strings" value="${checkColor('strings', '#d69d82')}">
        </div>
        <div class="color-row">
            <label for="constant.character.escape">Escape Characters</label>
            <input type="color" id="constant.character.escape" name="constant.character.escape" value="${checkColor('constant.character.escape', '#2938d9')}">
        </div>
        <div class="color-row">
            <label for="namespaces">Namespaces</label>
            <input type="color" id="namespaces" name="namespaces" value="${checkColor('namespaces', '#4ec9b0')}">
        </div>
        <div class="color-row">
            <label for="namespaces.declare_variables">Declaring Variables</label>
            <input type="color" id="namespaces.declare_variables" name="namespaces.declare_variables" value="${checkColor('namespaces.declare_variables', '#4ec9b0')}">
        </div>
        <div class="color-row">
            <label for="namespaces.variables">Variables</label>
            <input type="color" id="namespaces.variables" name="namespaces.variables" value="${checkColor('namespaces.variables', '#4ec9b0')}">
        </div>
        <div class="color-row">
            <label for="namespaces.subroutines">Subroutines</label>
            <input type="color" id="namespaces.subroutines" name="namespaces.subroutines" value="${checkColor('namespaces.subroutines', '#4ec9b0')}">
        </div>
        <div class="color-row">
            <label for="logic">Logic Operators</label>
            <input type="color" id="logic" name="logic" value="${checkColor('logic', '#ffffff')}">
        </div>
    </div>

    <button id="reset">Restore Defaults</button>
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
                    let type = 'gab'; 
                    if(scope.startsWith('editor.') || scope.startsWith('editorGutter') || scope.startsWith('editorLineNumber')) {
                        type = 'editor';
                    }
                    vscode.postMessage({
                        type: type,
                        scope: scope,
                        color: color
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