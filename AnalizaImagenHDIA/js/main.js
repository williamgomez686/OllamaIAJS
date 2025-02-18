async function send() {
    const prompt = document.getElementById('prompt').value;
    const imageInput = document.getElementById('image');
    const responseDiv = document.getElementById('response');
    responseDiv.innerHTML = 'Esperando respuesta...';

    let base64Image = null;
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        base64Image = await convertToBase64(file);
        console.log(file);
    }
    
        
    try{
        const requestBody = {
            model : "llava:7b",
            prompt: `Responde en español: ${prompt}`,
            stream: true
        };

        if(base64Image){
            requestBody.images = [base64Image];
        }
        console.log(base64Image);
        const response = await fetch("http://localhost:11434/api/generate",{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok){
            throw new Error(`HTTP error! En la respuesta de ollama : ${response.status}`);
        }

        responseDiv.innerHTML = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while(true){
            const {done, value} = await reader.read();
            if(done){
                break;
            }

            const textChunk = decoder.decode(value, {stream: true});
            const json = JSON.parse(textChunk);

            responseDiv.innerHTML += json.response;
        }

    }catch(error){
        responseDiv.innerHTML = `<strong>Error al enviar la solicitud </strong> ${error.message}`;
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}