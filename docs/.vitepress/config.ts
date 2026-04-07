import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Prompt Manager',
  description: 'Self-hosted AI prompt management tool',
  base: '/prompt-manager/',

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
          { text: 'GitHub', link: 'https://github.com/XimilalaXiang/prompt-manager' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Introduction',
              items: [
                { text: 'What is Prompt Manager?', link: '/guide/' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Configuration', link: '/guide/configuration' }
              ]
            },
            {
              text: 'Features',
              items: [
                { text: 'Prompt Management', link: '/guide/prompts' },
                { text: 'Multi-Model Comparison', link: '/guide/comparison' },
                { text: 'Knowledge Base', link: '/guide/knowledge' },
                { text: 'Import & Export', link: '/guide/import-export' }
              ]
            },
            {
              text: 'Deployment',
              items: [
                { text: 'Docker', link: '/guide/docker' },
                { text: 'Development', link: '/guide/development' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/api/' },
                { text: 'Authentication', link: '/api/auth' },
                { text: 'Prompts', link: '/api/prompts' },
                { text: 'Categories', link: '/api/categories' },
                { text: 'AI Configs', link: '/api/ai-configs' },
                { text: 'Comparison', link: '/api/comparison' },
                { text: 'Knowledge', link: '/api/knowledge' },
                { text: 'Conversations', link: '/api/conversations' },
                { text: 'Settings', link: '/api/settings' },
                { text: 'Import & Export', link: '/api/import-export' }
              ]
            }
          ]
        }
      }
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: 'API', link: '/zh/api/' },
          { text: 'GitHub', link: 'https://github.com/XimilalaXiang/prompt-manager' }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '介绍',
              items: [
                { text: '什么是 Prompt Manager？', link: '/zh/guide/' },
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '配置说明', link: '/zh/guide/configuration' }
              ]
            },
            {
              text: '功能',
              items: [
                { text: '提示词管理', link: '/zh/guide/prompts' },
                { text: '多模型对比', link: '/zh/guide/comparison' },
                { text: '知识库', link: '/zh/guide/knowledge' },
                { text: '导入导出', link: '/zh/guide/import-export' }
              ]
            },
            {
              text: '部署',
              items: [
                { text: 'Docker 部署', link: '/zh/guide/docker' },
                { text: '本地开发', link: '/zh/guide/development' }
              ]
            }
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '概览', link: '/zh/api/' },
                { text: '认证', link: '/zh/api/auth' },
                { text: '提示词', link: '/zh/api/prompts' },
                { text: '分类', link: '/zh/api/categories' },
                { text: 'AI 配置', link: '/zh/api/ai-configs' },
                { text: '模型对比', link: '/zh/api/comparison' },
                { text: '知识库', link: '/zh/api/knowledge' },
                { text: '对话', link: '/zh/api/conversations' },
                { text: '系统设置', link: '/zh/api/settings' },
                { text: '导入导出', link: '/zh/api/import-export' }
              ]
            }
          ]
        }
      }
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/XimilalaXiang/prompt-manager' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  }
})
