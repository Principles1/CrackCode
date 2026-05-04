ig.EVENT_STEP.WAIT.inject({
    start: function (context) {
        if (!sc.options.get("Short-Cinematics") || sc.skipShortCinematics) {
            return this.parent(context);
        }

        
        if (!sc.arena.active) { 
            if (this.time > 0.1) {
                this.time = 0.1;
            }
        } else { 
            if (this.time > 0) {
                this.time = 0;
            }
        }

        this.parent(context);
    }
});

ig.ENTITY.Player.inject({
	onDamage(a, c, g)
	{
		if (c && c.limiter)
			ig.limiterForLastPlayerHit = c.limiter;

		var ret = this.parent(a, c, g);
		return ret;
	}
});

sc.Combat.inject({
    init(...args) {
        this.parent(...args);

        if (sc.options.get("Short-Cinematics")) {
            for (let key in sc.DRAMATIC_EFFECT) {
                let effect = sc.DRAMATIC_EFFECT[key];
                if (effect && typeof effect === 'object' && 'blurDuration' in effect) { 
                    effect.blurDuration = 0;
                }
            }
        }
    }
});



sc.PvpModel.inject({ 
    startNextRound(b) {
        if (this.isActive()) {
            ig.game.entities.forEach(function (ent) {
                if (ent.coll && ent.coll.type === ig.COLLTYPE.PROJECTILE) {
                    ent.kill();
                }
            });
        }

        this.parent(b);
    }
});


