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

**Creating the Template:**
The script replaces strings in the form "::identifier::" by the value of the HTML element using the name "identifier".
Since HTML does not guarantee that a tag name is unique, we're taking the first one. Writing the template might
entail looking at the HTML source of the character sheet's page to find which names are used.

**Conditional Expressions:**
It is possible to base output on a condition. For example:

```
{? ::HPCurrent:: = ::HPTotal:: {T}[color=green]::HPCurrent::[/color]{F}[color=yellow]::HPCurrent::[/color]?}
```

**{?** starts the expression, while **?}** ends it.
As can be seen above, you can use ::identifiers:: in the expression to refer to other fields.
The condition compare symbol can be **=** (as in the example), **<**, or **>**.
**{T}** indicates what to return if the expression is true.
**{F}** indicates what to return if the expression is false.

Note that you _cannot_ nest conditional expressions:

```
This will not work: {? ::HPCurrent:: = ::HPTotal:: {T}Healthy{F}{? ::HPCurrent:: = 0 {T}Dead{F}Wounded?}?}
```

However, you can reference another field which does contain ::identifiers:: and/or a conditional expression.

**Special tags:**
!!URL!!       The URL of the character sheet.

**Formatting:**
If you want the value to be preceeded with a positive sign (when the value is a positive number), prefix it with a + sign, like this: ``::+dexterity_mod::``.

As an example, consider the following template, used on a DnD 5e sheet:

```
[floatleft][img2=90]::character_portrait::[/img2][/floatleft][FONT="Palatino Linotype"][SIZE="5"]::name::[/size][size=3] [I](::race:: ::class::)[/I] - [url="!!URL!!"]sheet[/url][/SIZE][/FONT]
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
