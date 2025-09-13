import * as functions from 'firebase-functions';
import axios from 'axios';

export const sendSlackNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { goalId, goalTitle, trelloBoardUrl } = data;
    
    if (!goalId || !goalTitle) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const slackWebhookUrl = functions.config().slack?.webhook_url || process.env.SLACK_WEBHOOK_URL;
    const slackBotToken = functions.config().slack?.bot_token || process.env.SLACK_BOT_TOKEN;

    if (!slackWebhookUrl && !slackBotToken) {
      console.warn('Slack credentials not configured, skipping Slack notification');
      return { success: false, message: 'Slack not configured' };
    }

    const message = {
      text: `🎯 New Goal Added: "${goalTitle}"`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 New Goal Added!"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Goal:* ${goalTitle}\n*User:* ${context.auth.displayName || context.auth.email}\n*Created:* ${new Date().toLocaleString()}`
          }
        }
      ]
    };

    // Add Trello board link if available
    if (trelloBoardUrl) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📋 *Trello Board:* <${trelloBoardUrl}|View Goal Board>`
        }
      });
    }

    // Add action buttons
    message.blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View in Agilow"
          },
          url: `https://agilow.app/dashboard?goal=${goalId}`,
          style: "primary"
        }
      ]
    });

    let success = false;

    // Try webhook first
    if (slackWebhookUrl) {
      try {
        await axios.post(slackWebhookUrl, message);
        success = true;
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }
    }

    // Try bot token if webhook failed
    if (!success && slackBotToken) {
      try {
        // Get channel ID (you might want to store this in config)
        const channelId = functions.config().slack?.channel_id || process.env.SLACK_CHANNEL_ID || '#general';
        
        await axios.post('https://slack.com/api/chat.postMessage', {
          channel: channelId,
          ...message
        }, {
          headers: {
            'Authorization': `Bearer ${slackBotToken}`,
            'Content-Type': 'application/json'
          }
        });
        success = true;
      } catch (botError) {
        console.error('Bot token failed:', botError);
      }
    }

    return {
      success,
      message: success ? 'Slack notification sent' : 'Failed to send Slack notification'
    };

  } catch (error) {
    console.error('Error sending Slack notification:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Don't throw error for Slack integration failures, just log and continue
    console.warn('Slack integration failed, continuing without it');
    return { success: false, message: 'Slack integration failed' };
  }
});