sc.Arena.inject({
    onPreDamageModification(a, b) { 
        if (ig.limiterForLastPlayerHit && ig.limiterForLastPlayerHit.noDmg) { 
            return; 
        }

        if (this.active && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
            if (b == sc.SHIELD_RESULT.PERFECT) {
                this.addScore('PERFECT_SHIELD');
            } else if (a && a.damage > 0) {
                var c = this.runtime;
                c.chainHits--;
                if (c.chainHits <= 0) {
                    c.chain = 0;
                    c.rushChain = 0;
                    c.chainGui.setChainNumber(0);
                } else if (c.chain >= 2) {
                    c.chainGui.rumble();
                }
                if (c.chainHits / sc.ARENA_MAX_CHAIN_HITS <= 0.5) {
                    c.chainGui.setPulse(true);
                }
                var d = sc.model.player.params;
                if (this.hasChallenge('LEA_MUST_DIE')) {
                    a.damage = d.currentHp;
                }
                if (d.currentHp - a.damage <= 0 && c.playerDeath < 1) {
                    if (d.currentHp > 0 && d.getModifier('ONCE_MORE')) {
                        this.addScore('DAMAGE_TAKEN', -a.damage);
                    } else {
                        if (!sc.pvp.isActive()) {
                            c.playerDeath = 1;
                            c.chain = 0;
                            c.rushChain = 0;
                            c.rushChainMax = 0;
                            c.chainGui.setChainNumber(0);
                            this._pauseBlock = true;
                            this._endRoundDone = false;
                            ig.bgm.pause('IMMEDIATELY');
                            sc.stats.addMap('arena', 'deaths', 1);

                            if (sc.arena.runtime.rush) {
                                sc.arena.restartCup();
                                sc.arena.teleportToCurrentRound();
                            } else { 
                                sc.arena.startNextRound(false);
                                sc.arena.teleportToCurrentRound();
                            }
                        }
                    }
                } else if (!ig.perf.grantArenaBonus) {
                    this.addScore('DAMAGE_TAKEN', -a.damage);
                }
            }
        }
    },
    onCombatantDeathHit: function (a, b) {
        if (!sc.options.get("Short-arena")) {
            return this.parent(a, b);
        }
        if (
            this.active &&
            !this.runtime.playerDeath &&
            !(this.runtime.roundEndPre || this._pauseAction > 0)
        ) {
            sc.stats.addMap('arena', 'kills', 1);
            var c = this.runtime;
            if (!this.isEnemyBlocked(b)) {
                this.increaseChain();
                b.enemyType && b.enemyType.boss
                    ? this.addScore('BOSS_KILL')
                    : this.addScore('KILL');
                c.killTimer > 0 && this.addScore('MULTI_KILL');
                c.killTimer = 0.3;
            }
            this.sounds.play('APPLAUSE');
            if (!c.customRound) {
                this.isEnemyBlocked(b) || c.roundKills++;
                if (c.roundKills >= c.waveKillsNeeded) {
                    var d = this.getCurrentRound();
                    if (c.currentWave == d.waves.length - 1) {
                        c.rush
                            ? c.currentRound == c.rounds.length - 1 &&
                                ig.bgm.pause('IMMEDIATELY')
                            : ig.bgm.pause('IMMEDIATELY');
                        c.roundEndPre = true;
                        sc.arena.endRound();
                    } else sc.commonEvents.startCallEvent('arena-next-wave');
                }
            }
        }
    },
    endRound: function () { 
        if (sc.options.get("Short-arena")) {
            let a = this.runtime;
            ig.system.skipMode = false;
            this._pauseBlock = true;
            this._endRoundDone = false;

            sc.timers.stopTimer('arenaTimer');
            sc.timers.stopTimer('arenaTimerReal');
            if (a.rush) {
                a.timer = sc.timers.getPassedTime('arenaTimerReal') || 0;
            } else {
                a.timer = sc.timers.getPassedTime('arenaTimer') || 0;
            }

            let baseScore = a.score || 0;
            let bonusScore = 0;
            let bonusObjectives = a.bonusObjectives || [];

            for (let obj of bonusObjectives) {
                if (sc.ARENA_BONUS_OBJECTIVE[obj.type].check(obj.data)) {
                    let points = obj.points;
                    if (sc.ARENA_BONUS_OBJECTIVE[obj.type].getPoints) {
                        points = sc.ARENA_BONUS_OBJECTIVE[obj.type].getPoints(obj.data, obj.points);
                    }
                    bonusScore += points;
                }
            }

            let finalScore = baseScore + bonusScore;
            console.log("Final Saved Score:", finalScore);

            sc.arena.saveScore(finalScore)

            if (a.currentRound < a.rounds.length - 1) {
                sc.arena.startNextRound(true);
                sc.arena.teleportToCurrentRound();
            } else {
                a.scoreGui && a.scoreGui.remove();
                ig.gui.freeEventGui(a.scoreGui);
                a.scoreGui = null;
                a.roundStarted = false;
                a.roundFinished = true;
                a.chainGui.pulsing && a.chainGui.setPulse(false);

                let overlay = new sc.ArenaRoundEndOverlay();
                ig.gui.addGuiElement(overlay);
                overlay.show();
            }
        } else {
            this.parent();
        }
    },
        endRoundDeath() { 
        ig.system.skipMode = false;
        var a = this.runtime;
        this._pauseBlock = true;
        this._endRoundDone = false;
        sc.timers.stopTimer('arenaTimer');
        sc.timers.stopTimer('arenaTimerReal');
        a.timer = 0;
        a.chainGui.pulsing && a.chainGui.setPulse(false);

        if (!sc.pvp.isActive()) { 
            sc.stats.addMap('arena', 'deaths', 1);

            if (sc.arena.runtime.rush) {
                sc.arena.restartCup();
                sc.arena.teleportToCurrentRound();
            } else {
                sc.arena.startNextRound(false);
                sc.arena.teleportToCurrentRound();
            }
        }
    }
});

