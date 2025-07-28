# Claude IDE Integration Guide

This guide explains the Claude IDE integration setup for the KStoryBridge monorepo.

## 🚀 Quick Start

1. **Open the project in VS Code**
2. **Install recommended extensions** when prompted
3. **Use Claude commands** in the chat to interact with your codebase

## 📁 Configuration Files

### `.claude/settings.local.json`
- **Permissions**: Defines what commands Claude can execute
- **Workspace Context**: Provides project structure and technology stack information
- **Security**: Only allows safe, development-related commands

### `.vscode/settings.json`
- **Editor Configuration**: Format on save, auto-imports, ESLint integration
- **Tailwind CSS**: Enhanced support for Tailwind classes
- **File Associations**: Proper syntax highlighting for various file types

### `.vscode/extensions.json`
- **Recommended Extensions**: Essential tools for development
- **Auto-installation**: VS Code will prompt to install these extensions

### `.vscode/launch.json`
- **Debug Configurations**: Pre-configured debugging for both apps
- **Port Management**: Dashboard (5173) and Website (5174)

### `.vscode/tasks.json`
- **Common Tasks**: Quick access to development commands
- **Supabase Integration**: Local database management

## 🛠️ Available Commands

### Development
```bash
npm run dev:dashboard    # Start dashboard development server
npm run dev:website      # Start website development server
npm run build:all        # Build both applications
npm run lint:all         # Lint all code
```

### Database
```bash
npx supabase start       # Start local Supabase instance
npx supabase stop        # Stop local Supabase instance
npx supabase db reset    # Reset local database
```

### Git Operations
```bash
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
git status               # Check repository status
```

## 🎯 Claude Features

### Code Understanding
- **Project Structure**: Claude understands the monorepo layout
- **Technology Stack**: Aware of React, TypeScript, Vite, Supabase, Tailwind
- **File Navigation**: Can read and modify files across the workspace

### Development Assistance
- **Code Generation**: Create new components, pages, and utilities
- **Bug Fixing**: Identify and resolve issues in your code
- **Refactoring**: Improve code structure and organization
- **Testing**: Help write tests for your components

### Database Operations
- **Schema Management**: Help with Supabase migrations
- **Query Optimization**: Improve database queries
- **Data Management**: Assist with data seeding and cleanup

## 🔧 VS Code Integration

### Keyboard Shortcuts
- `Ctrl+Shift+P` (Cmd+Shift+P on Mac): Command palette
- `Ctrl+Shift+E` (Cmd+Shift+E on Mac): Explorer
- `Ctrl+Shift+G` (Cmd+Shift+G on Mac): Git panel
- `Ctrl+Shift+D` (Cmd+Shift+D on Mac): Debug panel

### Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- Install Dependencies
- Start Dashboard Dev Server
- Start Website Dev Server
- Build All
- Lint All
- Supabase Start/Stop

### Debugging
- **Dashboard**: Debug the admin dashboard application
- **Website**: Debug the public website application
- **Current File**: Debug any Node.js file

## 📦 Recommended Extensions

### Essential
- **Tailwind CSS IntelliSense**: Enhanced Tailwind support
- **Prettier**: Code formatting
- **ESLint**: Code linting
- **TypeScript**: TypeScript support

### Development
- **Supabase**: Database management
- **GitLens**: Enhanced Git integration
- **Auto Rename Tag**: HTML/JSX tag management
- **Path Intellisense**: File path autocompletion

### Productivity
- **Todo Highlight**: Highlight TODO comments
- **Code Spell Checker**: Spell checking
- **Git Graph**: Visual Git history

## 🚨 Security Notes

- Claude can only execute development-related commands
- No access to production credentials or sensitive data
- All commands are logged and visible in the terminal
- File operations are restricted to the workspace

## 🔄 Workflow Tips

1. **Start with Context**: Tell Claude what you're working on
2. **Be Specific**: Provide clear requirements for code changes
3. **Use Tasks**: Leverage VS Code tasks for common operations
4. **Debug Effectively**: Use the debug configurations for troubleshooting
5. **Version Control**: Use Git commands through Claude for better workflow

## 📞 Support

If you encounter issues with the IDE integration:

1. Check that all recommended extensions are installed
2. Verify that the `.claude` directory exists and is properly configured
3. Ensure you have the necessary permissions for the workspace
4. Restart VS Code if configuration changes don't take effect

## 🎉 Getting Started

Try these commands to test the integration:

1. **"Show me the project structure"**
2. **"Start the dashboard development server"**
3. **"Create a new component for user profiles"**
4. **"Help me debug this TypeScript error"**

The Claude IDE integration is now fully configured and ready to enhance your development experience! 