# Guia Oficial: Notificações Push em Segundo Plano (PWA) - Jejuar

Este guia explica como funciona a entrega de notificações no aplicativo **Jejuar** com o celular fechado, como testar os disparos e como configurar o agendamento contínuo (24 horas por dia) sem custo.

---

## 1. Arquitetura Geral

O sistema de notificações do Jejuar é composto por 3 camadas integradas:

```
[ PWA no Celular ] 
       │ 
       ▼ (Registro do endpoint e chaves VAPID)
[ Google Firebase Firestore ]
       │ 
       ▼ (Varredura inteligente a cada 5-10 minutos)
[ Servidor Full-Stack Express (server.ts) ]
       │ 
       ▼ (Criptografia RFC 8291 / Urgency: high)
[ Google FCM / Apple APNs ]
       │ 
       ▼ (Evento 'push' no Service Worker sw.js)
[ Tela de Bloqueio do Usuário ]
```

---

## 2. Os 4 Pilares de Notificação Implementados

1. **Hidratação (Água):**
   - Disparo de hora em hora (ou conforme o intervalo configurado: 30min, 1h, 2h, 3h).
   - Respeita o horário de Início (ex: 08:00) e Fim (ex: 21:00).
   - Possui **janela de tolerância inteligente de 35 minutos**: se o servidor acordar às 08:05 ou 08:12, a notificação das 08:00 é entregue sem falhas e sem duplicidade.

2. **Jejum Intermitente:**
   - Alerta 2h antes e 1h antes do horário programado de início.
   - Início pontual (com opção de início automático pelo servidor).
   - Marco de 3h de digestão e queima inicial de glicogênio.
   - Marco de 50% da meta de jejum alcançada.
   - Alerta 2h antes da meta e notificação de celebração da meta concluída.

3. **Pesagem Periódica:**
   - Dispara no horário configurado (ex: 08:00).
   - Dispara no(s) dia(s) específico(s) da semana configurado(s) pelo usuário (ex: *Segunda-feira* ou *Todos os dias*).

4. **Ciclo de Bioimpedância:**
   - Respeita a periodicidade configurada (30, 45, 60 ou 90 dias).
   - Envia aviso prévio **3 dias antes** do reteste.
   - Dispara o alerta matinal (às 08:00) no dia de realizar o novo exame corporal.

---

## 3. Como Manter os Disparos Ativos 24/7 (Solução Anti-Hibernação)

Em plataformas serverless na nuvem (como Cloud Run), os containers entram em estado de economia de energia (hibernação) quando não há tráfego HTTP.

Para garantir que o servidor acorde pontualmente mesmo se o usuário passar 3 dias sem abrir o app, disponibilizamos o webhook:

- **URL de Disparo:**
  `https://ais-dev-dle6nddlzlxvwy2dcya6to-269904422513.us-east1.run.app/api/cron/verificar-notificacoes`
  (ou na sua URL de produção / preview: `https://ais-pre-...run.app/api/cron/verificar-notificacoes`)

- **Método HTTP:** `GET` ou `POST`

### Como configurar em 2 minutos no Cron-Job.org (100% Gratuito):
1. Acesse [cron-job.org](https://cron-job.org) e crie uma conta gratuita.
2. Clique em **Create Cronjob**.
3. No campo **URL**, cole:
   `https://ais-dev-dle6nddlzlxvwy2dcya6to-269904422513.us-east1.run.app/api/cron/verificar-notificacoes`
4. No campo **Schedule**, selecione: **Every 10 minutes** (A cada 10 minutos).
5. Salve o cronjob.

Pronto! A cada 10 minutos o cronjob fará um ping HTTP no servidor, que acordará instantaneamente, consultará o Firestore e disparará todos os lembretes de água, jejum, pesagem e bioimpedância para os celulares cadastrados.

---

## 4. Teste Rápido via Terminal ou Navegador

Você pode disparar uma varredura a qualquer momento abrindo no seu navegador:
`https://ais-dev-dle6nddlzlxvwy2dcya6to-269904422513.us-east1.run.app/api/cron/verificar-notificacoes`

Resposta esperada:
```json
{
  "sucesso": true,
  "mensagem": "Varredura de notificações executada com sucesso.",
  "usuariosProcessados": 1,
  "notificacoesEnviadas": 1,
  "timestamp": "2026-10-29T..."
}
```