const exemptMaps = [
    "arena.faction.mine-heatbot-1", 
    "arena.dlc.turrets", 
    "arena.platform-labs.snowman-fight", 
    "arena.dlc.snail", 
    "arena.dlc.creator", 
    "arena.faction-dlc.fight1-distillery", 
    "heat-village.special.distillery", 
    "arena.boss.worm-boss", 
    "cargo-ship.teleporter", 
    "arid.lab.ug-04-sidwell-meeting-room", 
    "bergen.special.miners-bombquest-1", 
    "bergen-trail.cave.cave-6-2", 
    "autumn-fall.raid.raid-02", 
    "autumn-fall.raid.raid-03", 
    "autumn-fall.raid.raid-boss", 
    "jungle.grove.grove-path-02", 
    "wave-dng.b1.north-05", 
    "wave-dng.b1.boss", 
    "arena.boss.wave-boss", 
    "shock-dng.f2.room3to5", 
    "arid.town-2", 
    "arid-dng.second.f2.wave-3", 
    "arid-dng.second.f2.shock-3",
    "final-dng.g.outdoor-03-south-west", 
    "final-dng.b4.bridge", 
    "final-dng.b4.boss", 
    "arena.dlc.gods", 
    "rookie-harbor.special.quest-ocean-2b-boss", 
    "arena.faction-dlc.fight2-ocean", 
    "jungle-city.entrance", 
    "beach.path-02", 
    "rhombus-sqr.center-n", 
    "rhombus-sqr.center-sw", 
    "cargo-ship.ship", 
    "autumn-fall.path-08", 
    "bergen-trail.path-6", 
    "jungle.clearing.clear-path-03", 
    "heat.path-04", 
    "bergen-trail.lab.room4", 
    "bergen.special.monks-questcave2", 
    "bergen.special.monks-questcave3", 
    "bergen.special.monks-questcave1", 
];

sc.CrossCode.inject({ 
    loadingComplete: function () {
        this.parent();
        this.handleLoadingComplete();
        sc.skipShortCinematics = false;
        console.log("Map:", sc.map.currentMap);
        if (sc.map.currentMap && exemptMaps.includes(sc.map.currentMap)) { 
            console.log(">>> Blacklisted Map:", sc.map.currentMap); 
            sc.skipShortCinematics = true;
        }
    },

    respawn: function () { 
        ig.storage.loadCheckpoint();
    },

    
    onTeleportStart: function (...args) {
        if (sc.options.get("Instant-transitions")) {
            sc.model.enterTeleport();
            return 0;
        }
        return this.parent(...args);
    },

    handleLoadingComplete: function (...args) {
        sc.model.player.setElementLoad(0); 
        if (sc.options.get("Instant-transitions")) {
            if (this._teleportMessages.length > 0) {
                ig.game.setPaused(true);
                let msg = this._teleportMessages.pop();
                this.sounds.popup.play();
                sc.Dialogs.showInfoDialog(msg, true, this.handleLoadingComplete.bind(this));
                this.hasTeleportMessageShown = true;
            } else {
                this.hasTeleportMessageShown = false;
                sc.model.enterRunning();

                ig.overlay.setAlpha(0, 0);
                this.teleportColor.timeOut = 0;
                this.teleportColor.timeIn = 0;

                if (!sc.commonEvents.triggerEvent('FORCE_UPDATE', {})) {
                    if (!this.playerEntity.hasAction()) {
                        let event = new ig.Event({
                            steps: [
                                {
                                    type: 'DO_ACTION',
                                    entity: this.playerEntity,
                                    action: [
                                        { type: 'WAIT', time: 0.1 },
                                        { type: 'WAIT_UNTIL_ON_GROUND' }
                                    ]
                                }
                            ]
                        });
                        ig.game.events.callEvent(event, ig.EventRunType.BLOCKING);
                    }
                    sc.commonEvents.triggerEvent('MAP_ENTERED', {});
                }
            }
        } else {
            this.parent(...args);
        }
    }
});

