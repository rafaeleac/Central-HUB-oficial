import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface RequestBody {
  nome: string;
  telefone: string;
  email: string;
  descricao: string;
  arquivos?: string[];
  destinatario: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: RequestBody = await req.json();
    const { nome, telefone, email, descricao, arquivos, destinatario } = body;

    // Construir HTML do email
    let emailHTML = `
      <h2>Nova Solicitação de Suporte</h2>
      <hr />
      <h3>Dados do Solicitante:</h3>
      <ul>
        <li><strong>Nome:</strong> ${nome}</li>
        <li><strong>Telefone:</strong> ${telefone}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <h3>Descrição do Problema:</h3>
      <p>${descricao.replace(/\n/g, "<br />")}</p>
    `;

    if (arquivos && arquivos.length > 0) {
      emailHTML += `
        <h3>Anexos:</h3>
        <ul>
          ${arquivos.map((url) => `<li><a href="${url}">${url.split("/").pop()}</a></li>`).join("")}
        </ul>
      `;
    }

    // Enviar email usando Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@hub-central.com",
        to: destinatario,
        reply_to: email,
        subject: `[SUPORTE HUB] Nova Solicitação de ${nome}`,
        html: emailHTML,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao enviar email");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
