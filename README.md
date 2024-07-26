# Important:

This script's function has changed a bit. Since I appear to be the only user, the documentation did not follow completely and is now a bit out-of-date.
If you are having issues getting this to work, [drop me](https://www.myth-weavers.com/index.php?/messenger/compose/&to=16146) a message on Myth-Weavers.

Now, here is the outdated documentation:

# MythWeaversStatblock
A Myth-Weavers character sheet statblock generator

This script allows customization of the statblock generated on a Myth-Weavers character sheet.

This script uses the "Private Notes" as a template to construct the statblock. It makes a lot of assumption
on the layout of the page, and therefore will break if Myth-Weaver changes the sheets.

A new button is created right next to the save button on your sheet. It is placed there on purpose, to remind
you to generate the statblock before saving your character.

If your character sheet is attached to the game you're playing, you can use the statblock tag (such as ``[sb=free][/sb]``)
to insert the contents into your posts.

The script currently supports D&D 5e and Star Wars Saga. It might work on other sheets, if those sheets use the same private text and statblock HTML field names as D&D 5e.

Note that ::identifiers:: are case-sensitive.

You can [contact me](https://www.myth-weavers.com/private.php?do=newpm&u=16146) on Myth-Weavers if you are having issues with this script.

**You're Using Regular Expressions!?!?!**

Yes, I know, this is not the correct way to write a parser. However:
- I have no experience writing a parser;
- I have little experience with Javascript;
- I wanted something quick as a proof-of-concept;
- My need was simple (at first).

For a while, all I needed was to plug in field values; there was no need to rewrite something that was already working. By the time I figured out what more I needed, [Project Baldr](https://www.myth-weavers.com/showthread.php?t=523231) was announced. Baldr is likely to make this script obsolete, so, again, not worth the effort of rewriting this - it's for a hobby, not a paying contract.

## Walkthrough

I will be using [this D&D 5e character](https://www.myth-weavers.com/sheet.html#id=2045588) for this walkthrough. Let's start simple: I want a statblock that will show only the character's current hit points. In Chrome, right-clicking on the sheet's hp box, then selecting *inspect* reveals that the name of the box is ``hp``. Therefore, the script will replace ``::hp::`` with the value from this box:

``hp: ::hp::``

This creates the follwing into the statblock field, using the new blue button on the upper-right corner of the page (next to the save button):

``hp: 39``

Excellent! Changing the hp in the hp box and regenerating the statblock will update the statblock field with the new value. Let's fill in a bit more information: the character's name and total HP. We can add vbCode as well, such as making the headers bold:

```
::name::
[b]hp:[/b] ::hp:: / ::max_hp::
```

The output becomes:

```
Senial Lianodel
[b]hp:[/b] 39 / 100
```

### Character Sheet's URL

Let's add a link to the character sheet. There is no field with that information, but the script provides the ``::URL::`` tag with that value:

```
::name:: - [size=1][url=::URL::]sheet[/url][/size]
[b]hp:[/b] ::hp:: / ::max_hp::
```

Output:

```
Senial Lianodel - [size=1][url=https://www.myth-weavers.com/sheet.html#id=2045588]sheet[/url][/size]
[b]hp:[/b] 39 / 100
```

### Formatting

Let's add a bit more information, such as the ability scores and their modifiers:

```
::name:: - [size=1][url=::URL::]sheet[/url][/size]
[b]hp:[/b] ::hp:: / ::max_hp::
[b]Abilities:[/b] STR ::strength:: (::strength_mod::), DEX ::dexterity:: (::dexterity_mod::), CON ::constitution:: (::constitution_mod::), INT ::intelligence:: (::intelligence_mod::), WIS ::wisdom:: (::wisdom_mod::), CHA ::charisma:: (::charisma_mod::)
```

Output:

```
Senial Lianodel - [size=1][url=https://www.myth-weavers.com/sheet.html#id=2045588]sheet[/url][/size]
[b]hp:[/b] 39 / 100
[b]Abilities:[/b] STR 10 (0), DEX 20 (5), CON 12 (1), INT 10 (0), WIS 20 (5), CHA 10 (0)
```

Oh wait?! Why don't the modifier have a "+" in front of them? It turns out that the "+" in the character sheet is not part of the value. We can fix this by putting the "+" sign at the start of the identifier names:

```
::name:: - [size=1][url=::URL::]sheet[/url][/size]
[b]hp:[/b] ::hp:: / ::max_hp::
[b]Abilities:[/b] STR ::strength:: (::+strength_mod::), DEX ::dexterity:: (::+dexterity_mod::), CON ::constitution:: (::+constitution_mod::), INT ::intelligence:: (::+intelligence_mod::), WIS ::wisdom:: (::+wisdom_mod::), CHA ::charisma:: (::+charisma_mod::)
```

Output:

```
Senial Lianodel - [size=1][url=https://www.myth-weavers.com/sheet.html#id=2045588]sheet[/url][/size]
[b]hp:[/b] 39 / 100
[b]Abilities:[/b] STR 10 (+0), DEX 20 (+5), CON 12 (+1), INT 10 (+0), WIS 20 (+5), CHA 10 (+0)
```

Although not shown in the output above, the "+" sign will not appear if the value is negative (or not a number).

So that's the basics! For quite a long time, this was all I needed!

### Conditional Expressions

It's also possible for the output to change, depending on some condition. Getting back to our example, we'll strip everything except hit points. We want the current hp to appear without formatting if we're at full health, but be orange when we are wounded. Here is the code, with explanations following:

```
[b]hp:[/b] {? ::hp:: = ::max_hp:: {T}::hp::{F}[color=orange]::hp::[/color]?}
```

The format of the conditional expressions is **{?** somevalue = othervalue **{T}** output this if true **{F}** output this if false **?}**. The comparaison can be = (as in the example), <, or >. Leading and trailing spaces around each expression being evaluated are ignored in the evaluation. The entire expression, as expected, will be replaced by what comes after the **{T}** or **{F}** statement, depending if the result is true or false.

The True and False part can be empty if needed, but the **{T}** and **{F}** must be there. Leading and trailing spaces are kept in those sections. Note that it is not possible to nest conditional statements directly; nesting will require repurposing another field in the character sheet, or using sections (see below).

### Mathematics

Some mathematics is possible. The basic form is this:

```
{MATH(::max_hp:: / 2)}
```

This would return the maximum hp value divided by 2. Revisiting our hp example, let's say we want the current hp to appear red when below 1/4 of the maximum hp value:

```
[b]hp:[/b] {? ::hp:: < {MATH(::max_hp:: / 4)}{T}[color=red]::hp::[/color]{F}::hp::?}
```

Optionally, you may use ``{+MATH...`` to put a + sign if the result is a positive number. It should also be noted that anything that isn't a number, a parenthesis, a dot (decimal separator), or a basic math operation (+-/\*) will be ignored. Finally, if the expression is not a valid mathematical expression, the function will return an error message.

#### Mathematics Extras

A few extras can be added to the MATH option, in the form ``{MATH.extra( expression )}``:

- **.round** will round the result to the nearest integer;
- **.floor** will round to the nearest integer that is less than the result (eg: 5.2 -> 5, -3.1 -> -4);
- **.ceiling** will round to the nearest integer that is more than the result (eg: 5.2 -> 6, -3.1 -> -3).

```
{MATH.round(3.2)} is equal to 3
{MATH.floor(3.2)} is equal to 3
{MATH.ceiling(3.2)} is equal to 4
```

### Sections

Using ``::identifier::`` will return the entire content of the field, which is probably what you want for fields that contain a single value, such as hp, Strength, character's name or skill modifier. For larger fields, such as _Features & Traits_, _Other Notes_, or _Private Notes_, you might want to extract only a portion, leaving the rest of the field for other uses, or to work around the nesting restriction mentioned in the conditional expressions, above. Let's use the "Other Notes" field (the name is ``__txt_other_notes``) to rebuild our hp colors above: black for full health, red for below 1/4 max hp, and orange for wounded (at or above 1/4 max hp). We cannot use nesting directly, so we can use 2 sections:

```
>>HPDISPLAY>>
{? ::hp:: = ::max_hp:: {T}::hp::{F}::__txt_other_notes[WOUNDED]::?}
<<HPDISPLAY<<

>>WOUNDED>>
{? ::hp:: < {MATH(::max_hp:: / 4)} {T}[color=red]::hp::[/color]{F}[color=orange]::hp::[/color]?}
<<WOUNDED<<
```

In our private notes, we would put something like this:

```
[b]hp:[/b] ::__txt_other_notes[HPDISPLAY]::
```

This gets around the nesting restriction, since the WOUNDED section will be resolved before being inserted in the {F} part of the HPDISPLAY section.

The section names do not need to be ALL CAPITALS, just remember that it is case-sensitive. You can use letters, numbers, and the underscore character ``_``, but not spaces. Also, leading and trailing whitespaces will be trimed by default from sections. This default behavior is to make it easier to read and modify. In the example above, if the whitespaces were not removed, there would be an end-of-line both before and after the hp number, like this:

```
[b]hp:[/b] 
[color=orange]39[/color]
```

If, however, you do want to keep those whitespaces, you can prefix the section name with the equal sign: 

``[b]hp:[/b] ::__txt_other_notes[=HPDISPLAY]::``

**Note:** In order to allow the private notes to be used for something else in addition to the statblock code, the code will look for a section called ``STATBLOCK``. If that section is not found, the entire private notes will be used to generate the statblock.

```
Secret: this character's father is the main villain. The character does not know it at this point.

>>STATBLOCK>>
::name:: - [size=1][url=::URL::]sheet[/url][/size]
[b]hp:[/b] ::hp:: / ::max_hp::
[b]Abilities:[/b] STR ::strength:: (::+strength_mod::), DEX ::dexterity:: (::+dexterity_mod::), CON ::constitution:: (::+constitution_mod::), INT ::intelligence:: (::+intelligence_mod::), WIS ::wisdom:: (::+wisdom_mod::), CHA ::charisma:: (::+charisma_mod::)
<<STATBLOCK<<
```

Lastly, if you want to put multiple sections in the private notes, you can use ``::__txt_private_notes[sectionname]::``, but for convenience, a shortcut also exists: just leave out the identifier entirely! ``::[sectionname]::`` will look for ``sectionname`` in the private notes.

### Aliases

Format: ``::identifier="new value"::``

You can define aliases: you define (or redefine) identifiers and assign them another value. This can be used for readability, or to shorten a field you might be using multiple times. The identifier is only valid for what comes *after* the definition.

```
::hpdisplay="::__txt_other_notes[HPDISPLAY]::"::
[b]hp:[/b] ::hpdisplay::
```

Note that you can redefine the value of existing fields. This does not change the actual value in the character sheet, but the redefined value will be used when generating the statblock. Note that the "new value" is just stored as-is, and will be plugged in, and evaluated, when it is actually used. Let's take an example:

```
::x="1"::
Value of x is ::x::
::x="{MATH(::x:: + 1)}"::
Value of x is ::x::
```

This will cause an infinite loop. ``x`` gets assigned the value of ``1``, and that value is printed out. Then, ``x`` is redefined to mean ``{MATH(::x:: + 1)}``. On the last line, ``x`` gets evaluated to ``{MATH(::x:: + 1)}``, but the ``x`` in *that* expression also gets evaluated to ``{MATH(::x:: + 1)}``, which also gets evaluated, *ad infinitum*. The solution around this is to use the suffix ``!`` to indicate that we want to evaluate the expression right away:

```
::x="{MATH(::x:: + 1)}"!::
```

So before remembering the assignation, ``{MATH(::x:: + 1)}`` will be evaluated. Since, at that point, ``x`` equals 1, the expression will be changed to ``{MATH(1 + 1)}``, then again to ``2``.

(Remember that ``::url::`` special tag? It's an alias.)

# Example
As an example, consider the following template, used on a DnD 5e sheet:

```
[floatleft][img2=90]::character_portrait::[/img2][/floatleft][FONT="Palatino Linotype"][SIZE="5"]::name::[/size][size=3] [I](::race:: ::class::)[/I] - [url="::URL::"]sheet[/url][/SIZE][/FONT]
[hr][/hr][B][COLOR="Black"]AC[/COLOR]:[/B] ::armor_class:: | [B][COLOR="black"]HP[/COLOR]:[/B] ::hp:: / [COLOR="darkgreen"]::max_hp:: [/COLOR] [B]THP:[/B] ::temp_hp:: | [B][COLOR="black"]Initiative[/COLOR]:[/B] ::initiative:: | [B][COLOR="black"]Passive Perception[/COLOR]:[/B] ::passive_perception::
[B][COLOR="black"]Stats[/COLOR]:[/B] STR [ooc=::strength::]Athletics ::athletics_mod::[/ooc] (::+strength_mod::), DEX [ooc=::dexterity::]Acrobatics ::acrobatics_mod::
Sleight of Hand ::sleight_of_hand_mod::
Stealth ::stealth_mod::[/ooc] (::+dexterity_mod::), CON ::constitution:: (::+constitution_mod::), INT [ooc=::intelligence::]Arcana ::arcana_mod::
History ::history_mod::
Investigation ::investigation_mod::
Nature ::nature_mod::
Religion ::religion_mod::[/ooc] (::+intelligence_mod::), WIS [ooc=::wisdom::]Animal Handling ::animal_handling_mod::
Insight ::insight_mod::
Medicine ::medicine_mod::
Perception ::perception_mod::
Survival ::survival_mod::[/ooc] (::+wisdom_mod::), CHA [ooc=::charisma::]Deception ::deception_mod::
Intimidation ::intimidation_mod::
Performance ::performance_mod::
Persuasion ::persuasion_mod::[/ooc] (::+charisma_mod::)
[B][COLOR="black"]Saves[/COLOR]:[/B] STR ::strength_save:: | DEX ::dexterity_save:: | CON ::constitution_save:: | INT ::intelligence_save:: | WIS ::wisdom_save:: | CHA ::charisma_save::
[hr][/hr][b]::weapon_1_name::[/b]: ::weapon_1_attack::, damage ::weapon_1_dmg::
[b]::weapon_2_name::[/b]: ::weapon_2_dmg::[hr][/hr]
```

It outputs something like this:

![Sample](/docs/statblock_sample.png)

Note that the above is a static image, but the stats numbers are OOC tags detailing the relevant skill modifiers.
