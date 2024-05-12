#!/usr/bin/env bash

set -eEuo pipefail

fatal() {
	>&2 echo "$@"
	exit 1
}

original=$(git branch --show-current)
branches="${@:-$original}"

for branch in $branches; do
	if ! git rev-parse --verify "$branch" &>/dev/null; then
		fatal "$0: error: could not find branch $branch"
	fi
done

echo -n "Deploying branches: $branches ?"
read x;

git checkout -B main base
git merge --no-ff --no-edit $branches
git push -f origin main:main
git checkout "$original"
