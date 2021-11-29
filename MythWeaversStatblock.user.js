// ==UserScript==
// @name         Myth-Weavers Autofill
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  A better statblock generator
// @author       BlackPhoenix
// @match        https://www.myth-weavers.com/sheet.html
// @grant        none
// @supportURL   https://github.com/BlackPhoenix/MythWeaversStatblock/issues
// @homepageURL  https://github.com/BlackPhoenix/MythWeaversStatblock
// @oldicon         https://www.google.com/s2/favicons?domain=myth-weavers.com&size=16
// @icon         https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://myth-weavers.com&size=16
// ==/UserScript==
//
// This script uses the "Private Notes" as a template to construct the statblock. It makes a lot of assumption
// on the layout of the page, and therefore will break if Myth-Weaver changes the sheets.
//
// It replaces string in the form "::identifier::" by the value of the HTML element using the name "identifier".
// Since HTML does not guarantee that a tag name is unique, we're taking the first one.
//
// Special tags:
// ::URL::       The URL of the character sheet.
//
// conditional:
// {? something = some value {T} result_true {F} result_false ?}
// Note that "something" and/or "some value" could be in the form of ::identifier::, which would have been
// converted to their actual values in the process. "<" and ">" are also accepted in addition to "=".

'use strict';

// Global variable alias will be used to map identifiers to specific values. The identifiers can be entirely new,
// or it could be exisiting field identifiers, in which case the value in the mapping will take prececence over
// the content of the character sheet. It needs to be a global variable in order to be readable by all the
// functions of this script.
var alias = new Map();
var privateNotesField = "__txt_private_notes";
var secondPass = false;

// Add a new button "Statblock" to the left of the Save button.
var sbButtonLI = document.createElement("LI");
var sbButton = document.createElement("BUTTON");
sbButton.innerHTML = "Autofill";
sbButton.className = "btn btn-primary";
sbButtonLI.appendChild(sbButton);
sbButton.onclick = WriteStatblock;
var sheetControls = document.getElementsByClassName("sheetcontrols")[0];
sheetControls.insertBefore(sbButtonLI, sheetControls.childNodes[0]);

// End main

function WriteStatblock() {
    var template = "";
    secondPass = false;

    // Universal alias:
    alias.set("URL", window.location.href);

    template = "::" + privateNotesField + "[?=STATBLOCK]::";

    // Autofill: load templates (which should only do assignments - we are not storing the output anywhere)
    statblockParse("::[AUTOFILL]::");

    // Autofill: go through the list of aliases and set the fields' values
    alias.forEach(computeField);

    var output = statblockParse(template);
    secondPass = true;
    output = statblockParse(output);

    if (document.title.includes(":: Star Wars Saga ::")) {
        _sheet.set("__txt_statsummary", output);
    } else {
        // This works for D&D 5E
        _sheet.set("__txt_statblock", output);
    }

    // Clear all alias mapping to release memory and restart from scratch on next run.
    alias.clear();
}

function computeField(value, key, map) {
    var field = document.getElementsByName(key)[0];
    if (field) {
        //field = field[0];
        var newValue = statblockParse(value);
        if (newValue != field.value) { _sheet.set(key, newValue); }
    } else {
        console.log('Field "' + key + '" does not exist.');
    }
}

