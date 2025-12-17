import { CollabMessage, CollabUser } from "./types";

/**
 * REAL-TIME COLLABORATION HUB (Layer 9)
 * Uses BroadcastChannel for peer-to-peer tab communication.
 */

export class CollaborationHub {
    private channel: BroadcastChannel;
    private userId: string;
    private userName: string;
    private userColor: string;
    private onUpdate: (users: CollabUser[], messages: string[]) => void;
    
    private users: Map<string, CollabUser> = new Map();
    private chatHistory: string[] = [];

    constructor(onUpdate: (users: CollabUser[], messages: string[]) => void) {
        this.channel = new BroadcastChannel('nexus_v35_collab');
        this.userId = Math.random().toString(36).substr(2, 9);
        this.userName = `Operative-${this.userId.substr(0,4)}`;
        this.userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        this.onUpdate = onUpdate;

        this.channel.onmessage = (event) => this.handleMessage(event.data);
        
        // Announce presence
        this.broadcast({
            type: 'JOIN',
            userId: this.userId,
            payload: { name: this.userName, color: this.userColor }
        });

        // Periodic heartbeat
        setInterval(() => {
            this.broadcast({
                type: 'CURSOR',
                userId: this.userId,
                payload: { x: 0, y: 0 } // Just keepalive for now
            });
        }, 5000);
        
        // Add self
        this.users.set(this.userId, {
            id: this.userId,
            name: this.userName,
            color: this.userColor,
            cursor: { x: 0, y: 0 },
            isActive: true
        });
        
        this.triggerUpdate();
    }

    private handleMessage(msg: CollabMessage) {
        if (msg.userId === this.userId) return;

        switch (msg.type) {
            case 'JOIN':
                this.users.set(msg.userId, {
                    id: msg.userId,
                    name: msg.payload.name,
                    color: msg.payload.color,
                    cursor: { x: 0, y: 0 },
                    isActive: true
                });
                this.addChat(`System: ${msg.payload.name} joined the Nexus.`);
                // Reply with our existence so they know us
                if (Math.random() > 0.5) { // Avoid storm
                    this.broadcast({
                        type: 'JOIN',
                        userId: this.userId,
                        payload: { name: this.userName, color: this.userColor }
                    });
                }
                break;
            case 'CHAT':
                this.addChat(`${this.users.get(msg.userId)?.name || 'Unknown'}: ${msg.payload.text}`);
                break;
            case 'GENERATE':
                this.addChat(`⚡ ${this.users.get(msg.userId)?.name} initiated a generation: "${msg.payload.concept}"`);
                break;
        }
        this.triggerUpdate();
    }

    private addChat(msg: string) {
        this.chatHistory = [msg, ...this.chatHistory].slice(0, 50);
    }

    broadcast(msg: CollabMessage) {
        this.channel.postMessage(msg);
    }

    sendChat(text: string) {
        this.addChat(`${this.userName}: ${text}`);
        this.broadcast({
            type: 'CHAT',
            userId: this.userId,
            payload: { text }
        });
        this.triggerUpdate();
    }

    notifyGeneration(concept: string) {
        this.broadcast({
            type: 'GENERATE',
            userId: this.userId,
            payload: { concept }
        });
    }

    private triggerUpdate() {
        this.onUpdate(Array.from(this.users.values()), this.chatHistory);
    }

    public getMyself() {
        return this.users.get(this.userId);
    }
}
