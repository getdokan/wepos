# wePOS release process

### Step 1: Cloning & Checking out
- Clone the repository, checkout to `develop`
- `git pull` for any latest changes

### Step 2: Git flow
- Make sure to have `git flow` installed
- Run `git flow init`
- Run `git flow release start <version>` [ version should be incremented by 1 from the last release ]

### Step 3: Change wePOS files
- Change the `version`, `WC tested up to` in `wepos/wepos.php`
- Change the `Tested up to`, `WC tested up to`, `Stable tag` in `wepos/readme.txt`
- Change the `wepos/readme.md` file according to the new version
- Change the `version` in `wepos/package.json`

### Step 4: Building and Make zip
- Run `npm install`
- Run `npm run build`
- Run `npm run zip`

### Step 5: Get the zip file tested
- The zip should be tested by the QA team

### Step 6: Release
- Run `git flow release finish <version>`
- Run `git push`
- Run `git checkout master`
- Run `git push`
- Run `git push --tags`

### Step 7: Update the stable tag
- Draft a new release on GitHub
- Select current tag
- Update changelog
- Publish the release
