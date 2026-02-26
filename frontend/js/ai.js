/**
 * NUTRI-ID - AI NutriBot Logic
 */

class NutriBot {
    constructor() {
        this.chatBox = null;
        this.input = null;
        this.sendBtn = null;
    }

    init() {
        this.chatBox = document.getElementById('ai-chat-box');
        this.input = document.getElementById('ai-input');
        this.sendBtn = document.getElementById('ai-send');

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });

            // Add initial bot greeting
            setTimeout(() => {
                this.addMessage("Bonjour ! Je suis NutriBot, votre assistant de santé locale propulsé par l'IA. Que mangez-vous aujourd'hui en Côte d'Ivoire ? (ex: Garba, Foutou banane, Attiéké)", 'bot');
            }, 500);
        }
    }

    sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add user message
        this.addMessage(text, 'user');
        this.input.value = '';

        // Simulate thinking
        const thinkingId = this.addThinking();

        // Mock AI Response (In production: call Axum backend -> LLM API)
        setTimeout(() => {
            document.getElementById(thinkingId).remove();
            let response = "L'analyse nutritionnelle pour ce repas ivoirien donne : environ 50g de glucides, 20g de lipides, et 15g de protéines. Attention à la consommation d'huile ! C'est bon pour l'énergie mais à modérer.";
            if (text.toLowerCase().includes('garba')) {
                response = "Le **Garba** est délicieux ! Attention cependant à la portion de thon frit et d'huile. Riche en énergie (Attiéké/Manioc = glucides) et en protéines (thon), environ 600-800 kcal la portion moyenne.";
            } else if (text.toLowerCase().includes('foutou')) {
                response = "Le **Foutou (Banane ou Igname)** accompagné de sauce graine est un plat calorique. Très riche en glucides complexes et lipides. Idéal pour les travaux physiques, mais à limiter si vous êtes sédentaire (diabète/tension à surveiller).";
            }
            this.addMessage(response, 'bot');
        }, 1500);
    }

    addMessage(text, sender) {
        if (!this.chatBox) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}-msg`;

        const icon = sender === 'bot' ? `<i class='bx bx-bot bg-orange p-1 rounded-circle'></i>` : `<i class='bx bx-user bg-dark p-1 rounded-circle'></i>`;

        msgDiv.innerHTML = `
            <div class="msg-content">
                ${icon}
                <div class="msg-bubble glass">${text}</div>
            </div>
        `;

        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    addThinking() {
        const id = 'thinking-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = `chat-msg bot-msg`;
        msgDiv.innerHTML = `
            <div class="msg-content">
                <i class='bx bx-bot bg-orange p-1 rounded-circle'></i>
                <div class="msg-bubble glass typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
            </div>
        `;
        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        return id;
    }
}