let options = {};
for (let [key, value] of Object.entries(sc.OPTIONS_DEFINITION)) { 
    
    options[key] = value;

    if (key === "pause-unfocused") {
        options["Cutscene-skip"] = {
            type: 'CHECKBOX',
            cat: sc.OPTION_CATEGORY.GENERAL,
            init: true,
            fill: true,
            showPercentage: true,
            hasDivider: true,
            header: "Crackcode"
        };
        options["Short-arena"] = {
            type: 'CHECKBOX',
            cat: sc.OPTION_CATEGORY.GENERAL,
            init: true,
            fill: true,
            showPercentage: true,
            hasDivider: false,
            header: "Crackcode"
        };
        options["Short-Cinematics"] = {
            type: 'CHECKBOX',
            cat: sc.OPTION_CATEGORY.GENERAL,
            init: true,
            fill: true,
            showPercentage: true,
            hasDivider: false,
            header: "Crackcode"
        };
        options["Instant-transitions"] = {
            type: 'CHECKBOX',
            cat: sc.OPTION_CATEGORY.GENERAL,
            init: false,
            fill: true,
            showPercentage: true,
            hasDivider: false,
            header: "Crackcode"
        };
    }
}

sc.OPTIONS_DEFINITION = options;


ig.EVENT_STEP.SHOW_CHOICE.inject({ 
    run: function () {
        var done = this.parent();

        if (done && sc.options.get("Cutscene-skip")) {
            sc.model.startSkip();
        }

        return done;
    }
});

ig.EVENT_STEP.OPEN_QUEST_DIALOG.inject({
    run: function (b) {
        var done = this.parent(b);

        if (done && sc.options.get("Cutscene-skip")) {
            sc.model.startSkip();
        }

        return done;
    }
});

sc.GameModel.inject({
    enterCutscene: function (b) {
        this.message.clearSideMessages();
        this._setState(sc.GAME_MODEL_STATE.CUTSCENE);
        b && sc.combat.setActive(true);

        if (
            sc.options.get("Cutscene-skip") &&
            sc.map.currentMap !== "rookie-harbor.special.quest-ocean-2b-boss" &&
            sc.map.currentMap !== "arena.faction-dlc.fight2-ocean"
        ) { 
            sc.model.startSkip();
            sc.model.enterRunning();
        }
    }
});



sc.Combat.inject({
    onCombatantDeathHit: function (a, b) {
        sc.justDied = true;

        return this.parent(a, b);
    }
});


sc.combatLock = {
    enabled: false
};

sc.PauseScreenGui.inject({
    init: function () {
        this.parent();

        
        this.combatLockButton = new sc.ButtonGui('CL', 36);
        this.combatLockButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
        this.combatLockButton.setPos(sc.BUTTON_DEFAULT_WIDTH + 39, 30);

        this.combatLockButton.onButtonPress = function () {
            if (!ig.game || !ig.game.playerEntity) return;

            const player = ig.game.playerEntity;

            if (!sc.combatLock.enabled && sc.arena.active) {
                const msg = new ig.GUI.ARBox(
                    player,
                    "Not in arena",
                    1.5,
                    sc.AR_BOX_MODE.FLOAT,
                    sc.AR_COLOR.RED
                );
                msg.setAttachedEntity(player);
                ig.gui.addGuiElement(msg);
                return;
            }

            sc.combatLock.enabled = !sc.combatLock.enabled;

            const msg = new ig.GUI.ARBox(
                player,
                sc.combatLock.enabled ? "Combat Lock ON" : "Combat Lock OFF",
                1.5,
                sc.AR_BOX_MODE.FLOAT,
                sc.combatLock.enabled ? sc.AR_COLOR.RED : sc.AR_COLOR.BLUE
            );
            msg.setAttachedEntity(player);
            ig.gui.addGuiElement(msg);

            if (!sc.combatLock.enabled) {
                ig.storage.checkPointSave = ig.copy(ig.storage.autoSlot.getData());
            }
        };

        this.addChildGui(this.combatLockButton);
        this.buttonGroup.addFocusGui(this.combatLockButton, 0, 1);

        
        this.quicksavebutton = new sc.ButtonGui('QS', 36);
        this.quicksavebutton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
        this.quicksavebutton.setPos(sc.BUTTON_DEFAULT_WIDTH + 3, 30);

        this.quicksavebutton.onButtonPress = function () {
            if (!ig.game || !ig.storage || !ig.game.playerEntity) return;

            if (sc.model.currentState !== sc.GAME_MODEL_STATE.GAME || sc.model.forceCombatMode) {
                const msg = new ig.GUI.ARBox(
                    ig.game.playerEntity,
                    "Not right now :(",
                    1.5,
                    sc.AR_BOX_MODE.FLOAT,
                    sc.AR_COLOR.RED
                );
                msg.setAttachedEntity(ig.game.playerEntity);
                ig.gui.addGuiElement(msg);
                return;
            }

            const player = ig.game.playerEntity;

            sc.debugRespawnPos = {
                x: player.coll.pos.x,
                y: player.coll.pos.y,
                z: player.coll.pos.z
            };
            sc.debugRespawnMap = sc.map.currentMap;

            ig.storage.saveCheckpoint(
                ig.game.mapName,
                ig.game.teleporting && ig.game.teleporting.position,
                null
            );

            const msg = new ig.GUI.ARBox(
                player,
                "Saved!",
                1.5,
                sc.AR_BOX_MODE.FLOAT,
                sc.AR_COLOR.BLUE
            );
            msg.setAttachedEntity(player);
            ig.gui.addGuiElement(msg);
        };

        this.addChildGui(this.quicksavebutton);
        this.buttonGroup.addFocusGui(this.quicksavebutton, 0, 1);
    }
});

