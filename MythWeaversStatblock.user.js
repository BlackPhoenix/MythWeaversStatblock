// ==UserScript==
// @name         Myth-Weavers statblock
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  A better statblock generator
// @author       BlackPhoenix
// @match        https://www.myth-weavers.com/sheet.html
// @require      https://pagecdn.io/lib/mathjs/9.4.4/math.min.js
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
//
// conditional:
// {? something = some value {T} result_true {F} result_false ?}
// Note that "something" and/or "some value" could be in the form of ::identifier::, which would have been
// converted to their actual values in the process. "<" and ">" are also accepted in addition to "=".

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

    var output = statblockParse(template);

    if (document.title.includes(":: Star Wars Saga ::")) {
        _sheet.set("__txt_statsummary", output);
    } else {
        // This works for D&D 5E
        _sheet.set("__txt_statblock", output);
    }
}

// Parse a value.
// output - the text to parse. Named output for historical reasons - it's also the output of the function
// nestlevel - this is to prevent circular references
function statblockParse(output, nestlevel = 1) {
    if (nestlevel > 25) {
        // Safeguard to prevent circular references
        return "Too much nesting";
    } else {
        // Replace fields
        var reSearch = /::(?<sign>\+?)(?<identifier>\w+)::/g;
        var fieldnames;
        while ((fieldnames = reSearch.exec(output)) !== null) {
            // Get the value from the designated field
            var fields = document.getElementsByName(fieldnames.groups.identifier);    //fieldnames[2]);
            if (fields == null) {
                alert(fieldnames.groups.identifier + " is undefined!");
            } else {
                // By default, we're going to take the first field in the list
                var field = fields[0];

                // Check if we're dealing with a radio button group
                if (fields[0].type == "radio") {
                    // Yes, so we'll return the one that is checked
                    for (let fieldNo = 0; fieldNo < fields.length; fieldNo++) {
                        if (fields[fieldNo].checked) {
                            field = fields[fieldNo];
                        }
                    }
                }

                var value = "";

                if (field.type == "checkbox") {
                    value = (field.checked ? "yes" : "no");
                } else {
                    value = statblockParse(field.value, nestlevel + 1);
                }

                //alert(fields[1]);
                if (fieldnames.groups.sign == "+") {
                    // Apparently there is no function in Javascript to format a number, so...
                    if (value >= 0) {
                        value = "+" + value;
                    }
                }
                output = output.replace(fieldnames[0], value);
            }

            // Reset the starting position of the RegEx so that we may retry already replaced text that contains placeholders.
            reSearch.lastIndex = 0;
        }

        // Do math:
        // {MATH.extra(expression)}
        // The ".extra" is optional. Supported are:
        //  - .round    Round to the nearest integer
        reSearch = /{MATH(?<extra>\.\w*)?\((?<expression>.*?)\)}/gs;
        var mathParts;
        while ((mathParts = reSearch.exec(output)) != null) {
            value = math.evaluate(mathParts.groups.expression);

            if(mathParts.groups.extra) {
                switch(mathParts.groups.extra.toUpperCase()) {
                    case ".ROUND":
                        value = math.round(value, 0);
                        break;
                }
            }

            output = output.replace(mathParts[0], value);
        }

        // Conditional expressions
        reSearch = /{\?\s*(?<expleft>.*?)\s*(?<comparesign>[<=>])\s*(?<expright>.*?)\s*{T}(?<iftrue>.*?){F}(?<iffalse>.*?)\?}/gs;
        // 0: entire match
        // 1: identifier
        // 2: compare (<, =, or >)
        // 3: compare to
        // 4: value if true
        // 5: value if false
        var template = output;
        while ((fields = reSearch.exec(template)) !== null) {
            value = "";

            switch(fields.groups.comparesign) {
                case "<":
                    if (fields.groups.expleft < fields.groups.expright) {
                        value = fields.groups.iftrue;
                    } else {
                        value = fields.groups.iffalse;
                    }
                    break;
                case ">":
                    if (fields.groups.expleft > fields.groups.expright) {
                        value = fields.groups.iftrue;
                    } else {
                        value = fields.groups.iffalse;
                    }
                    break;
                case "=":
                    if (fields.groups.expleft == fields.groups.expright) {
                        value = fields.groups.iftrue;
                    } else {
                        value = fields.groups.iffalse;
                    }
                    break;
            }
            output = output.replace(fields[0], statblockParse(value, nestlevel + 1));
        }
        return output;
    }
}
