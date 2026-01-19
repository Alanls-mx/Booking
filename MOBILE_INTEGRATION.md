# Guia de Integração Mobile - FlexBook API

Este documento serve como referência para desenvolvedores mobile que desejam integrar seus aplicativos com o backend do FlexBook.

## 1. Visão Geral
A API é RESTful e construída em Node.js (NestJS). Todas as respostas são em formato JSON.

**Base URL (Desenvolvimento):** `http://<SEU_IP_LOCAL>:3000`
> **Nota:** Emuladores Android/iOS não acessam `localhost`. Use o IP da sua máquina na rede local (ex: `192.168.1.5`).

## 2. Autenticação
A maioria dos endpoints requer um token JWT.

### Login
**POST** `/auth/login`
```json
{
  "email": "cliente@exemplo.com",
  "password": "senha123",
  "tenantId": "ID_DO_TENANT" 
}
```
> **Nota:** O `tenantId` identifica a empresa (barbearia/salão). Se o app for exclusivo para uma empresa, este ID pode ser fixo no código.

**Resposta Sucesso (201):**
```json
{
  "access_token": "eyJhbGciOiJIUz...",
  "user": {
    "id": "uuid-...",
    "name": "Nome do Cliente",
    "email": "cliente@exemplo.com",
    "role": "CLIENT"
  }
}
```
> **Ação:** Armazene o `access_token` no armazenamento seguro do dispositivo (Keychain/Keystore).

### Registro (Novo Usuário)
**POST** `/auth/register`
```json
{
  "name": "Novo Cliente",
  "email": "novo@exemplo.com",
  "password": "senha123",
  "tenantId": "ID_DO_TENANT"
}
```

## 3. Cabeçalhos (Headers)
Para endpoints protegidos, inclua o cabeçalho:
```
Authorization: Bearer <access_token>
```

## 4. Endpoints Principais

### 🏢 Serviços, Profissionais e Unidades (Públicos)
Não requer token. Útil para montar a tela inicial ou de agendamento.

*   **Listar Serviços:** `GET /services?tenantId=...`
*   **Listar Profissionais:** `GET /professionals?tenantId=...`
*   **Listar Unidades:** `GET /locations?tenantId=...` (Para barbearias com múltiplas filiais)

### 📅 Agendamentos (Requer Token)

*   **Meus Agendamentos:**
    `GET /appointments?tenantId=...`
    *   O backend identifica o usuário pelo token e retorna apenas os agendamentos dele.
    *   Suporta paginação: `?page=1&limit=10`

*   **Criar Agendamento:**
    **POST** `/appointments`
    ```json
    {
      "tenantId": "...",
      "date": "2024-03-20T14:00:00.000Z",
      "professionalId": "uuid-profissional", // Opcional
      "locationId": "uuid-unidade", // Opcional (se houver múltiplas unidades)
      "serviceIds": ["uuid-servico-1", "uuid-servico-2"],
      "userId": "uuid-do-usuario" // Geralmente o mesmo do usuário logado
    }
    ```

*   **Cancelar Agendamento:**
    **PATCH** `/appointments/:id/status?tenantId=...`
    ```json
    {
      "status": "CANCELED"
    }
    ```

### 👤 Perfil (Requer Token)

*   **Obter meus dados:**
    `GET /users/profile`
    *   Retorna os dados atualizados do usuário logado.

## 5. Swagger (Documentação Interativa)
Para ver todos os endpoints e testar diretamente no navegador, acesse:
`http://localhost:3000/api/docs`

## 6. Dicas para Mobile
1.  **Tenant ID:** Se o aplicativo for "White Label" (um app para cada barbearia), o `tenantId` deve vir de uma configuração remota ou ser fixo no build. Se for um Marketplace, o usuário seleciona a empresa primeiro.
2.  **Datas:** Sempre envie datas no formato ISO 8601 UTC (ex: `2024-03-20T14:30:00.000Z`). O backend converte conforme necessário.
3.  **Erros:** A API retorna erros no formato:
    ```json
    {
      "statusCode": 400,
      "message": "Descrição do erro",
      "error": "Bad Request"
    }
    ```
