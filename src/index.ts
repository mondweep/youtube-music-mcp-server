#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { exec, ExecException } from 'child_process';
import { z } from 'zod';
import os from 'os';

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
    throw new Error('YOUTUBE_API_KEY environment variable is required');
}

interface PlaySongArgs {
    song_name?: string;
    artist_name?: string;
}

const isValidPlaySongArgs = (args: unknown): args is PlaySongArgs => {
    const obj = args as Record<string, unknown>;
    return (
        typeof args === 'object' &&
        args !== null &&
        (obj['song_name'] === undefined || typeof obj['song_name'] === 'string') &&
        (obj['artist_name'] === undefined || typeof obj['artist_name'] === 'string')
    );
};

interface SearchResult {
    title: string;
    videoId: string;
    description: string;
}

class YoutubeMusicServer {
    private server: Server;
    preferences: Record<string, unknown>;
    log: string[];
    private youtubeApi: ReturnType<typeof axios.create>;

    constructor() {
        this.server = new Server(
            {
                name: 'youtube-music-server',
                version: '0.2.0',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            }
        );
        this.preferences = {};
        this.log = [];

        this.youtubeApi = axios.create({
            baseURL: 'https://www.googleapis.com/youtube/v3',
            params: {
                key: API_KEY,
                part: 'snippet',
                maxResults: 5,
                type: 'video',
            },
        });

        this.setupToolHandlers();

        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'play_song',
                    description: 'Play a song on Youtube Music',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            song_name: {
                                type: 'string',
                                description: 'Name of the song to play',
                            },
                            artist_name: {
                                type: 'string',
                                description: 'Name of the artist',
                            },
                        },
                        required: ['song_name'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'play_song') {
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${request.params.name}`
                );
            }

            if (!isValidPlaySongArgs(request.params.arguments)) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    'Invalid play_song arguments'
                );
            }

            const { song_name, artist_name } = request.params.arguments;
            const searchQuery = artist_name ? `${song_name} ${artist_name}` : song_name;

            this.log.push(`Searching for song: ${searchQuery}`);

            try {
                const response = await this.youtubeApi.get('/search', {
                    params: {
                        q: searchQuery,
                    },
                });

                const searchResults = response.data.items.map((item: {
                    snippet: { title: string; description: string };
                    id: { videoId: string };
                }): SearchResult => ({
                    title: item.snippet.title,
                    videoId: item.id.videoId,
                    description: item.snippet.description,
                }));
                console.error(`Search results: ${JSON.stringify(searchResults, null, 2)}`);

                if (searchResults.length > 0) {
                    const topResultVideoId = searchResults[0].videoId;
                    const youtubeMusicUrl = `https://music.youtube.com/watch?v=${topResultVideoId}`;
                    
                    // Get platform-specific command
                    const platform = os.platform();
                    let command: string;
                    
                    if (platform === 'darwin') {
                        // macOS
                        const appleScript = `
                            tell application "Google Chrome"
                                activate
                                open location "${youtubeMusicUrl}"
                            end tell
                        `;
                        command = `osascript -e '${appleScript}'`;
                    } else if (platform === 'win32') {
                        // Windows
                        command = `start chrome "${youtubeMusicUrl}"`;
                    } else {
                        // Linux or other platforms
                        this.log.push(`Platform ${platform} not supported yet`);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Found song: ${searchResults[0].title}, but auto-opening Chrome is not supported on ${platform}. Please visit: ${youtubeMusicUrl}`
                                }
                            ]
                        };
                    }
                    
                    exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
                        if (error) {
                            this.log.push(`Error opening song in Chrome: ${error.message}`);
                            throw new McpError(
                                ErrorCode.InternalError, 
                                `Error opening song in Chrome: ${error.message}`
                            );
                        } else {
                            this.log.push(`Opened song in Chrome: ${youtubeMusicUrl}`);
                        }
                    });

                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Playing top result: ${searchResults[0].title}`
                            }
                        ]
                    };
                } else {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `No search results found for: ${searchQuery}`
                            }
                        ]
                    };
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log.push(`Error searching for song: ${errorMessage}`);
                throw new McpError(
                    ErrorCode.InternalError,
                    `Error searching for song: ${errorMessage}`
                );
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Youtube Music MCP server running on stdio');
    }
}

const server = new YoutubeMusicServer();
server.run().catch(console.error);
