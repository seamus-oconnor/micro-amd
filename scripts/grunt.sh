#!/usr/bin/env bash

cd `dirname $0`

./docker-exec.sh grunt $@
