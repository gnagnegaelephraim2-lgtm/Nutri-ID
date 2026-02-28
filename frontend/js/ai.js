/**
 * NUTRI-ID - AI NutriBot Logic (Gemini 1.5 Flash via Backend)
 */

class NutriBot {
    constructor() {
        this.chatBox = null;
        this.input = null;
        this.sendBtn = null;
        this.history = [];
        this.apiUrl = 'http://localhost:3000/api/ai/chat';
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

            // Welcome
            const userName = window.nutriAuth?.user?.full_name || '';
            setTimeout(() => {
                this.addMessage(`Akwaba ${userName} ! Je suis NutriBot, l'assistant médical et nutritionnel de Nutri-ID. Comment puis-je t'aider aujourd'hui ?`, 'bot');
            }, 500);
        }
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        this.input.value = '';
        this.addMessage(text, 'user');

        const thinkingId = this.addThinking();

        try {
            const token = window.nutriAuth ? window.nutriAuth.token : null;
            if (!token) throw new Error("Veuillez vous connecter pour utiliser l'IA.");

            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: text,
                    history: this.history.slice(-10) // last 10
                })
            });

            const data = await res.json();
            document.getElementById(thinkingId).remove();

            if (!res.ok) {
                throw new Error(data.error || data || "Erreur réseau");
            }

            this.history.push({ role: 'user', parts: [{ text }] });
            this.history.push({ role: 'model', parts: [{ text: data.reply }] });

            this.addMessage(data.reply, 'bot');
        } catch (error) {
            console.error('AI Error:', error);
            if (document.getElementById(thinkingId)) {
                document.getElementById(thinkingId).remove();
            }
            this.addMessage(`⚠️ **Erreur** : ${error.message}`, 'bot');
        }
    }

    addMessage(text, sender) {
        if (!this.chatBox) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}-msg`;

        // Simple Markdown bold (*text* or **text**)
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Simple line breaks
        formattedText = formattedText.replace(/\n/g, '<br>');

        const icon = sender === 'bot'
            ? `<i class='bx bx-bot bg-orange p-1 rounded-circle'></i>`
            : `<i class='bx bx-user bg-dark p-1 rounded-circle'></i>`;

        msgDiv.innerHTML = `
            <div class="msg-content">
                ${icon}
                <div class="msg-bubble glass">${formattedText}</div>
            </div>
        `;

        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    addThinking() {
        if (!this.chatBox) return '';
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