sc.MapModel.inject({
    onLevelLoaded: function () {
        if (this.currentLoadFile) {
            for (var a = 0; a < this.listeners.length; a++)
                if (this.listeners[a].onStoragePostLoad)
                    this.listeners[a].onStoragePostLoad(this.currentLoadFile);
            this.currentLoadFile = null;
        }

        var allowCheckpoint =
            !ig.storage.checkpointCondCallback ||
            ig.storage.checkpointCondCallback();

        if (
            sc.justDied &&
            sc.debugRespawnPos &&
            sc.debugRespawnMap === sc.map.currentMap &&
            ig.game.playerEntity
        ) {
            ig.game.playerEntity.setPos(
                sc.debugRespawnPos.x,
                sc.debugRespawnPos.y,
                sc.debugRespawnPos.z
            );
        }

        sc.justDied = false;

        if (allowCheckpoint) {
            ig.storage.saveCheckpoint(
                ig.game.mapName,
                ig.game.teleporting.position,
                ig.storage.loadHint
            );

            if (ig.game.marker && ig.storage.checkPointSave.position)
                ig.storage.checkPointSave.position.marker = ig.game.marker;

            sc.combatLock.lastUnsafeMap = null;
            return;
        }

        if (sc.combatLock.enabled && !sc.arena.active) {
            if (sc.combatLock.lastUnsafeMap === ig.game.mapName) return;

            sc.combatLock.lastUnsafeMap = ig.game.mapName;

            ig.storage.saveCheckpoint(
                ig.game.mapName,
                ig.game.teleporting.position,
                ig.storage.loadHint
            );
        }
    }
});

sc.CrossCode.inject({

    start: function (b, a) {
        this._startMode = b != void 0 ? b : sc.START_MODE.STORY;
        sc.model.enterNewGame();
        sc.model.enterGame();
        this.transitionTimer = sc.options.get("Instant-transitions") ? 0.01 : 0.3;
    },
    loadStart: function (b) {
        this._slotToLoad = b || 0;
        sc.model.enterLoadGame();
        sc.model.enterGame();
        this.transitionTimer = sc.options.get("Instant-transitions") ? 0.01 : 0.3;
    },
    gotoTitle: function () {
        this.setTeleportColor(0, 0, 0, false);
        this.currentTeleportColor.r = 0;
        this.currentTeleportColor.g = 0;
        this.currentTeleportColor.b = 0;
        this.transitionTimer = sc.options.get("Instant-transitions") ? 0.01 : 0.8;
        sc.model.enterReset();
    },
});
