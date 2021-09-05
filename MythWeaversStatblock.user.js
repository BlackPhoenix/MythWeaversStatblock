// ==UserScript==
// @name         Myth-Weavers statblock
// @namespace    http://tampermonkey.net/
// @version      0.21
// @description  A better statblock generator
// @author       BlackPhoenix
// @match        https://www.myth-weavers.com/sheet.html
// @grant        none
// @supportURL   https://github.com/BlackPhoenix/MythWeaversStatblock/issues
// @homepageURL  https://github.com/BlackPhoenix/MythWeaversStatblock
// ==/UserScript==
//
// This script uses the "Private Notes" as a template to construct the statblock. It makes a lot of assumption
// on the layout of the page, and therefore will break if Myth-Weaver changes the sheets.
//
// It replaces string in the form "::identifier::" by the value of the HTML element using the name "identifier".
// Since HTML does not guarantee that a tag name is unique, we're taking the first one. A future implementation
// might allow selecting a different item by the same tag name, such as "::identifier[2]::".
//
// Special tags:
// !!URL!!       The URL of the character sheet.

'use strict';

// Add a new button "Statblock" to the left of the Save button.
var sbButtonLI = document.createElement("LI");
var sbButton = document.createElement("BUTTON");
sbButton.innerHTML = "Statblock";
sbButton.className = "btn btn-primary";
sbButtonLI.appendChild(sbButton);
sbButton.onclick = WriteStatblock;
var sheetControls = document.getElementsByClassName("sheetcontrols")[0];
sheetControls.insertBefore(sbButtonLI, sheetControls.childNodes[0]);

// End main

function WriteStatblock() {
    // __txt_private_notes
    var template = "";

    // Special cases: Star Wars Saga
    if (document.title.includes(":: Star Wars Saga ::")) {
        template = document.getElementsByName("__txt_private_notes")[0].value;
    } else {
        // This works for D&D 5E
        template = document.getElementsByName("__txt_private_notes")[1].innerHTML;
    }

    // Some hard-coded values
    template = template.replace("!!URL!!", window.location.href);

    var reSearch = /::(\+?)(\w+)::/g;
    var fields;
    var output = template;
    while ((fields = reSearch.exec(template)) !== null) {
        // Get the value from the designated field
        var field = document.getElementsByName(fields[2])[0];
        if (field == null) {
            alert(fields[2] + " is undefined!");
        }
        var value = field.value;
        //alert(fields[1]);
        if (fields[1] == "+") {
            // Apparently there is no function in Javascript to format a number, so...
            if (value >= 0) {
                value = "+" + value;
            }
        }
        output = output.replace(fields[0], value);
    }
    
    if (document.title.includes(":: Star Wars Saga ::")) {
        _sheet.set("__txt_statsummary", output);
    } else {
        // This works for D&D 5E
        _sheet.set("__txt_statblock", output);
    }
}
