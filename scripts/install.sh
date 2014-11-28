#!/usr/bin/env bash

cd `dirname $0`

./docker-exec.sh bower --allow-root --config.interactive=false install; npm install
