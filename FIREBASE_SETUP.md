# Firebase Setup Guide for Agilow

This guide will help you set up Firebase for the Agilow application with all the necessary services and configurations.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `agilow-goal-forge` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create the project

## Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" provider
3. Enable "Google" provider
4. Add your domain to authorized domains

### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll update rules later)
4. Select a location close to your users

### Cloud Functions
1. Go to "Functions"
2. Click "Get started"
3. Follow the setup instructions

## Step 3: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 4: Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Trello Configuration
VITE_TRELLO_API_KEY=your_trello_api_key
VITE_TRELLO_TOKEN=your_trello_token

# Slack Configuration
VITE_SLACK_BOT_TOKEN=your_slack_bot_token
VITE_SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Step 5: Deploy Cloud Functions

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init`
4. Select:
   - Functions: Configure and deploy Cloud Functions
   - Firestore: Configure security rules and indexes files
   - Hosting: Configure files for Firebase Hosting
5. Deploy functions: `firebase deploy --only functions`

## Step 6: Set Up External Services

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env` file

### Trello Integration
1. Go to [Trello Developers](https://developer.atlassian.com/cloud/trello/)
2. Create an API key
3. Get a token for your account
4. Add both to your `.env` file

### Slack Integration
1. Go to [Slack API](https://api.slack.com/)
2. Create a new app
3. Get a bot token
4. Set up a webhook URL
5. Add both to your `.env` file

## Step 7: Configure Firebase Functions

Set up environment variables for Cloud Functions:

```bash
firebase functions:config:set openai.api_key="your_openai_api_key"
firebase functions:config:set trello.api_key="your_trello_api_key"
firebase functions:config:set trello.token="your_trello_token"
firebase functions:config:set slack.bot_token="your_slack_bot_token"
firebase functions:config:set slack.webhook_url="your_slack_webhook_url"
```

## Step 8: Deploy Everything

```bash
# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy hosting (if using Firebase Hosting)
firebase deploy --only hosting
```

## Step 9: Initialize Badges

After deployment, you'll need to initialize the badges in Firestore. You can do this by:

1. Running the app
2. The badges will be automatically created when the gamification service is first used
3. Or manually add them through the Firebase Console

## Step 10: Test the Setup

1. Start your development server: `npm run dev`
2. Try creating an account
3. Create a test goal
4. Check that:
   - User profile is created in Firestore
   - Goal is processed by AI
   - Trello board is created (if configured)
   - Slack notification is sent (if configured)
   - XP is awarded

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check that your domain is added to authorized domains in Firebase Auth
2. **Functions not deploying**: Make sure you're logged in to Firebase CLI and have the correct project selected
3. **Environment variables not working**: Ensure all variables start with `VITE_` for client-side access
4. **CORS errors**: Check that your domain is properly configured in Firebase

### Useful Commands

```bash
# View function logs
firebase functions:log

# Test functions locally
firebase emulators:start

# Deploy specific function
firebase deploy --only functions:functionName
```

## Security Notes

1. Update Firestore rules before going to production
2. Use Firebase App Check for additional security
3. Set up proper CORS policies
4. Regularly rotate API keys
5. Monitor function usage and costs

## Production Deployment

1. Set up a production Firebase project
2. Configure custom domain
3. Set up monitoring and alerts
4. Implement proper error handling
5. Set up backup strategies

For more detailed information, refer to the [Firebase Documentation](https://firebase.google.com/docs).

