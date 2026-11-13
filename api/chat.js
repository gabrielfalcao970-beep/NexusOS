export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido' });
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Corpo da requisição inválido.' });
    }

    const textMessage = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!textMessage) {
        return res.status(400).json({ error: 'Digite uma mensagem.' });
    }
    if (textMessage.length > 4000) {
        return res.status(413).json({ error: 'A mensagem deve ter no máximo 4.000 caracteres.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'O serviço de IA não está configurado no servidor.' });
    }

    const systemPrompt = 'Você é o NexusOS, um assistente pessoal prestativo, inteligente e focado em produtividade. Responda de forma clara, natural e agradável.';

    try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: textMessage }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('Erro retornado pela Groq:', errorText);
            return res.status(502).json({ error: 'Falha ao consultar o serviço de IA.' });
        }

        const data = await groqResponse.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (typeof reply !== 'string' || !reply.trim()) {
            console.error('Resposta inválida da Groq:', data);
            return res.status(502).json({ error: 'O serviço de IA retornou uma resposta inválida.' });
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Erro na requisição à Groq:', error);
        return res.status(500).json({ error: 'Falha interna de comunicação com o modelo.' });
    }
}
