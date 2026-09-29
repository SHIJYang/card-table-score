#!/usr/bin/env node
/**
 * picui-image-host MCP server（stdio，无第三方依赖，Node >= 20）
 *
 * 连接 picui.cn 图床 API（https://picui.cn/api/v1），暴露以下工具：
 *   picui_profile      用户信息与容量使用
 *   picui_list_images  分页列出图片（可按相册过滤）
 *   picui_upload_image 上传本地文件
 *   picui_delete_image 删除图片（需 confirm: true）
 *   picui_list_albums  分页列出相册
 *   picui_delete_album 删除相册（需 confirm: true）
 *
 * 鉴权 Token（与站点前端 settingsStore.imgapi 同一个 Token）：
 *   1. 环境变量 PICUI_TOKEN（优先）
 *   2. 文件 ~/.picui-token（一行纯文本）
 * 可用环境变量 PICUI_BASE_URL 覆盖默认 API 地址。
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const NAME = 'picui-image-host';
const VERSION = '0.1.0';
const BASE = (process.env.PICUI_BASE_URL || 'https://picui.cn/api/v1').replace(/\/+$/, '');
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function resolveToken() {
  const env = (process.env.PICUI_TOKEN || '').trim();
  if (env) return env;
  const file = process.env.PICUI_TOKEN_FILE || join(homedir(), '.picui-token');
  if (existsSync(file)) {
    const t = readFileSync(file, 'utf8').trim();
    if (t) return t;
  }
  return '';
}

async function apiCall(method, path, { query, form, json } = {}) {
  const token = resolveToken();
  if (!token) {
    throw new Error('未配置 picui Token：请把 Token 写入 ~/.picui-token 文件，或在 MCP 配置里设置环境变量 PICUI_TOKEN');
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  let body;
  if (form) {
    body = form;
  } else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { status: false, message: `非 JSON 响应（HTTP ${res.status}）：${text.slice(0, 300)}` };
  }
  if (!res.ok || data.status === false) {
    const detail = data?.message || `HTTP ${res.status}`;
    throw new Error(`${method} ${path} 失败：${detail}`);
  }
  return data;
}

const TOOLS = [
  {
    name: 'picui_profile',
    description: '获取 picui.cn 图床账号信息：用户名、邮箱、已用容量/总容量、图片数量等。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'picui_list_images',
    description: '分页列出图床中的图片（含图片直链、缩略图、大小、上传时间、所属相册）。可按相册过滤。',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: '页码，默认 1' },
        per_page: { type: 'number', description: '每页数量，默认 20，最大 100' },
        album_id: { type: 'number', description: '可选，只列出该相册下的图片' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'picui_upload_image',
    description: '上传本地文件到 picui.cn 图床，返回图片直链等完整信息。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '要上传的本地文件绝对路径' },
        album_id: { type: 'number', description: '可选，上传到的相册 ID' },
        permission: { type: 'number', description: '可选，可见权限（1 公开 / 0 私有）' },
        expired_at: { type: 'string', description: '可选，过期时间，如 2026-12-31 23:59:59' }
      },
      required: ['path'],
      additionalProperties: false
    }
  },
  {
    name: 'picui_delete_image',
    description: '按 key 删除图床中的一张图片。不可恢复，必须显式传 confirm: true。',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: '图片 key（picui_list_images 结果中的 key 字段）' },
        confirm: { type: 'boolean', description: '必须为 true 才执行删除' }
      },
      required: ['key', 'confirm'],
      additionalProperties: false
    }
  },
  {
    name: 'picui_list_albums',
    description: '分页列出图床中的相册（ID、名称、图片数等）。',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: '页码，默认 1' },
        per_page: { type: 'number', description: '每页数量，默认 20' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'picui_delete_album',
    description: '按 ID 删除图床中的一个相册。不可恢复，必须显式传 confirm: true。',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '相册 ID' },
        confirm: { type: 'boolean', description: '必须为 true 才执行删除' }
      },
      required: ['id', 'confirm'],
      additionalProperties: false
    }
  }
];

function needConfirm(args, what) {
  if (args.confirm !== true) {
    throw new Error(`${what} 是不可恢复操作：请先向用户说明后果，确认后在调用中带上 "confirm": true 重新执行`);
  }
}

async function callTool(name, args = {}) {
  switch (name) {
    case 'picui_profile':
      return apiCall('GET', '/profile');

    case 'picui_list_images':
      return apiCall('GET', '/images', {
        query: {
          page: args.page ?? 1,
          per_page: Math.min(args.per_page ?? 20, 100),
          album_id: args.album_id
        }
      });

    case 'picui_upload_image': {
      const file = resolve(String(args.path));
      if (!existsSync(file)) throw new Error(`文件不存在：${file}`);
      const size = statSync(file).size;
      if (size > MAX_UPLOAD_BYTES) {
        throw new Error(`文件 ${(size / 1024 / 1024).toFixed(1)}MB 超过单文件上限 20MB`);
      }
      const form = new FormData();
      form.append('file', new Blob([readFileSync(file)]), basename(file));
      if (args.permission !== undefined) form.append('permission', String(args.permission));
      if (args.album_id !== undefined && args.album_id !== null) form.append('album_id', String(args.album_id));
      if (args.expired_at) form.append('expired_at', String(args.expired_at));
      return apiCall('POST', '/upload', { form });
    }

    case 'picui_delete_image':
      needConfirm(args, `删除图片 ${args.key}`);
      return apiCall('DELETE', `/images/${encodeURIComponent(String(args.key))}`);

    case 'picui_list_albums':
      return apiCall('GET', '/albums', {
        query: { page: args.page ?? 1, per_page: args.per_page ?? 20 }
      });

    case 'picui_delete_album':
      needConfirm(args, `删除相册 ${args.id}`);
      return apiCall('DELETE', `/albums/${encodeURIComponent(String(args.id))}`);

    default:
      throw new Error(`未知工具：${name}`);
  }
}

// ---- JSON-RPC 2.0 over stdio（按行分隔） ----

function write(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function ok(id, result) {
  write({ jsonrpc: '2.0', id, result });
}

function fail(id, code, message) {
  write({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handle(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      ok(id, {
        protocolVersion: params?.protocolVersion || '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: NAME, title: 'PicUI 图床', version: VERSION }
      });
      return;
    case 'ping':
      ok(id, {});
      return;
    case 'tools/list':
      ok(id, { tools: TOOLS });
      return;
    case 'tools/call': {
      try {
        const data = await callTool(params?.name, params?.arguments || {});
        ok(id, {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: false
        });
      } catch (e) {
        ok(id, { content: [{ type: 'text', text: `工具执行失败：${e.message}` }], isError: true });
      }
      return;
    }
    default:
      if (method.startsWith('notifications/')) return; // 通知无需应答
      if (id !== undefined && id !== null) fail(id, -32601, `未知方法：${method}`);
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).replace(/\r$/, '').trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      fail(null, -32700, 'JSON 解析失败');
      continue;
    }
    handle(req).catch((e) => {
      if (req?.id !== undefined && req?.id !== null) {
        fail(req.id, -32603, `内部错误：${e.message}`);
      }
    });
  }
});
process.stdin.on('end', () => process.exit(0));
process.stdin.on('error', () => process.exit(1));