// Parse a value.
// output - the text to parse. Named output for historical reasons - it's also the output of the function
// nestlevel - this is to prevent circular references
function statblockParse(output, nestlevel = 0) {
    if (nestlevel > 25) {
        // Safeguard to prevent circular references
        return "Too much nesting";
    } else {
        // The Regular Expression started simple, but feature creep made it look scary. It actually looks for different possibilities:
        // - ::identifier::
        //   - optional leading +
        //   - optional trailing [section]
        //     - optional leading = to prevent whitespace triming
        //   - optional ="assignment"
        //     - Whitespaces before (wslead) and after (wstrail) will be removed only on assignments, to make things readable.
        //     - optional trailing ! for immediate evaluation

        // - {MATH(expression)}
        //   - optional leading +
        //   - optional extra, as in MATH.round

        // - {? condition {T}true{F}false?}

        // - {!-- comment --} will be replaced with an empty string

        // - {wd("Tenser's Floating Disk")} to turn string into a string used in Wikidot's URLs

        var reSearch = /((?<wslead>\s*)::(?<sign>\+?)(?<identifier>\w*)(\[(?<sectionModifiers>[=?]*)(?<section>[\w-]+)\]|="(?<assign>.*?)"(?<immediate>!?))?::(?<wstrail>\s*)|{(?<mathsign>\+?)(?<math>MATH)(?<extra>\.\w*)?\((?<expression>.*?)\)}|{\?\s*(?<expleft>.*?)\s*(?<comparesign>[<=>≤≥≠])\s*(?<expright>.*?)\s*{T}(?<iftrue>.*?){F}(?<iffalse>.*?)\?}|{!--(?<comment>.*?)--}|{wd\("(?<wikidot>.*?)"\)})/gms
        if (secondPass) {
            // On the second pass, we will catch identifiers or assignments that start with "?", such as ::?identifier[section]::
            reSearch = /((?<wslead>\s*)::\??(?<sign>\+?)(?<identifier>\w*)(\[(?<sectionModifiers>[=?]*)(?<section>[\w-]+)\]|="(?<assign>.*?)"(?<immediate>!?))?::(?<wstrail>\s*)|{(?<mathsign>\+?)(?<math>MATH)(?<extra>\.\w*)?\((?<expression>.*?)\)}|{\?\s*(?<expleft>.*?)\s*(?<comparesign>[<=>≤≥≠])\s*(?<expright>.*?)\s*{T}(?<iftrue>.*?){F}(?<iffalse>.*?)\?}|{!--(?<comment>.*?)--}|{wd\("(?<wikidot>.*?)"\)})/gms
        }
        var fieldnames;
        while ((fieldnames = reSearch.exec(output)) !== null) {
            var value = "";
            if (fieldnames.groups.identifier != null) {
                value = parseIdentifier(fieldnames, nestlevel + 1);
            } else if (fieldnames.groups.math) {
                value = parseMath(fieldnames, nestlevel);
            } else if (fieldnames.groups.comparesign) {
                value = parseCondition(fieldnames, nestlevel + 1);
            } else if (fieldnames.groups.comment) {
                value = "";
            } else if (fieldnames.groups.wikidot) {
                value = statblockParse(fieldnames.groups.wikidot, nestlevel + 1)
                  .toLowerCase()
                  .replaceAll(" ", "-")
                  .replaceAll("'", "")
                  .replaceAll(":", "")
            }
            output = output.replace(fieldnames[0], value);

            // Reset the starting position of the RegEx so that we may retry already replaced text that contains placeholders.
            reSearch.lastIndex = 0;
        }

        return output;
    }
}

