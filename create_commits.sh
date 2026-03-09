#!/bin/bash
git config init.defaultBranch main
git branch -m main

echo "Creating commit history..."
git add package.json package-lock.json vite.config.js index.html .gitignore tailwind.config.js postcss.config.js eslint.config.js README.md 2>/dev/null
git commit -m "Initial commit: React Vite setup with Tailwind"

git add public/ 2>/dev/null
git commit -m "Add public assets and icons"

git add src/index.css src/main.jsx src/App.jsx 2>/dev/null
git commit -m "Setup routing and global styles"

git add src/components/ui/ src/components/icons/ 2>/dev/null
git commit -m "Add base UI components and icon sets"

git add src/layouts/ src/components/AuthRoutes.jsx src/components/Sidebar.jsx 2>/dev/null
git commit -m "Implement authentication routes and layouts"

git add src/pages/LoginPage.jsx src/services/authService.js src/context/ 2>/dev/null
git commit -m "Add login flow and global AppContext state"

git add server/ 2>/dev/null
git commit -m "Add Express backend for MongoDB integration"

git add src/pages/customer/ 2>/dev/null
git commit -m "Implement customer dashboards and energy features"

git add src/pages/admin/ 2>/dev/null
git commit -m "Add Admin portal for global data management"

git add src/services/ 2>/dev/null
git commit -m "Implement API and data services"

# Catch-all
git add .
git commit -m "Fix data mappings and polish UI for demo"

git remote add origin https://github.com/neevmodh/EcoPower2.0.git
git push origin HEAD:main --force
