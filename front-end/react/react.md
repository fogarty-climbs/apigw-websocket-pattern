# apigw-websocket-pattern

A production-grade, fully deployed WebSocket architecture demonstrating real-time multi-device communication using AWS API Gateway, Lambda, DynamoDB, and React.

## Architecture

A three layer separation of concerns:

**useWebSocket** — raw WebSocket primitive. Manages connection lifecycle, exposes connection state and incoming messages as reactive state. Intentionally free of business logic.

**useChat** — high level chat hook built on top of useWebSocket. Translates raw WebSocket payloads into typed chat state — messages, presence, and connected users.

**Chat components** — pure presentation layer. Chat.tsx orchestrates state and callbacks, delegating all rendering to JoinScreen, MessageList, ConnectedUsers and ChatInput sub-components.

## Stack

React · TypeScript · AWS API Gateway WebSocket · Lambda · DynamoDB · Python · Terraform

## Live Demo

Open on two devices simultaneously and watch messages appear in real time — no polling, no page refresh.