function parseIdentifier(reGroups, nestlevel = 1) {
    // Not giving an identifier will default to __txt_private_notes.
    // Note: the value ::="something":: will assign "something" to __txt_private_notes.
    // I have decided to let it slide at this time.
    if (reGroups.groups.identifier == "") { reGroups.groups.identifier = privateNotesField; }

    // Are we dealing with an assignment?
    if (reGroups.groups.assign != null) {
        // Yes, we are, so assign the value in the mapping table.
        if (reGroups.groups.immediate == "!") {
            // We are asked to evaluate the value right away
            alias.set(reGroups.groups.identifier, statblockParse(reGroups.groups.assign, nestlevel));
        } else {
            alias.set(reGroups.groups.identifier, reGroups.groups.assign);
        }
        // Clear the assigment from the output
        value = "";
    } else {
        // No, we're not dealing with an assignment, so proceed as usual.

        // Do we have that identifier in the alias mapping?
        if (alias.has(reGroups.groups.identifier)) {
            // Identifier does exist in alias, replace with value
            value = statblockParse(alias.get(reGroups.groups.identifier), nestlevel + 1);
        } else {
            // Not in the mapping table, get the field from the character sheet.
            var fields = document.getElementsByName(reGroups.groups.identifier);
            if (fields == null) {
                value = reGroups.groups.identifier + " is undefined!";
            } else {
                // By default, we're going to take the first field in the list
                var field = fields[0];

                if (fields[0]) {
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
                        // Check if we're looking at a section
                        if (reGroups.groups.section) {
                            var sectionRegEx = new RegExp('>>' + reGroups.groups.section + '>>(.*?)<<' + reGroups.groups.section + '<<', 'gms');
                            var sectionValues = sectionRegEx.exec(field.value);
                            if (sectionValues) {
                                value = sectionValues[1]; // There is only one group, no need to name it
                            } else if (reGroups.groups.sectionModifiers.includes("?")) {
                                // Section was optional
                                value = field.value;
                            }

                            // Remove leading and trailing whitespace, unless user asked for exact content via the "=" sign
                            if (!reGroups.groups.sectionModifiers.includes("=")) {
                                value = value.trim();
                            }

                            value = statblockParse(value, nestlevel + 1);
                        } else {
                            value = statblockParse(field.value, nestlevel + 1);
                        }
                    }

                    //alert(fields[1]);
                    if (reGroups.groups.sign == "+") {
                        // Apparently there is no function in Javascript to format a number, so...
                        if (value >= 0) {
                            value = "+" + value;
                        }
                    }
                } else {
                    value = `Unknown field ${reGroups.groups.identifier}`;
                }
            }
        }
    }
    if (!reGroups.groups.assign) {
        value = reGroups.groups.wslead + value + reGroups.groups.wstrail;
    }
    return value;
}

function parseMath(reGroups, nestlevel = 1) {
    // Do math:
    // {MATH.extra(expression)}
    // The ".extra" is optional. Supported are:
    //  - .round    Round to the nearest integer
    //  - .floor    Round to the nearest lower integer
    //  - .cleiling Round to the nearest higher integer
    // we'll strip everything that is not a number, a dot (decimal separation), a parenthesis, or an operation (+-*/). Or a comma (apparently that's valid in \d).
    var value = "";
    var sanitizedExp = statblockParse(reGroups.groups.expression, nestlevel + 1).replace(/[^\d.()+-\/*]|,/g, "");
    try {
        value = Function("return (" + sanitizedExp + ");")();
    } catch {
        value = "(Expression \"" + sanitizedExp + "\" is not valid)";
    }

    if(reGroups.groups.extra) {
        switch(reGroups.groups.extra.toUpperCase()) {
            case ".ROUND":
                value = Math.round(value, 0);
                break;
            case ".FLOOR":
                value = Math.floor(value);
                break;
            case ".CEILING":
                value = Math.ceil(value);
                break;
        }
    }

    if(reGroups.groups.mathsign == "+" && value >= 0) {
        value = "+" + value;
    }
    return value;
}

function parseCondition(reGroups, nestlevel = 1) {
    // Conditional expressions
    //reSearch = /{\?\s*(?<expleft>.*?)\s*(?<comparesign>[<=>])\s*(?<expright>.*?)\s*{T}(?<iftrue>.*?){F}(?<iffalse>.*?)\?}/gs;
    // 0: entire match
    // 1: identifier
    // 2: compare (<, =, >, ≤, ≥, or ≠)
    // 3: compare to
    // 4: value if true
    // 5: value if false
    var value = "";
    var leftExp = statblockParse(reGroups.groups.expleft, nestlevel + 1);
    var rightExp = statblockParse(reGroups.groups.expright, nestlevel + 1);

    // Convert left and right to numbers if both can be converted, because 4 < 12, but "4" > "12".
    if (leftExp > "" && rightExp > "" && !isNaN(leftExp) && !isNaN(rightExp)) {
        leftExp = +leftExp;
        rightExp = +rightExp;
    }

    switch(reGroups.groups.comparesign) {
        case "<":
            if (leftExp < rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
        case "≤":
            if (leftExp <= rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
        case ">":
            if (leftExp > rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
        case "≥":
            if (leftExp >= rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
        case "=":
            if (leftExp == rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
        case "≠":
            if (leftExp != rightExp) {
                value = reGroups.groups.iftrue;
            } else {
                value = reGroups.groups.iffalse;
            }
            break;
    }
    return statblockParse(value, nestlevel + 1);
}
