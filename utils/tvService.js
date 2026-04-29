import { AndroidRemote, RemoteKeyCode, RemoteDirection } from "androidtv-remote";
import fs from "fs";
import path from "path";
import { logger } from "./logger.config.js";

const certPath = path.resolve(process.cwd(), "tv-cert.json");

class TVService {
    constructor(io) {
        this.io = io;
        this.remotes = {}; // IP -> AndroidRemote instance
        this.certs = {};

        this.loadCerts();
    }

    loadCerts() {
        if (fs.existsSync(certPath)) {
            try {
                this.certs = JSON.parse(fs.readFileSync(certPath, "utf-8"));
            } catch (err) {
                logger.error("Failed to load certs:", err);
            }
        }
    }

    saveCerts() {
        fs.writeFileSync(certPath, JSON.stringify(this.certs, null, 2), "utf-8");
    }

    async connectTV(ip) {
        if (this.remotes[ip]) {
            return { status: "already_connected" };
        }

        const options = {
            pairing_port: 6467,
            remote_port: 6466,
            name: 'nodejs-tv-remote',
            cert: this.certs[ip] || {}
        };

        const remote = new AndroidRemote(ip, options);
        
        remote.on('secret', () => {
            logger.warn(`[TVService] TV at ${ip} requires pairing secret.`);
            this.io.emit('tv_needs_pairing', { ip });
        });

        remote.on('powered', (powered) => {
            logger.info(`[TVService] TV at ${ip} powered state: ${powered}`);
            this.io.emit('tv_state', { ip, powered });
        });

        remote.on('volume', (volume) => {
            logger.info(`[TVService] TV at ${ip} volume:`, volume);
            this.io.emit('tv_volume', { ip, volume });
        });

        remote.on('error', (err) => {
            logger.error(`[TVService] Error on TV ${ip}:`, err);
            this.io.emit('tv_error', { ip, error: err.message || err });
        });

        remote.on('ready', () => {
             // Save the cert once ready
             this.certs[ip] = remote.certificate;
             this.saveCerts();
             logger.info(`[TVService] TV at ${ip} is ready.`);
             this.io.emit('tv_ready', { ip });
        });

        try {
            logger.info(`[TVService] Starting connection to ${ip}...`);
            this.remotes[ip] = remote;
            const started = await remote.start();
            return { status: started ? "started" : "failed" };
        } catch (err) {
            delete this.remotes[ip];
            logger.error(`[TVService] Connect failed to ${ip}:`, err);
            return { status: "error", error: err.message };
        }
    }

    async sendCode(ip, code) {
        const remote = this.remotes[ip];
        if (!remote) return { status: "not_connected" };
        try {
            remote.sendCode(code);
            return { status: "code_sent" };
        } catch (err) {
            return { status: "error", error: err.message };
        }
    }

    async sendKey(ip, keyName, direction = "SHORT") {
        const remote = this.remotes[ip];
        if (!remote) return { status: "not_connected" };
        
        // Prefix with KEYCODE_ if needed
        const keyCodeName = keyName.startsWith("KEYCODE_") ? keyName : "KEYCODE_" + keyName;
        const keyCode = RemoteKeyCode[keyCodeName];
        if (keyCode === undefined) {
            return { status: "error", error: `Unknown key ${keyName}` };
        }

        const dirEnum = RemoteDirection[direction];
        if (dirEnum === undefined) {
            return { status: "error", error: `Unknown direction ${direction}` };
        }

        try {
            remote.sendKey(keyCode, dirEnum);
            return { status: "key_sent" };
        } catch (err) {
            logger.error(`[TVService] sendKey error:`, err);
            return { status: "error", error: err.message };
        }
    }
    
    getConnected() {
        return Object.keys(this.remotes);
    }
}

export default TVService;
