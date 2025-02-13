"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const node_fetch_1 = require("node-fetch");
const vscode = require("vscode");
const ProteinViewerPanel_1 = require("./panels/ProteinViewerPanel");
const glob = require("glob");
async function activate(context) {
    const helloCommand = vscode.commands.registerCommand('protein-viewer.start', () => {
        showInputBox().then((accession) => {
            console.log(accession);
            ProteinViewerPanel_1.ProteinViewerPanel.render(context.extensionUri, accession);
        });
    });
    const activateFromFiles = vscode.commands.registerCommand('protein-viewer.activateFromFiles', (file_uri, selectedFiles) => {
        console.log(file_uri);
        console.log(selectedFiles);
        ProteinViewerPanel_1.ProteinViewerPanel.renderFromFiles(context.extensionUri, selectedFiles);
    });
    const activateFromFolder = vscode.commands.registerCommand('protein-viewer.activateFromFolder', (uri) => {
        handleFolderActivation(context, uri);
    });
    const ESMFold = vscode.commands.registerCommand('protein-viewer.ESMFold', () => {
        showSequenceInputBox().then((sequence) => {
            getfold(sequence).then((pdb) => {
                writeFoldToFile(pdb).then(async (file_uri) => {
                    console.log(file_uri);
                    ProteinViewerPanel_1.ProteinViewerPanel.renderFromFiles(context.extensionUri, [vscode.Uri.file(file_uri)]);
                });
            });
        });
    });
    //context.subscriptions.push(...[helloCommand, activateFromFile]);
    context.subscriptions.push(helloCommand);
    context.subscriptions.push(activateFromFiles);
    context.subscriptions.push(activateFromFolder);
    context.subscriptions.push(ESMFold);
}
// this method is called when your extension is deactivated
// export function deactivate() {}
async function showInputBox() {
    const accession = await vscode.window.showInputBox({
        value: '',
        placeHolder: 'Enter a PDB or AlphaFoldDB (UniProt) accession',
    });
    return accession;
}
async function showSequenceInputBox() {
    const sequence = await vscode.window.showInputBox({
        value: '',
        placeHolder: 'Enter a protein sequence',
    });
    return sequence;
}
async function writeFoldToFile(file_contents) {
    const time = new Date().getTime();
    const fname = '/esmfold_' + time.toString() + '.pdb';
    const setting = vscode.Uri.parse('untitled:' + vscode.workspace.rootPath + fname);
    await vscode.workspace.openTextDocument(setting).then((a) => {
        vscode.window.showTextDocument(a, 1, false).then(e => {
            e.edit(edit => {
                edit.insert(new vscode.Position(0, 0), file_contents);
                a.save();
            });
        });
    });
    console.log('wrote to test file.');
    console.log(setting);
    return setting.fsPath;
}
async function getfold(sequence) {
    const url = 'https://api.esmatlas.com/foldSequence/v1/pdb/';
    console.log(sequence);
    const response = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        body: sequence,
    });
    const body = await response.text();
    return body;
}
// Update the function signature to accept context parameter
async function handleFolderActivation(context, uri) {
    // Define the file extensions we support
    const supportedExtensions = [
        '.pdb', '.pdb.gz', '.PDB',
        '.mol2', '.MOL2',
        '.sdf', '.SDF',
        '.mmCIF', '.mmcif', '.MMCIF',
        '.mol', '.MOL',
        '.xyz', '.XYZ',
        '.ent', '.ENT',
        '.pdbqt', '.PDBQT',
        '.cif', '.CIF', '.cif.gz',
        '.mcif', '.MCIF',
        '.gro', '.GRO',
        '.dcd', '.xtc'
    ];
    // Create glob pattern for supported files
    const pattern = `${uri.fsPath}/**/*@(${supportedExtensions.join('|')})`;
    // Find all matching files in the folder
    const files = glob.sync(pattern);
    if (files.length === 0) {
        vscode.window.showInformationMessage('No supported structure files found in folder');
        return;
    }
    // Convert file paths to URIs
    const fileUris = files.map(file => vscode.Uri.file(file));
    // Now we have access to context.extensionUri
    ProteinViewerPanel_1.ProteinViewerPanel.renderFromFiles(context.extensionUri, fileUris);
}
//# sourceMappingURL=extension.js.map