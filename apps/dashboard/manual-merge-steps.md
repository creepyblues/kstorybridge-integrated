# Manual Merge Steps

## 1. Create Monorepo Structure
```bash
cd /Users/sungholee/code
mkdir -p kstorybridge-monorepo/apps
mkdir -p kstorybridge-monorepo/packages
```

## 2. Move Applications
```bash
# Move dashboard app
cp -r dashboard-kstorybridge-main kstorybridge-monorepo/apps/dashboard

# Move website app  
cp -r story-bridge-site-main kstorybridge-monorepo/apps/website
```

## 3. Create Root Package.json
```bash
cd kstorybridge-monorepo

cat > package.json << 'EOF'
{
  "name": "kstorybridge-monorepo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:dashboard": "npm run dev --workspace=apps/dashboard",
    "dev:website": "npm run dev --workspace=apps/website",
    "build:dashboard": "npm run build --workspace=apps/dashboard",
    "build:website": "npm run build --workspace=apps/website",
    "build:all": "npm run build:dashboard && npm run build:website",
    "lint:all": "npm run lint --workspace=apps/dashboard && npm run lint --workspace=apps/website",
    "install:all": "npm install"
  },
  "devDependencies": {
    "@types/node": "^22.5.5",
    "typescript": "^5.5.3"
  }
}
EOF
```

## 4. Update Package Names
```bash
cd apps/dashboard
npm pkg set name="@kstorybridge/dashboard"

cd ../website  
npm pkg set name="@kstorybridge/website"
```

## 5. Install Dependencies
```bash
cd /Users/sungholee/code/kstorybridge-monorepo
npm install
```

## 6. Test Applications
```bash
# Test dashboard
npm run dev:dashboard

# Test website (in separate terminal)
npm run dev:website
```