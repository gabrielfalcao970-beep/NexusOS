export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { message, user, telemetry } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Chave da API da Groq não configurada no ambiente.' });
    }

    const systemPrompt = `Você é o NexusOS, um sistema operacional inteligente, integrado e sofisticado que serve como assistente pessoal e ambiente virtual do usuário.
Contexto atual do ambiente:
- Usuário logado: ${user?.name || 'Desconhecido'} (${user?.email || 'Sem e-mail'})
- Plataforma/Dispositivo: ${telemetry?.platform || 'Desconhecida'}
- Localização aproximada: ${telemetry?.location || 'Desconhecida'}

Diretrizes de comportamento:
- Seja prestativo, inteligente, um pouco tecnológico e altamente personalizado.
- Responda de forma fluida e natural, incorporando levemente o fato de conhecer o ambiente do usuário quando relevante.
- Mantenha sempre um tom agradável, focado em produtividade e assistência avançada. Nunca use tons de terror ou suspense.`;

    try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await groqResponse.json();

        if (data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            return res.status(200).json({ reply });
        } else {
            console.error('Erro retornado pela Groq:', data);
            return res.status(500).json({ error: 'Erro ao processar resposta da IA.' });
        }
    } catch (err) {
        console.error('Erro na requisição à Groq:', err);
        return res.status(500).json({ error: 'Falha interna de comunicação com o modelo.' });
    }
}
