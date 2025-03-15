// <<< Crackcode, a mod for Crosscode - 2025 principle >>>
ig.EVENT_STEP.WAIT.inject({
    start: function (context) {
        if (!sc.options.get("Short-Cinematics") || sc.skipShortCinematics) { // There are definetely better ways of doing this, but exempting maps works.
            return this.parent(context);
        }

        if (this.time > 0) {
            this.time = 0;
        }

        this.parent(context);
    }
});


sc.Arena.inject({
    onPreDamageModification(a, b) { //Enables instant arena death.
        if (ig.limiterForLastPlayerHit && ig.limiterForLastPlayerHit.noDmg) { 
            return; // Exit early, for compatability with PTH guardian-fix.
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
                            sc.model.player.setElementLoad(0);

                            if (sc.arena.runtime.rush) {
                                sc.arena.restartCup();
                                sc.arena.teleportToCurrentRound();
                            } else { 
                                sc.arena.startNextRound(false);
                                sc.commonEvents.startCallEvent('arena-teleport');
                            }
                        }
                    }
                } else if (!ig.perf.grantArenaBonus) {
                    this.addScore('DAMAGE_TAKEN', -a.damage);
                }
            }
        }
    },
    onCombatantDeathHit: function (a, b) { //Enables instant arena continuation.
        if (!sc.options.get("Short-arena")) {
            return this.parent(a, b);
        }

        // Modified behavior if Short-arena is enabled
        if (this.active && !this.runtime.playerDeath && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
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
                        sc.model.player.setElementLoad(0);
                        c.rush
                            ? c.currentRound == c.rounds.length - 1 &&
                              ig.bgm.pause('IMMEDIATELY')
                            : ig.bgm.pause('IMMEDIATELY');

                        if (c.currentRound < c.rounds.length - 1) {
                            let baseScore = sc.arena.runtime.score || 0;
                            let bonusScore = 0;
                            let bonusObjectives = sc.arena.runtime.bonusObjectives;

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
                            console.log("Base Score:", baseScore);
                            console.log("Bonus Points:", bonusScore);
                            console.log("Final Saved Score:", finalScore);

                            if (sc.arena.saveScore(finalScore) && !sc.arena.runtime.rush) { 
                                console.log("Arena score saved successfully!");
                            }
                            if (sc.arena.runtime.rush && sc.arena.isCurrentRoundLast()) {
                                console.log("Arena Rush Mode: Saving final score!");
                            }

                            sc.arena.startNextRound(true);
                            sc.commonEvents.startCallEvent('arena-teleport');
                        } else {
                            c.roundEndPre = true;
                            sc.commonEvents.startCallEvent('arena-end-round');
                        }
                    } else {
                        sc.commonEvents.startCallEvent('arena-next-wave');
                    }
                }
            }
        }
    },
});
// This could be extended in the future to make it never crash the user, please do however note that this mod isn't designed with the actual story in mind.
const exemptMaps = [
    "arena.faction.mine-heatbot-1",
    "arena.dlc.gods",
    "arena.dlc.turrets",
    "cargo-ship.teleporter",
    "rhombus-dng.room-1-6",
    "arid-dng.first.room-10",
    "evo-village.interior.city-hall",
    "rhombus-dng.room-5-newer",
    "rhombus-dng.room-final",
    "rookie-harbor.central-quest-hub-2",
    "cold-dng.b3.room7",
    "arid.interior.quest-hub"
];

sc.CrossCode.inject({ 
    loadingComplete: function () {
        this.parent();
        this.handleLoadingComplete();
        sc.skipShortCinematics = false;
        let realMap = sc.map.currentMap;
        console.log("Internal Map:", realMap);
        if (realMap && exemptMaps.includes(realMap)) { //Gotta check both, else loading into certain exempt maps crashes the game. 
            console.log(">>> Exemption Map Loaded:", realMap);
            sc.skipShortCinematics = true;
        }
    },

    respawn: function () { //instant respawn
        this.events.callEvent(new ig.Event({ steps: [{ type: 'LOAD' }] }), ig.EventRunType.BLOCKING);
    },

    // Instantly teleport
    onTeleportStart: function (...args) {
        if (sc.options.get("Instant-transitions")) {
            sc.model.enterTeleport();
            return 0;
        }
        return this.parent(...args);
    },

    handleLoadingComplete: function (...args) {
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
                                        //{ type: 'WAIT', time: 0.1 },  // If removing this causes problems tell me.
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
for (let [key, value] of Object.entries(sc.OPTIONS_DEFINITION)) { //All options to be in general for ease of use, might change in future.
    
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


sc.GameModel.inject({
    enterCutscene: function (b) {
        this.message.clearSideMessages();
        this._setState(sc.GAME_MODEL_STATE.CUTSCENE);
        b && sc.combat.setActive(true);

        if (sc.options.get("Cutscene-skip")) {
            sc.model.startSkip();
            sc.model.enterRunning();
        }
    }
});

sc.Arena.inject({
    endRound: function () {
        if (sc.options.get("Short-arena")) {

            let a = this.runtime;
            ig.system.skipMode = false;
            this._pauseBlock = true;
            this._endRoundDone = false;

            sc.timers.stopTimer('arenaTimer');
            sc.timers.stopTimer('arenaTimerReal');

            a.timer = sc.timers.timers.arenaTimerReal
                ? sc.timers.getPassedTime('arenaTimerReal')
                : 0;

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
            console.log("Base Score:", baseScore);
            console.log("Bonus Points:", bonusScore);
            console.log("Final Saved Score:", finalScore);

            if (sc.arena.saveScore(finalScore) && !a.rush) { 
            }
            if (a.rush && sc.arena.isCurrentRoundLast()) {
            }

            if (a.currentRound < a.rounds.length - 1) { 
                sc.arena.startNextRound(true);
                sc.commonEvents.startCallEvent('arena-teleport');
            } else { 
                console.log("No more rounds, ending normally.");
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
});
