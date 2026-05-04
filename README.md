"No fear of death"
# Crackcode

Crackcode is a CrossCode mod designed to speed up the game for a faster experience, primarily by removing the non-playable parts weaved into the gameplay, such as dying, waiting for enemies to spawn, retrying in arena and more.

The mod has been specifically tailor made for Prepare to Hi and Arena, but even outside of these uses the mod will still serve great use.

## Installation

The mod only requires the [Loader](https://github.com/CCDirectLink/CCLoader), if you want a video guide to modding your game can find that [Here](https://youtu.be/7oBYnF_xMvU?t=5).

The easiest way to get a copy is via the [Mod manager](https://github.com/CCDirectLink/CCModManager), but it isn't required.

To manually download the mod, navigate to [This](https://github.com/Principles1/CrackCode/releases/latest) page then click Source code (zip) and download it.

Then, extract the zipped folder, when unzipped open it, you should see another folder inside, move this folder into crosscode's mod folder and restart your game.


## Permanent Features

Death will occur Instantly, instead of triggering a death animation.

Arena will restart immediately after you die.


## Features

### Combat lock:
A button labeled "CL" is present on your menu, you can press it to activate or deactivate Combat Lock.
When combat lock is active, it will create a temporary checkpoint upon you entering a new room, regardless of if the game usually disallows saving there, you will henceforth respawn within this room until you either leave the room, setting your checkpoint in another room, or disable combat lock, which will put you back to your autosave after you die.
The goal of this feature is to remove sections where if you die, you need to load previous map and then re-enter the map to fight again, it is also to allow you to continue in quests such as wetter work from the room where you died, instead of being set back to the start of the quest.


### Quick Save:
A button labeled "QS" is present on your menu, you can press it to quick save at your current location as long as you're not in a cutscene or in forced Combat Mode.
Quick save creates a temporary checkpoint, saving the current state of the map and your location; If you die within the map, you'll be teleported back to the quick save location.
The goal, is allowing you to set a location to return to if you die, so you don't need to walk half the map every time you die to a boss.


## Configurable

For ease of use, you will find all CrackCode settings in the "general" tab of your usual settings.

Auto-Skip Cutscenes - Automatically skips cutscenes, even those the game normally prevents you from skipping.

Skip Arena Score Counting - Upon defeating the last enemy skip the arena score tally sequence and starts the next round immediately.

Short Cinematics – Makes in-game events instant, such as "Once more" death save, or the wait until a map spawns an additional enemy, comes with a blacklist of the few problematic maps where it isn't active.
This setting toggles most patches you see below.

Instant-transitions – Makes area and death transitions instant, instead of a fade effect, load the map instantly.


## Patches

Patches are enabled/disabled if Short Cinematics setting is on upon startup of crosscode, you need to restart the game to toggle these.
The reason patches are toggled by Short Cinematics is because both patches and short cinematics modify maps to hasten them.

Gaia's garden's lost shrine fight starts immediately upon entering arena instead of needing to activate every light every time you die.

If you manage to leave Azure archipelago's Son of the beach's laser attack range, it'll end immediately and move onto it's lightning attack, instead of you needing to wait as it occurs while you're far outside of it's reach.

Various bug fixes relating to short cinematics and noise stacking from you dying in unexpected areas due of pth.


## Bugs and issues

In the unlikely case that the game reliably crashes in a map or behaves unexpectedly it's most likely because of the Short Cinematics setting, if it proves problematic then disable the setting before leaving and returning to the room, or just relog.

Crackcode pushes the game to its limits, so very rarely unreplicatable errors might occur at random, regardless of the error feel free to contact (@Principle1) on discord and possibly even send me the crash log and I'll appreciate it.


## Origin

What inspired the development of this mod was the Arena rush mode with Prepare to hi (one hit mode) modifier, which is a miserable experience.

If you got hit a single time, you had to through a slow, obnoxious death animation, then you had to click on retry, wait for the slow stage introduction, to then get another shot at it, for a minimum of 9 seconds per death.
Victory is barely any better, you still need to wait for victory pose, score counting, clicking on next, stage introduction for another 9 seconds per stage.

While the time can be justified in a normal playthrough, in prepare to Hi you will die multiple times, so you'll need to sit through these cinematics potentially hundreds of times over and over, spending most of your time waiting, instead of fighting.
Given the miserable state of Prepare to Hi arena, I decided that fixing it was necessary, and while at it I decided to broaden the scope to cover everything the mod covers today.


## Additional

I decided to remove all my comments from the prestart in the release version, given that there were so many and they ramble on about all kinds of things, but if you want to see the version with comments then it's available [here](https://github.com/Principles1/Crackcode-prestart-commented), you can copy the code and replace _prestart.js with it.

I currently don't have anything additional planned for CrackCode and rarely work on it, but I'm always open to ideas and feedback, I'd recommend joining [The crosscode community server](https://discord.gg/xkcMeGbdxF) and either mentioning or send me (@Principle1) a direct message as the best way to reach me.

The mod also contains a few bug fixes for the Prepare to Hi modifier.

[![The big boys](https://raw.githubusercontent.com/CCDirectLink/CCModManager/refs/heads/master/icon/badge.png)](https://github.com/CCDirectLink/CCModManager)
