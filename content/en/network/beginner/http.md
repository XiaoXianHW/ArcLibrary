---
title: "HTTP Basics"
description: "The language of the web — how browsers talk to servers."
icon: globe
order: 2
chapter: application
chapterTitle: "Application Layer Basics"
chapterOrder: 4
tags: [HTTP, Request, Response]
---

<KeyIdea>
**In one line**: **HTTP** is the **request/response** protocol between browser and server. The client sends a request (method + URL + headers + body); the server returns a response (status + headers + body).
</KeyIdea>

## What it is

A barebones HTTP/1.1 request:

```http
GET /index.html HTTP/1.1
Host: example.com
User-Agent: curl/8.0
Accept: */*

```

Server responds:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1234

<html>...
```

**A plain-text protocol** you can read with your eyes — that's why HTTP became universal.

## Analogy

<Analogy>
HTTP is like **ordering food**:
- Client: "**GET** the index page over HTTP 1.1; I'm curl" = waiter, I want this;
- Server: "**200 OK**, here's the HTML, 1234 bytes" = your dish, sir.

Every exchange is **one question, one answer**, and the server **doesn't remember you** by default (stateless).
</Analogy>

## Key concepts

<Terms items={[
  { term: "Methods", en: "Method", def: "GET reads / POST creates / PUT replaces / PATCH partial / DELETE removes / HEAD headers only / OPTIONS capability." },
  { term: "Status codes", en: "Status Code", def: "1xx info / 2xx success / 3xx redirect / 4xx client error / 5xx server error." },
  { term: "Headers", en: "Headers", def: "Key/value metadata: Host, Accept, Content-Type, Authorization." },
  { term: "Body", en: "Body", def: "Payload for POST/PUT. GET has no body." },
  { term: "Stateless", en: "Stateless", def: "HTTP itself remembers nothing. Sessions via Cookie / token resent on every request." },
  { term: "Idempotent", en: "Idempotent", def: "Same result regardless of repeats: GET / PUT / DELETE; POST often not." },
]} />

## How it works

```mermaid
sequenceDiagram
    participant B as Browser
    participant D as DNS
    participant S as Web server
    B->>D: resolve example.com
    D-->>B: 93.184.216.34
    B->>S: TCP 3-way handshake :80
    B->>S: GET /index.html HTTP/1.1
    S-->>B: 200 OK + HTML
    B->>B: parse HTML; may trigger N more requests<br/>(CSS, JS, images, fetch...)
```

Opening one page **typically fires dozens of HTTP requests** — every static asset, every API call.

## Practical notes

- **Memorise key status codes**: `200` OK, `301/302` redirect, `304` not modified, `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `500` server error, `502/504` gateway / upstream.
- **`curl -i URL`** shows headers; **`curl -v URL`** shows full traffic.
- **Don't abuse POST.** If GET works (cacheable, bookmarkable, replayable), use it.
- **Content-Type drives parsing**: `application/json` / `application/x-www-form-urlencoded` / `multipart/form-data`.
- **CORS is browser-side, not HTTP-spec.** It's a **browser security policy**; the backend sets `Access-Control-Allow-Origin` to permit.

## Easy confusions

<Compare
  leftTitle="HTTP/1.1"
  rightTitle="HTTP/2"
  left={<>
    Text protocol; one request per TCP connection at a time.<br />
    Concurrency via multiple connections.
  </>}
  right={<>
    Binary + multiplexing; many parallel requests on one connection.<br />
    Header compression.
  </>}
/>

## Further reading

- [HTTPS](/network/beginner/https) / [TLS](/network/beginner/tls)
- [HTTP/2](/network/advanced/http2)
- [HTTP/3 and QUIC](/network/advanced/http3-quic)
