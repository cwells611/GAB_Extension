"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.createWebViewPanel = createWebViewPanel;
exports.getWebviewContent = getWebviewContent;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const command = "gab.customizeTheme";
    const commandHandler = () => {
        console.log('Customizing GAB Theme');
        createWebViewPanel();
    };
    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}
//create a webview panel 
function createWebViewPanel() {
    const colorPanel = vscode.window.createWebviewPanel('gab-syntax-highlighting', 'GAB Syntax Highlighting Customization', vscode.ViewColumn.Beside, { enableScripts: true });
    //set HTML content for the webview
    colorPanel.webview.html = getWebviewContent();
    //check to see if we have recieved a message from the webview
    colorPanel.webview.onDidReceiveMessage(message => {
        //get the gab theme config from the settings.json
        let gabThemeConfig = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
        //get the editor settings from the settings.json
        let editorConfig = vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
        //if the reset button is clicked, reset the colors to the default colors
        if (message.reset) {
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
        if (message.type === 'gab') {
            //if GAB Theme does not exist in setting.json create it and textmaterules as {} and []
            if (!gabThemeConfig['[GAB Theme]']) {
                gabThemeConfig['[GAB Theme]'] = {};
                gabThemeConfig['[GAB Theme]'].textMateRules = [];
            }
            //update the scope from the message with the new color 
            let rules = gabThemeConfig['[GAB Theme]'].textMateRules;
            let index = rules.findIndex(rule => rule.scope === message.scope);
            if (index == -1) {
                rules.push({ scope: message.scope, settings: { "foreground": message.color } });
            }
            else {
                rules[index].settings = { "foreground": message.color };
            }
            //update object with new rules (color)
            gabThemeConfig['[GAB Theme]'].textMateRules = rules;
            //update the settings.json with the new editorConfig
            vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', gabThemeConfig, vscode.ConfigurationTarget.Global);
        }
        if (message.type === 'editor') {
            if (!editorConfig['[GAB Theme]']) {
                editorConfig['[GAB Theme]'] = {};
            }
            editorConfig['[GAB Theme]'][message.scope] = message.color;
            vscode.workspace.getConfiguration('workbench').update('colorCustomizations', editorConfig, vscode.ConfigurationTarget.Global);
        }
    });
}
function checkColor(scope, defaultColor) {
    let settings = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
    let editorSettings = vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {};
    let color = defaultColor;
    //if there are no settings return default color 
    if (!settings['[GAB Theme]']) {
        return color;
    }
    if (!editorSettings['[GAB Theme]']) {
        return color;
    }
    //look for passed scope in in rules and return color to set the input value
    let rules = settings['[GAB Theme]'].textMateRules;
    let index = rules.findIndex(rules => rules.scope === scope);
    if (index != -1) {
        color = rules[index].settings.foreground;
    }
    if (editorSettings['[GAB Theme]'][scope]) {
        color = editorSettings['[GAB Theme]'][scope];
    }
    return color;
}
//get the HTML content for the webview (1 labeled color input for each scope in gab-theme) 
//add event listeners to all inputs of type color to send message of scope and color back to extension
function getWebviewContent() {
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
                    if(scope === 'editor.background' || scope === 'editor.foreground') {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map