/**
 * Dify AI Service
 * Production-ready integration with Dify API
 * Supports both Chatflow and Workflow app types
 * @see https://docs.dify.ai/en/use-dify/publish/developing-with-apis
 */

class DifyService {
    constructor() {
        this.apiKey = process.env.DIFY_API_KEY;
        this.baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
        // App type: 'chatflow' (default) or 'workflow'
        this.appType = process.env.DIFY_APP_TYPE || 'chatflow';
        this.isEnabled = false;
        this.debug = process.env.DIFY_DEBUG === 'true';
    }

    initialize() {
        if (this.apiKey) {
            this.isEnabled = true;
            console.log('✅ Dify AI Service initialized');
            console.log(`   App Type: ${this.appType}`);
            console.log(`   Base URL: ${this.baseUrl}`);
            console.log(`   API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
            console.log(`   Debug Mode: ${this.debug ? 'ON' : 'OFF'}`);
            return true;
        }
        console.warn('⚠️  Dify API key not found. AI Chat service disabled.');
        console.warn('   To enable: Set DIFY_API_KEY in your .env file');
        console.warn('   Get API key from: https://dify.ai -> Your App -> API -> API Key');
        return false;
    }

    /**
     * Log debug information
     */
    log(...args) {
        if (this.debug) {
            console.log('[Dify Debug]', ...args);
        }
    }

    /**
     * Send a chat message to Dify AI
     * Works for both Chatflow and Workflow apps
     */
    async sendChatMessage({ query, userId, conversationId = '', inputs = {} }) {
        if (!this.isEnabled) {
            return {
                success: false,
                error: 'AI service not configured',
                message: 'Dify API key is not set. Please contact administrator.'
            };
        }

        // Choose endpoint based on app type
        if (this.appType === 'workflow') {
            return this.runWorkflow({ query, userId, inputs });
        }

        // Default: Chatflow/Chatbot
        return this.sendChatflowMessage({ query, userId, conversationId, inputs });
    }

    /**
     * Send message to Chatflow/Chatbot app
     * Endpoint: POST /chat-messages
     */
    async sendChatflowMessage({ query, userId, conversationId = '', inputs = {} }) {
        try {
            const endpoint = `${this.baseUrl}/chat-messages`;
            const body = {
                inputs,
                query,
                response_mode: 'blocking',
                conversation_id: conversationId,
                user: userId
            };

            console.log(`🤖 Dify Chatflow: Sending request to ${endpoint}`);
            this.log('Chatflow Request:', { endpoint, body });

            const startTime = Date.now();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const responseTime = Date.now() - startTime;
            console.log(`🤖 Dify Chatflow: Response received in ${responseTime}ms, Status: ${response.status}`);

            const data = await response.json();
            this.log('Chatflow Response:', { status: response.status, data });

            if (!response.ok) {
                console.error('❌ Dify Chatflow Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.message || data.error,
                    details: data
                });
                return {
                    success: false,
                    error: 'AI service error',
                    message: data.message || data.error || 'Failed to get AI response',
                    statusCode: response.status,
                    details: data
                };
            }

            console.log(`✅ Dify Chatflow: Success! Answer length: ${data.answer?.length || 0} chars`);
            if (data.conversation_id) {
                console.log(`   Conversation ID: ${data.conversation_id}`);
            }

            return {
                success: true,
                answer: data.answer,
                conversationId: data.conversation_id,
                messageId: data.message_id,
                metadata: {
                    usage: data.metadata?.usage,
                    retrieverResources: data.metadata?.retriever_resources
                }
            };
        } catch (error) {
            console.error('❌ Dify Chatflow Connection Error:', error.message);
            console.error('   Stack:', error.stack);
            if (error.code) {
                console.error('   Error Code:', error.code);
            }
            return {
                success: false,
                error: 'Connection error',
                message: `Failed to connect to AI service: ${error.message}. Please check DIFY_BASE_URL and network connection.`
            };
        }
    }

    /**
     * Run Workflow app
     * Endpoint: POST /workflows/run
     * Use this for Workflow apps with custom data/knowledge
     */
    async runWorkflow({ query, userId, inputs = {} }) {
        try {
            const endpoint = `${this.baseUrl}/workflows/run`;

            // For workflow, query goes into inputs
            const body = {
                inputs: {
                    ...inputs,
                    query: query,  // Many workflows expect 'query' as input
                    user_input: query,  // Alternative input name
                    question: query  // Another common input name
                },
                response_mode: 'blocking',
                user: userId
            };

            this.log('Workflow Request:', { endpoint, body });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            this.log('Workflow Response:', { status: response.status, data });

            if (!response.ok) {
                console.error('Dify Workflow Error:', data);
                return {
                    success: false,
                    error: 'AI service error',
                    message: data.message || data.error || 'Failed to run workflow',
                    statusCode: response.status,
                    details: data
                };
            }

            // Workflow response structure is different
            // data.data.outputs contains the output variables
            const outputs = data.data?.outputs || {};
            const answer = outputs.answer || outputs.text || outputs.result || outputs.output ||
                JSON.stringify(outputs);

            return {
                success: true,
                answer: answer,
                workflowRunId: data.workflow_run_id,
                taskId: data.task_id,
                metadata: {
                    status: data.data?.status,
                    outputs: outputs,
                    totalTokens: data.data?.total_tokens,
                    totalSteps: data.data?.total_steps,
                    createdAt: data.data?.created_at,
                    finishedAt: data.data?.finished_at
                }
            };
        } catch (error) {
            console.error('Dify Workflow Error:', error.message);
            return {
                success: false,
                error: 'Connection error',
                message: 'Failed to connect to AI service. Please try again.'
            };
        }
    }

    /**
     * Send a chat message with streaming response
     * Works for both Chatflow and Workflow
     */
    async sendChatMessageStreaming({ query, userId, conversationId = '', inputs = {} }, onMessage, onComplete, onError) {
        if (!this.isEnabled) {
            onError({ error: 'AI service not configured' });
            return;
        }

        if (this.appType === 'workflow') {
            return this.runWorkflowStreaming({ query, userId, inputs }, onMessage, onComplete, onError);
        }

        return this.sendChatflowMessageStreaming({ query, userId, conversationId, inputs }, onMessage, onComplete, onError);
    }

    /**
     * Streaming for Chatflow app
     */
    async sendChatflowMessageStreaming({ query, userId, conversationId = '', inputs = {} }, onMessage, onComplete, onError) {
        try {
            const response = await fetch(`${this.baseUrl}/chat-messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs,
                    query,
                    response_mode: 'streaming',
                    conversation_id: conversationId,
                    user: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                onError({ error: errorData.message || 'AI service error' });
                return;
            }

            await this.processStreamResponse(response, onMessage, onComplete, onError, conversationId);
        } catch (error) {
            console.error('Dify Chatflow Streaming Error:', error.message);
            onError({ error: 'Connection error' });
        }
    }

