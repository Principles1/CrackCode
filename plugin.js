export default class togglable {
    constructor(mod) {
        this.mod = mod
    }

    poststart() {
        if (!sc.options.get("Short-Cinematics")) return;
        this.mod.runtimeAssets = {
            'data/maps/jungle/grove/lost-shrine-04.json.patch':
                'assets/mods/Crackcode/togglable/data/maps/jungle/grove/lost-shrine-04.json.patch',

            'data/maps/jungle/caves/questcave-td-1.json.patch':
                'assets/mods/Crackcode/togglable/data/maps/jungle/caves/questcave-td-1.json.patch',

            'data/maps/jungle/caves/questcave-td-2.json.patch':
                'assets/mods/Crackcode/togglable/data/maps/jungle/caves/questcave-td-2.json.patch',

            'data/enemies/beach/ape-beach.json.patch':
            'assets/mods/Crackcode/togglable/data/enemies/beach/ape-beach.json.patch'

        }
    }
}