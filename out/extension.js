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
        //get the editor config from the settings.json
        let editorConfig = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
        //if GAB Theme does not exist in setting.json create it and textmaterules as {} and []
        if (!editorConfig['[GAB Theme]']) {
            editorConfig['[GAB Theme]'] = {};
            editorConfig['[GAB Theme]'].textMateRules = [];
        }
        //update the scope from the message with the new color 
        let rules = editorConfig['[GAB Theme]'].textMateRules;
        let index = rules.findIndex(rule => rule.scope === message.scope);
        if (index == -1) {
            rules.push({ scope: message.scope, settings: message.settings });
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
function checkColor(scope, defaultColor) {
    let settings = vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {};
    let color = defaultColor;
    //if there are no settings return default color 
    if (!settings['[GAB Theme]']) {
        return color;
    }
    //look for passed scope in in rules  
    let rules = settings['[GAB Theme]'].textMateRules;
    let index = rules.findIndex(rules => rules.scope === scope);
    if (index != -1) {
        console.log(rules[index].scope + ": Custom Color: " + rules[index].settings.foreground);
        color = rules[index].settings.foreground;
    }
    else {
        console.log(scope + ": Default Color: " + color);
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
    </head>
    <body>
    <h1>GAB Syntax Highlighting Customization</h1>
    <h3>Editor</h3>
    <div id="editor-colors">
        <label for="editor.background">Background: </label>
        <input type="color" id="editor.background" name="editor.background" value="${checkColor('editor.background', '#2b2b2b')}">
        <br>
        <label for="editor.foreground">Foreground: </label>
        <input type="color" id="editor.foreground" name="editor.foreground" value="${checkColor('editor.foreground', '#d4d4d4')}">
        <br>
    </div>
    <h3>GAB</h3>
    <div id="gab-colors">
        <label for="comments">Comments: </label>
        <input type="color" id="comments" name="comments" value="${checkColor('comments', '#57a64b')}">
        <br>
        <label for="strings">Strings: </label>
        <input type="color" id="strings" name="strings" value="${checkColor('strings', '#d69d82')}">
        <br>
        <label for="constant.character.escape">Escape Characters: </label>
        <input type="color" id="constant.character.escape" name="constant.character.escape" value="${checkColor('constant.character.escape', '#2938d9')}">
        <br>
        <label for="namespaces">Namespaces: </label>
        <input type="color" id="namespaces" name="namespaces" value="${checkColor('namespaces', '#4ec9b0')}">
        <br>
        <label for="namespaces.declare_variables">Declaring Variables: </label>
        <input type="color" id="namespaces.declare_variables" name="namespaces.declare_variables" value="${checkColor('namespaces.declare_variables', '#4ec9b0')}">
        <br>
        <label for="namespaces.variables">Variables: </label>
        <input type="color" id="namespaces.variables" name="namespaces.variables" value="${checkColor('namespaces.variables', '#4ec9b0')}">
        <br>
        <label for="namespaces.subroutines">Subroutines: </label>
        <input type="color" id="namespaces.subroutines" name="namespaces.subroutines" value="${checkColor('namespaces.subroutines', '#4ec9b0')}">
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
function deactivate() { }
//# sourceMappingURL=extension.js.map