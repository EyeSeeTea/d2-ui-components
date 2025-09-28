#!/bin/bash
set -e -u -o pipefail

version=$(cat package.json | jq -r '.version')
publish_opts=$(echo "$version" | grep -q beta && echo "--tag beta" || true)

rm -rf build
yarn install
yarn build
yarn publish $publish_opts --new-version "$version" build/

git tag "v$version" -f -m "Release version $version"
git push --tags
