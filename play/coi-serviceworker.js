/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;
const urbangroundAgentConfigs = new Map();
const agentConfigureMessageTypes = ["urbangroundAgentConfigure"];
const agentClearMessageTypes = ["urbangroundAgentClear"];
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then(clients => {
                    clients.forEach((client) => client.navigate(client.url));
                });
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        } else if (agentConfigureMessageTypes.includes(ev.data.type)) {
            const { endpoint, apiKey, model } = ev.data;
            try {
                const parsed = new URL(endpoint), sourceOrigin = new URL(ev.source.url).origin;
                if ((parsed.protocol === "https:" || parsed.protocol === "http:") && apiKey && model &&
                    sourceOrigin === self.location.origin && /\/play\/?$/.test(new URL(ev.source.url).pathname)) {
                    urbangroundAgentConfigs.set(ev.source.id, { endpoint: parsed.href, apiKey, model });
                }
            } catch (_) { }
        } else if (agentClearMessageTypes.includes(ev.data.type)) {
            const config = urbangroundAgentConfigs.get(ev.source.id);
            if (config) {
                config.apiKey = "";
                urbangroundAgentConfigs.delete(ev.source.id);
            }
        }
    });

    async function forwardUrbanGroundAgentRequest(request, config) {
        const headers = new Headers(request.headers);
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + config.apiKey);

        let body = await request.clone().text();
        try {
            const payload = JSON.parse(body);
            payload.model = config.model;
            body = JSON.stringify(payload);
        } catch (_) { }

        return fetch(config.endpoint, {
            method: "POST",
            headers,
            body,
            credentials: "omit",
            redirect: "follow"
        });
    }

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        // The document still needs COOP/COEP headers from this worker, but
        // Unity's own same-origin binaries must retain their original streamed
        // responses. Re-wrapping large .unityweb and StreamingAssets responses
        // can make the browser reject a cache revalidation on GitHub Pages.
        const url = new URL(r.url);
        const scopePath = new URL(self.registration.scope).pathname;
        if (url.origin === self.location.origin && ["Build/", "StreamingAssets/", "TemplateData/"].some(
            (directory) => url.pathname.startsWith(scopePath + directory)
        )) {
            return;
        }

        // Unity's multithreaded WebGL player can issue the request from its
        // dedicated worker rather than the iframe client that supplied the
        // configuration. A sole active play session is therefore unambiguous.
        const agentConfig = urbangroundAgentConfigs.get(event.clientId) ||
            (urbangroundAgentConfigs.size === 1 ? urbangroundAgentConfigs.values().next().value : null);
        if (agentConfig && r.method === "POST" && r.url === "https://api.openai.com/v1/chat/completions") {
            event.respondWith(forwardUrbanGroundAgentRequest(r, agentConfig));
            return;
        }

        const request = (coepCredentialless && r.mode === "no-cors")
            ? new Request(r, {
                credentials: "omit",
            })
            : r;
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    if (!coepCredentialless) {
                        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
                    }
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((error) => {
                    console.error(error);
                    throw error;
                })
        );
    });

} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coepDegrading = (reloadedBySelf == "coepdegrade");

        // You can customize the behavior of this script through a global `coi` variable.
        const coi = {
            shouldRegister: () => !reloadedBySelf,
            shouldDeregister: () => false,
            coepCredentialless: () => true,
            coepDegrade: () => true,
            doReload: () => window.location.reload(),
            quiet: false,
            ...window.coi
        };

        const n = navigator;
        const controlling = n.serviceWorker && n.serviceWorker.controller;

        // Record the failure if the page is served by serviceWorker.
        if (controlling && !window.crossOriginIsolated) {
            window.sessionStorage.setItem("coiCoepHasFailed", "true");
        }
        const coepHasFailed = window.sessionStorage.getItem("coiCoepHasFailed");

        if (controlling) {
            // Ensure a directly opened /play/ page also adopts a newly
            // versioned worker instead of remaining pinned to an old script.
            let reloadingForControllerChange = false;
            n.serviceWorker.addEventListener("controllerchange", () => {
                if (reloadingForControllerChange) return;
                reloadingForControllerChange = true;
                coi.doReload("controllerchange");
            });
            const currentScriptUrl = window.document.currentScript.src;
            n.serviceWorker.getRegistration().then((registration) => {
                if (registration && registration.active &&
                    registration.active.scriptURL !== currentScriptUrl) {
                    return n.serviceWorker.register(currentScriptUrl);
                }
            }).catch((error) => console.error("COOP/COEP Service Worker update failed:", error));

            // Reload only on the first failure.
            const reloadToDegrade = coi.coepDegrade() && !(
                coepDegrading || window.crossOriginIsolated
            );
            n.serviceWorker.controller.postMessage({
                type: "coepCredentialless",
                value: (reloadToDegrade || coepHasFailed && coi.coepDegrade())
                    ? false
                    : coi.coepCredentialless(),
            });
            if (reloadToDegrade) {
                !coi.quiet && console.log("Reloading page to degrade COEP.");
                window.sessionStorage.setItem("coiReloadedBySelf", "coepdegrade");
                coi.doReload("coepdegrade");
            }

            if (coi.shouldDeregister()) {
                n.serviceWorker.controller.postMessage({ type: "deregister" });
            }
        }

        // If we're already coi: do nothing. Perhaps it's due to this script doing its job, or COOP/COEP are
        // already set from the origin server. Also if the browser has no notion of crossOriginIsolated, just give up here.
        if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;

        if (!window.isSecureContext) {
            !coi.quiet && console.log("COOP/COEP Service Worker not registered, a secure context is required.");
            return;
        }

        // In some environments (e.g. Firefox private mode) this won't be available
        if (!n.serviceWorker) {
            !coi.quiet && console.error("COOP/COEP Service Worker not registered, perhaps due to private mode.");
            return;
        }

        n.serviceWorker.register(window.document.currentScript.src).then(
            (registration) => {
                !coi.quiet && console.log("COOP/COEP Service Worker registered", registration.scope);

                registration.addEventListener("updatefound", () => {
                    !coi.quiet && console.log("Reloading page to make use of updated COOP/COEP Service Worker.");
                    window.sessionStorage.setItem("coiReloadedBySelf", "updatefound");
                    coi.doReload();
                });

                // If the registration is active, but it's not controlling the page
                if (registration.active && !n.serviceWorker.controller) {
                    !coi.quiet && console.log("Reloading page to make use of COOP/COEP Service Worker.");
                    window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling");
                    coi.doReload();
                }
            },
            (err) => {
                !coi.quiet && console.error("COOP/COEP Service Worker failed to register:", err);
            }
        );
    })();
}
