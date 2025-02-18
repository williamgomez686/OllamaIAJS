async function enviarPrompt() {
    const prompt = document.getElementById("prompt").value;
    if (!prompt.trim()) {
        alert("Por favor, escribe algo");
        return;
    }

    const chatMessages = document.getElementById("chatMessages");
    
    // Agrega el mensaje del usuario
    const userMessage = document.createElement("div");
    userMessage.className = "message user-message";
    userMessage.textContent = prompt;
    chatMessages.appendChild(userMessage);

    // Muestra mensaje de espera
    const waitingMessage = document.createElement("div");
    waitingMessage.className = "message assistant-message loading";
    waitingMessage.textContent = "Pensando...";
    chatMessages.appendChild(waitingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                model: "deepseek-r1:14b",
                prompt: prompt,
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let think = false;
        let currentResponse = "";
        let finalResponse = "";

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, {stream: true});
            try {
                const json = JSON.parse(textChunk);

                if (json.response) {
                    if (json.response === "```") {
                        think = !think;
                        if (!think) {
                            // Finaliza el proceso de pensamiento
                            const thinkMessage = document.createElement("div");
                            thinkMessage.className = "message assistant-message think";
                            thinkMessage.textContent = currentResponse;
                            chatMessages.appendChild(thinkMessage);
                            currentResponse = "";

                            // Muestra la respuesta final
                            const responseMessage = document.createElement("div");
                            responseMessage.className = "message assistant-message final";
                            responseMessage.textContent = json.response;
                            chatMessages.appendChild(responseMessage);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } else {
                            // Inicia el proceso de pensamiento
                            currentResponse = json.response;
                        }
                    } else {
                        if (think) {
                            currentResponse += "\n" + json.response;
                        } else {
                            finalResponse += json.response;
                        }
                    }
                }
            } catch (e) {
                console.warn("Error al convertir el JSON:", textChunk);
            }
        }

        // Si hay respuesta final pendiente, muéstrala
        if (finalResponse) {
            const responseMessage = document.createElement("div");
            responseMessage.className = "message assistant-message final";
            responseMessage.textContent = finalResponse;
            chatMessages.appendChild(responseMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Elimina el mensaje de espera
        chatMessages.removeChild(waitingMessage);
    } catch (error) {
        const errorMessage = document.createElement("div");
        errorMessage.className = "message assistant-message";
        errorMessage.innerHTML = `<strong>Error:</strong> ${error.message}`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Limpia el textarea
    document.getElementById("prompt").value = "";
}
