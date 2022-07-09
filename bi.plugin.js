const request = require('request');
const fs = require('fs');
const path = require('path');

const config = {
    info: {
        name: "BetterInvites",
        authors: [
            {
                name: "foreground",
                discord_id: "492031513915817996",
            },
        ],
        version: "1.5.2",
        description: "Melhora o layout de um convite, melhorando posições, adicionando símbolos, banners, etc.",
        github: "https://github.com/forground/discord-plugins",
        github_raw: "https://raw.githubusercontent.com/forground/discord-plugins/bi.plugin.js",
    },
    changelog: [
        {
            title: "O que há de novo",
            type: "added",
            items: ["Adicionada opção para alterar de Discord Splash para o Banner do servidor"],
        },
        {
            title: "Pequena correção de Bugs",
            type: "fixed",
            items: ["Ordem errada corrigida"],
        }
    ],
    defaultConfig: [
        {
            type: "switch",
            id: "showBanner",
            name: "Mostrar Banner ou Convite",
            value: true,
        },
        {
            type: "dropdown",
            id: "bannerType",
            name: "Banner Type",
            note: "O tipo de Banner que será mostrado",
            value: 0,
            options: [
                { label: "Banner do Plugin", value: 0 },
                { label: "Discord Invite Splash", value: 1 }
            ]
        },
        {
            type: "switch",
            id: "showServerBannerForSplash",
            name: "Mostra o Banner do Servidor em vez do Banner de convite",
            note: "Funciona apenas para Discord Invite Splash",
            value: false,
        },
        {
            type: "switch",
            id: "showDescription",
            name: "Mostra a descrição do Servidor",
            value: true,
        },
        {
            type: "switch",
            id: "showBoost",
            name: "Mostra o Level de Boost do Servidor",
            value: true,
        },
        {
            type: "switch",
            id: "showInviter",
            name: "Mostra o usuário que te convidou para o Servidor",
            value: true,
        },
        {
            type: "switch",
            id: "showVerification",
            name: "Mostra o Nível de Verificação do Servidor",
            value: true,
        },
        {
            type: "switch",
            id: "showNSFW",
            name: "Mostra o Status de NSFW do Servidor",
            value: true,
        },
        {
            type: "switch",
            id: "showExpire",
            name: "Mostra a data de expiração do convite",
            value: true,
        },
        {
            type: "switch",
            id: "bigJoinButton",
            name: "Mostra um botão maior de Entrar no Servidor",
            value: true,
        }
    ]
};

