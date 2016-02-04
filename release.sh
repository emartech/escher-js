#!/bin/bash

# update patch version (like 0.2.4 -> 0.2.5)
npm version patch

# upload the new version
npm publish

# push to github
git push origin master --tags