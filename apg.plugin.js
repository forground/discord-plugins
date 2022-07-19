// APG - Auto Play Gifs

module.exports = (() => {
    const config = {
        info: {
            name: "APG",
            authors: [
                {
                    name: "foreground",
                    discord_id: "492031513915817996",
                    github_username: "forground",
                    twitter_username: "assincronia"
                }
            ],
            version:"0.1.4",
            description:"Roda Avatares e GIFs automaticamente",
            github:"https://github.com/forground/discord-plugins",
            github_raw:"https://raw.githubusercontent.com/forground/discord-plugins/apg.plugin.js"
        },
        changelog: [
            {
                title: "Fixado",
                type: "fixed",
                items: [
                    "Os avatares no chat animam novamente",
                    "Os ícones de servidor animam novamente"
                ]
            }
        ],
        defaultConfig: [
            {
                type: "switch",
                id: "avatars",
                name: "Rodar avatares de Usuários automaticamente",
                note: "Roda avatares de Usuários com Nitro automaticamente",
                value: true
            },
            {
                type: "switch",
                id: "guilds",
                name: "Rodar ícones de Servidores automaticamente",
                note: "Roda automaticamente os ícones dos servidores que foram aprimorados",
                value: true
            },
            {
                type: "switch",
                id: "activityStatus",
                name: "Status de Atividade",
                note: "Roda automaticamente emojis e ícones no Status de Atividade, como na lista de membros",
                value: true
            }
        ],
        main: "index.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() { 
            this._config = config; 
        }

        getName() { 
            return config.info.name; 
        }

        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }

        getDescription() {
            return config.info.description;
        }

        getVersion() {
            return config.info.version;
        }

        load() {
            BdApi.showConfirmationModal("Biblioteca Ausente", `O Plugin de Biblioteca necessário para ${config.info.name} está ausente. Clique em Download para instalá-lo.`, {
                confirmText: "Download",
                cancelText: "Cancelar",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const { WebpackModules, DiscordModules, Patcher } = Api;

            return class AutoPlayGifs extends Plugin {

                onStart() {
                    if (this.settings.avatars) this.patchUsers();
                    if (this.settings.guilds) this.patchGuilds();
                    if (this.settings.activityStatus) this.patchActivityStatus();
                }
        
                onStop() {
                    Patcher.unpatchAll();
                }

                getSettingsPanel() {
                    const panel = this.buildSettingsPanel();
                    panel.addListener((id, value) => {

                        if (id == "avatars") {
                            if (value) this.patchUsers();
                            else this.cancelUsers();
                        }

                        if (id == "guilds") {
                            if (value) this.patchGuilds();
                            else this.cancelGuilds();
                        }

                        if (id == "activityStatus") {
                            if (value) this.patchActivityStatus();
                            else this.cancelActivityStatus();
                        }

                    });

                    return panel.getElement();
                }

                patchGuilds() {
                    const firstGuild = DiscordModules.SortedGuildStore.getFlattenedGuilds()[0];
                    this.cancelGuildList = Patcher.before(firstGuild.constructor.prototype, "getIconURL", (thisObject, args) => {
                        args[1] = true;
                    });
                }
        
                patchUsers() {
                    const selfUser = DiscordModules.UserStore.getCurrentUser();
                    this.cancelUsers = Patcher.before(selfUser.constructor.prototype, "getAvatarURL", (thisObject, args) => {
                        args[2] = true;
                    });
                }
        
                patchActivityStatus() {
                    const ActivityStatus = WebpackModules.getByProps("ActivityEmoji");
                    this.cancelActivityStatus = Patcher.before(ActivityStatus, "default", (_, [props]) => {
                        if (!props) return;
                        props.animate = true;
                    });
                }

            };
        };

        return plugin(Plugin, Api);
    }) (global.ZeresPluginLibrary.buildPlugin(config));
})();