module.exports = !global.ZeresPluginLibrary
    ? class {
        constructor() {
            this._config = config;
        }

        load() {
            BdApi.showConfirmationModal(
                "O Plugin da Biblioteca é necessário",
                `O Plugin da Biblioteca necessário para ${config.info.name} está ausente. Clique em Download para instalá-lo.`,
                {
                    confirmText: "Download",
                    cancelText: "Cancelar",
                    onConfirm: () => {
                        request.get(
                            "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                            (error, response, body) => {
                                if (error)
                                    return electron.shell.openExternal(
                                        "https://betterdiscord.app/Download?id=9"
                                    );

                                fs.writeFileSync(
                                    path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
                                    body
                                );
                            }
                        );
                    },
                }
            );
        }
        start() {
            this.load();
        }
        stop() { }
    }
    : (([Plugin, Library]) => {
        const { Patcher, DiscordModules, PluginUtilities } = Library;
        const { React } = DiscordModules;
        const Invite = BdApi.findModule(m => m.default?.displayName === "GuildInvite");
        const TooltipContainer = BdApi.findModuleByProps('TooltipContainer').TooltipContainer;
        class BetterInvites extends Plugin {
            constructor() {
                super();
                this.getSettingsPanel = () => {
                    return this.buildSettingsPanel().getElement();
                };
            }
            onStart() {
                this.patchInvite();
                PluginUtilities.addStyle(this.getName(), ".content-1r-J1r { flex-wrap: wrap; }");
            }

            patchInvite() {
                Patcher.after(Invite, "default", (_, [props], component) => {
                    const { invite } = props;
                    if (!invite) return;
                    const { guild, inviter } = invite;

                    let expireTooltip = "";
                    if (invite.expires_at != null) {
                        const inviteExpireDays = Math.floor((new Date(invite.expires_at) - Date.now()) / 1000 / 60 / 60 / 24); // dias
                        const inviteExpireHours = Math.floor((new Date(invite.expires_at) - Date.now()) / 1000 / 60 / 60); // horas
                        const inviteExpireMinutes = Math.floor((new Date(invite.expires_at) - Date.now()) / 1000 / 60); // minutos

                        if (inviteExpireDays > 0) {
                            inviteExpireDays === 1 ? expireTooltip = `${inviteExpireDays} dia` : expireTooltip = `${inviteExpireDays} dias`;
                        } else if (inviteExpireHours > 0) {
                            inviteExpireHours === 1 ? expireTooltip = `${inviteExpireHours} hora` : expireTooltip = `${inviteExpireHours} horas`;
                        } else {
                            inviteExpireMinutes === 1 ? expireTooltip = `${inviteExpireMinutes} minuto` : expireTooltip = `${inviteExpireMinutes} minutos`;
                        }
                    }

                    const boostLevel = component.props.children[2].props.children[0].props.guild?.premiumTier;
                    component.props.children[2].props.children.splice(2, 0,
                        this.settings.showBoost || this.settings.showInviter || this.settings.showVerification || this.settings.showNSFW || this.settings.showExpire ?
                            React.createElement("div", { className: `${config.info.name}-iconWrapper`, style: { display: "grid", grid: "auto / auto auto", direction: "rtl", "grid-gap": "3px" } },
                                // boost
                                this.settings.showBoost && boostLevel > 0 ?
                                    React.createElement(TooltipContainer, { text: `Boost Nível ${boostLevel}` },
                                        React.createElement("img", { style: { height: "28px", borderRadius: "5px", objectFit: "contain" }, src: "https://discord.com/assets/4a2618502278029ce88adeea179ed435.svg" }))
                                    : null,

                                // convidado por @
                                this.settings.showInviter && inviter ?
                                    React.createElement(TooltipContainer, { text: `Convidado por ${inviter?.username}#${inviter?.discriminator}` },
                                        React.createElement("img", { style: { height: "28px", borderRadius: "5px", objectFit: "contain" }, onClick: () => { DiscordNative.clipboard.copy(inviter?.id); window.BdApi.showToast("Copied ID", { type: "info", icon: true, timeout: 4000 }) }, src: `https://cdn.discordapp.com/avatars/${inviter?.id}/${inviter?.avatar}.png?size=1024`, onError: (e) => { e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"; } }))
                                    : null,

                                // nível de verificação
                                this.settings.showVerification && guild?.verification_level > 0 ?
                                    React.createElement(TooltipContainer, { text: `Verificação Nível ${guild?.verification_level}` },
                                        React.createElement("img", { style: { height: "28px", borderRadius: "5px", objectFit: "contain" }, src: "https://discord.com/assets/e62b930d873735bbede7ae1785d13233.svg" }))
                                    : null,

                                // nível de NSFW
                                this.settings.showNSFW && guild?.nsfw_level > 0 ?
                                    React.createElement(TooltipContainer, { text: `NSFW de Nível ${guild?.nsfw_level}` },
                                        React.createElement("img", { style: { height: "28px", borderRadius: "5px", objectFit: "contain" }, src: "https://discord.com/assets/ece853d6c1c1cd81f762db6c26fade40.svg" }))
                                    : null,

                                // data de expiração do convite
                                this.settings.showExpire && invite.expires_at != null ?
                                    React.createElement(TooltipContainer, { text: `Expira em ${expireTooltip}` },
                                        React.createElement("img", { style: { height: "28px", borderRadius: "5px", objectFit: "contain" }, src: "https://discord.com/assets/630f5938948131784285d97d57a3e8a0.svg" }))
                                    : null,
                            ) : null
                    );

                    const contentDiv = component.props.children[2];

                    if (this.settings.showDescription && guild?.description) {
                        contentDiv.props.children.push(
                            React.createElement("div", { className: `${config.info.name}-guildDescription`, style: { marginTop: "1%" } },
                                React.createElement("div", { className: "markup-eYLPri" }, guild.description)
                            )
                        );
                    }

                    if (this.settings.bigJoinButton) {
                        const joinButton = contentDiv.props.children[3];
                        contentDiv.props.children.splice(3, 1);
                        joinButton.props.style = {
                            width: "100%",
                            margin: "3% 0 0 0"
                        };
                        contentDiv.props.children.push(joinButton);
                    }

                    if (!this.settings.showBanner && guild.features.includes("INVITE_SPLASH")) {
                        component.props.children.splice(0, 1);
                    } else if (this.settings.showBanner && guild?.banner) {
                        if (this.settings.bannerType === 1 && this.settings.showServerBannerForSplash) {
                            if (guild.features.includes("INVITE_SPLASH")) component.props.children.splice(0, 1);
                            component.props.children.splice(0, 0, React.createElement("div", {
                                className: `${config.info.name}-banner`,
                                style: { position: "relative", borderRadius: "4px 4px 0 0", height: "64px", margin: "-16px -16px 16px", overflow: "hidden" }
                            },
                            React.createElement("img", {
                                style: { display: "block", width: "100%", height: "100%", objectFit: "cover" },
                                src: `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.gif?size=1024`,
                                onError: (e) => { e.target.onError = null, e.target.src = `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024` }
                            })));
                        } else if (this.settings.bannerType === 0) {
                            component.props.children.splice(2, 0, React.createElement("img", {
                                className: `${config.info.name}-banner`,
                                src: `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.gif?size=1024`,
                                style: { width: "100%", height: "auto", maxHeight: "100px", borderRadius: "5px", objectFit: "cover" },
                                onError: (e) => { e.target.onError = null, e.target.src = `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024` }
                            }));
                            if (guild.features.includes("INVITE_SPLASH")) component.props.children.splice(0, 1);
                        }
                    }
                });
            }

            onStop() {
                Patcher.unpatchAll();
                PluginUtilities.removeStyle(this.getName());
            }
        }

        return BetterInvites;
    }
) (global.ZeresPluginLibrary.buildPlugin(config));