    /**
     * Streaming for Workflow app
     */
    async runWorkflowStreaming({ query, userId, inputs = {} }, onMessage, onComplete, onError) {
        try {
            const response = await fetch(`${this.baseUrl}/workflows/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {
                        ...inputs,
                        query: query,
                        user_input: query,
                        question: query
                    },
                    response_mode: 'streaming',
                    user: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                onError({ error: errorData.message || 'Workflow error' });
                return;
            }

            await this.processWorkflowStreamResponse(response, onMessage, onComplete, onError);
        } catch (error) {
            console.error('Dify Workflow Streaming Error:', error.message);
            onError({ error: 'Connection error' });
        }
    }

    /**
     * Process SSE stream response for Chatflow
     */
    async processStreamResponse(response, onMessage, onComplete, onError, conversationId) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let finalConversationId = conversationId;
        let finalMessageId = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        this.log('Stream event:', data.event);

                        if (data.event === 'message' || data.event === 'agent_message') {
                            fullAnswer += data.answer || '';
                            onMessage({
                                chunk: data.answer,
                                fullAnswer,
                                conversationId: data.conversation_id
                            });
                            finalConversationId = data.conversation_id;
                            finalMessageId = data.message_id;
                        } else if (data.event === 'message_end') {
                            finalConversationId = data.conversation_id;
                            finalMessageId = data.message_id;
                        } else if (data.event === 'error') {
                            onError({ error: data.message });
                            return;
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        onComplete({
            answer: fullAnswer,
            conversationId: finalConversationId,
            messageId: finalMessageId
        });
    }

    /**
     * Process SSE stream response for Workflow
     */
    async processWorkflowStreamResponse(response, onMessage, onComplete, onError) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let workflowRunId = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        this.log('Workflow stream event:', data.event);

                        if (data.event === 'text_chunk') {
                            fullAnswer += data.data?.text || '';
                            onMessage({
                                chunk: data.data?.text,
                                fullAnswer
                            });
                        } else if (data.event === 'workflow_started') {
                            workflowRunId = data.workflow_run_id;
                        } else if (data.event === 'workflow_finished') {
                            const outputs = data.data?.outputs || {};
                            fullAnswer = outputs.answer || outputs.text || outputs.result || fullAnswer;
                        } else if (data.event === 'error') {
                            onError({ error: data.message });
                            return;
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        onComplete({
            answer: fullAnswer,
            workflowRunId
        });
    }

    /**
     * Get conversation history from Dify (Chatflow only)
     */
    async getConversationHistory(conversationId, userId) {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/messages?conversation_id=${conversationId}&user=${userId}&limit=100`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                return { success: false, error: 'Failed to fetch history' };
            }

            const data = await response.json();
            return {
                success: true,
                messages: data.data || [],
                hasMore: data.has_more
            };
        } catch (error) {
            console.error('Dify History Error:', error.message);
            return { success: false, error: 'Connection error' };
        }
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId, userId) {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/conversations/${conversationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user: userId })
                }
            );

            return { success: response.ok };
        } catch (error) {
            console.error('Dify Delete Error:', error.message);
            return { success: false, error: 'Connection error' };
        }
    }

    /**
     * Rename a conversation
     */
    async renameConversation(conversationId, name, userId) {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/conversations/${conversationId}/name`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, user: userId })
                }
            );

            if (!response.ok) {
                return { success: false, error: 'Failed to rename conversation' };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Dify Rename Error:', error.message);
            return { success: false, error: 'Connection error' };
        }
    }

    /**
     * Get suggested questions for follow-up
     */
    async getSuggestedQuestions(messageId, userId) {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/messages/${messageId}/suggested?user=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                return { success: false, suggestions: [] };
            }

            const data = await response.json();
            return { success: true, suggestions: data.data || [] };
        } catch (error) {
            return { success: false, suggestions: [] };
        }
    }

    /**
     * Submit feedback for a message
     */
    async submitFeedback(messageId, rating, userId) {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/messages/${messageId}/feedbacks`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ rating, user: userId })
                }
            );

            return { success: response.ok };
        } catch (error) {
            return { success: false, error: 'Connection error' };
        }
    }

    /**
     * Get application parameters/info
     */
    async getAppInfo() {
        if (!this.isEnabled) {
            return { success: false, error: 'AI service not configured' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/parameters`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return { success: false, error: 'Failed to get app info', details: error };
            }

            const data = await response.json();
            return {
                success: true,
                appType: this.appType,
                ...data
            };
        } catch (error) {
            return { success: false, error: 'Connection error' };
        }
    }

    /**
     * Test connection to Dify
     */
    async testConnection() {
        console.log('\n🧪 Testing Dify Connection...');
        console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
        console.log(`   Base URL: ${this.baseUrl}`);
        console.log(`   App Type: ${this.appType}`);

        if (!this.isEnabled) {
            return { success: false, error: 'API key not configured' };
        }

        // Test by getting app info
        const result = await this.getAppInfo();
        console.log('   Result:', result.success ? '✅ Connected' : `❌ Failed: ${result.error}`);
        if (result.details) {
            console.log('   Details:', result.details);
        }

        return result;
    }

    /**
     * Check if service is available
     */
    isAvailable() {
        return this.isEnabled;
    }

    /**
     * Get current app type
     */
    getAppType() {
        return this.appType;
    }
}

module.exports = new DifyService();
