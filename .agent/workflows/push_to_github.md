---
description: Push code to GitHub
---
1. Initialize Git (if not done)
```bash
git init
```
2. Add all files to staging
```bash
git add .
```
3. Commit changes
```bash
git commit -m "Update codebase for Netlify deployment"
```
4. Create a new repository on GitHub (Website Only)
   - Go to github.com/new
   - Name it `hired-os`
   - Don't add README/gitignore (you have them)
   - Copy the HTTPS URL (e.g., `https://github.com/username/repo.git`)

5. Add remote (Replace URL with yours)
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
```
   - *If origin already exists, use:* `git remote set-url origin <YOUR_GITHUB_REPO_URL>`

6. Push to main branch
```bash
git branch -M main
git push -u origin main
```
